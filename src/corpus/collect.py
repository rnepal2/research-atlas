"""Bounded collection: python3 -m src.corpus.collect --max-pages 50."""
from __future__ import annotations

import argparse
import json
import os
import re
from datetime import date, timedelta
from collections import deque
from pathlib import Path

from src.corpus.store import CorpusStore
from src.scripts.collect_openalex_data import OpenAlexClient, OpenAlexCollectionDeferredError
from src.corpus.partitions import partition_plan, query_for  # query_for remains importable for callers


def load_local_env(path=Path('.env')):
    if path.exists():
        for line in path.read_text().splitlines():
            key, sep, value = line.partition('=')
            if sep and re.fullmatch(r'[A-Z_][A-Z0-9_]*', key.strip()):
                os.environ.setdefault(key.strip(), value.strip().strip('\"\''))


def collect(store, client, topics, max_pages=50, budget=.25, start_year=2017, recent_days=None,
            year=None, daily_spend=None):
    pages = 0
    queue = deque()
    spent = daily_spend or store.spent_today
    observed = dict(store.db.execute('SELECT id,observed FROM partitions'))
    plan = partition_plan(topics, start_year, recent_days)
    if year is not None:
        plan = [item for item in plan if item['year'] == year]
    # Fairness must survive separate invocations, not just one queue pass.
    # Unstarted boundaries go first, then the least recently observed page.
    plan.sort(key=lambda item: (observed.get(item['id']) or '', -item['year']))
    for item in plan:
        state = store.checkpoint(item['id'])
        if state and state[1]:
            continue
        cursor = state[0] if state else '*'
        if cursor:
            queue.append((item['topic'], item['year'], item['id'], item['params'], cursor))
    while queue:
        if pages >= max_pages or spent() + .002 > budget:
            return {'outcome': 'checkpointed', 'pages': pages, 'spentToday': spent()}
        slug, year, partition, params, cursor = queue.popleft()
        payload = client.get('works', {**params, 'cursor': cursor}, use_cache=False)
        rows = payload.get('results')
        count = payload.get('meta', {}).get('count')
        if not isinstance(rows, list) or not isinstance(count, int) or count < 0 or (not rows and count > 0 and cursor == '*'):
            raise ValueError(f'Invalid source page for {slug}; checkpoint was not advanced.')
        cursor = payload.get('meta', {}).get('next_cursor') if rows else None
        cost = float(payload.get('meta', {}).get('cost_usd', .001))
        store.page(partition, slug, rows, cursor, count, cost)
        pages += 1
        print(f'{slug} {year}: +{len(rows)} records; page {pages}', flush=True)
        if cursor:
            queue.append((slug, year, partition, params, cursor))
    return {'outcome': 'complete', 'pages': pages, 'spentToday': spent()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', type=Path, help='Checkpoint database; defaults to the selected edition database.')
    parser.add_argument('--focused', action='store_true', help='Collect the isolated, query-locked focused candidate.')
    parser.add_argument('--year', type=int, help='Focused backfill year; uses a separate checkpoint file.')
    parser.add_argument('--max-pages', type=int, default=50)
    parser.add_argument('--budget', type=float, default=.25)
    parser.add_argument('--start-year', type=int, default=2017)
    parser.add_argument('--reconcile', action='store_true', help='Restart completed partitions to capture late indexing and corrections.')
    parser.add_argument('--topic', action='append', help='Restrict to configured topic slugs; repeat to select several.')
    parser.add_argument('--recent-days', type=int, help='Overlapping publication-date refresh; does not detect every older metadata change.')
    args = parser.parse_args()
    if args.max_pages < 1 or args.budget <= 0:
        parser.error('--max-pages and --budget must be positive')
    if not 2017 <= args.start_year <= date.today().year:
        parser.error('--start-year must be between 2017 and the current year')
    if args.recent_days is not None and args.recent_days < 1:
        parser.error('--recent-days must be positive')
    if args.focused and (args.year is None or not args.start_year <= args.year <= date.today().year):
        parser.error('--focused requires --year between its start year and the current year')
    if args.year is not None and not args.focused:
        parser.error('--year is only supported with --focused')
    if args.focused and (args.topic or args.recent_days or args.reconcile):
        parser.error('--focused cannot be combined with --topic, --recent-days or --reconcile')
    if args.focused:
        from src.corpus.focused import focused_topics, focused_spent_today, year_db
        policy, configured = focused_topics()
        if args.start_year != policy['start_year']:
            parser.error('--focused start year must match its locked configuration')
        shard = year_db(args.year)
        if args.db and args.db.resolve() != shard.resolve():
            parser.error('The focused candidate must use its year-specific checkpoint database')
        args.db = shard
    else:
        from src.corpus.scope import edition_topics
        configured = edition_topics()
        args.db = args.db or Path('.cache/corpus/atlas.sqlite')
    unknown = set(args.topic or []) - {t['slug'] for t in configured}
    if unknown:
        parser.error('Unknown topics: ' + ', '.join(sorted(unknown)))
    topics = [t for t in configured if not args.topic or t['slug'] in args.topic]
    start_year = max(2017, (date.today() - timedelta(days=args.recent_days)).year) if args.recent_days else args.start_year
    load_local_env()
    key = os.getenv('OPENALEX_API_KEY')
    if not key:
        raise SystemExit('Set OPENALEX_API_KEY in the process environment or local .env.')
    store = CorpusStore(args.db)
    if args.reconcile:
        store.restart([item['id'] for item in partition_plan(topics, start_year, args.recent_days)])
    client = OpenAlexClient(key, Path('.cache/corpus/http'), min_interval=.7)
    try:
        print(json.dumps(collect(store, client, topics, args.max_pages, args.budget,
                                 start_year, args.recent_days, args.year,
                                 focused_spent_today if args.focused else None)))
    except OpenAlexCollectionDeferredError:
        print('Collection deferred by OpenAlex; committed pages are safe. Run again to resume.')
    finally:
        store.close()


if __name__ == '__main__':
    main()
