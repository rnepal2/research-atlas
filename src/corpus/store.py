from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


class CorpusStore:
    """Transactions couple page ingestion and its cursor; replay is idempotent."""

    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path)
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.executescript('''
            CREATE TABLE IF NOT EXISTS works(id TEXT PRIMARY KEY, payload TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS memberships(topic TEXT, work TEXT, PRIMARY KEY(topic, work));
            CREATE TABLE IF NOT EXISTS observations(work TEXT, day TEXT, citations INTEGER, PRIMARY KEY(work, day));
            CREATE TABLE IF NOT EXISTS partitions(id TEXT PRIMARY KEY, cursor TEXT, expected INTEGER, fetched INTEGER DEFAULT 0, complete INTEGER DEFAULT 0, observed TEXT);
            CREATE TABLE IF NOT EXISTS partition_works(partition TEXT, work TEXT, PRIMARY KEY(partition, work));
            CREATE TABLE IF NOT EXISTS usage(day TEXT PRIMARY KEY, usd REAL NOT NULL);
        ''')

    def page(self, partition: str, topic: str, works: list[dict], cursor: str | None, expected: int, cost: float = 0):
        now = datetime.now(timezone.utc).isoformat()
        with self.db:
            for work in works:
                if not work.get('id'):
                    continue
                self.db.execute('INSERT OR REPLACE INTO works VALUES (?,?)', (work['id'], json.dumps(work)))
                self.db.execute('INSERT OR IGNORE INTO memberships VALUES (?,?)', (topic, work['id']))
                self.db.execute('INSERT OR IGNORE INTO partition_works VALUES (?,?)', (partition, work['id']))
                self.db.execute('INSERT OR REPLACE INTO observations VALUES (?,?,?)', (work['id'], now[:10], work.get('cited_by_count', 0)))
            self.db.execute('''INSERT INTO partitions VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
                cursor=excluded.cursor, expected=excluded.expected, fetched=excluded.fetched,
                complete=excluded.complete, observed=excluded.observed''',
                (partition, cursor, expected, self.db.execute('SELECT count(*) FROM partition_works WHERE partition=?', (partition,)).fetchone()[0], int(not cursor), now))
            self.db.execute('INSERT INTO usage VALUES (?,?) ON CONFLICT(day) DO UPDATE SET usd=usd+excluded.usd', (now[:10], cost))

    def checkpoint(self, partition: str):
        return self.db.execute('SELECT cursor,complete FROM partitions WHERE id=?', (partition,)).fetchone()

    def spent_today(self):
        row = self.db.execute('SELECT usd FROM usage WHERE day=?', (datetime.now(timezone.utc).date().isoformat(),)).fetchone()
        return row[0] if row else 0

    def close(self):
        self.db.close()
