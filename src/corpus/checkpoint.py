"""Create and restore an atomic compressed SQLite acquisition checkpoint."""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import os
import shutil
import sqlite3
import tempfile
from contextlib import closing
from pathlib import Path

from src.corpus.focused import DB


def _temporary_file(directory: Path, suffix: str) -> Path:
    handle = tempfile.NamedTemporaryFile(prefix='.focused-', suffix=suffix, dir=directory, delete=False)
    handle.close()
    return Path(handle.name)


def _check_database(path: Path) -> None:
    with closing(sqlite3.connect(f'file:{path}?mode=ro', uri=True)) as db:
        if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('SQLite checkpoint integrity check failed')
        tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        if not {'works', 'memberships', 'partitions', 'partition_works', 'usage'} <= tables:
            raise ValueError('SQLite checkpoint schema is incomplete')


def save(source: Path, output: Path) -> dict:
    if not source.is_file():
        raise FileNotFoundError(source)
    output.parent.mkdir(parents=True, exist_ok=True)
    copy = _temporary_file(output.parent, '.sqlite')
    compressed = _temporary_file(output.parent, '.sqlite.gz')
    try:
        with closing(sqlite3.connect(f'file:{source}?mode=ro', uri=True)) as live, closing(sqlite3.connect(copy)) as snapshot:
            live.backup(snapshot)
            snapshot.execute('PRAGMA journal_mode=DELETE')
        _check_database(copy)
        with copy.open('rb') as raw, gzip.open(compressed, 'wb', compresslevel=6) as zipped:
            shutil.copyfileobj(raw, zipped, length=1024 * 1024)
        checksum = hashlib.sha256()
        with compressed.open('rb') as handle:
            for block in iter(lambda: handle.read(1024 * 1024), b''):
                checksum.update(block)
        os.replace(compressed, output)
        return {'path': str(output), 'bytes': output.stat().st_size, 'sha256': checksum.hexdigest()}
    finally:
        copy.unlink(missing_ok=True)
        compressed.unlink(missing_ok=True)


def restore(archive: Path, target: Path) -> None:
    if target.exists():
        raise FileExistsError(f'Refusing to overwrite existing checkpoint: {target}')
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = _temporary_file(target.parent, '.sqlite')
    try:
        with gzip.open(archive, 'rb') as zipped, temporary.open('wb') as raw:
            shutil.copyfileobj(zipped, raw, length=1024 * 1024)
        _check_database(temporary)
        os.replace(temporary, target)
    finally:
        temporary.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('save', 'restore'))
    parser.add_argument('--db', type=Path, default=DB)
    parser.add_argument('--archive', type=Path, default=Path('.cache/corpus/focused.sqlite.gz'))
    args = parser.parse_args()
    if args.command == 'save':
        print(json.dumps(save(args.db, args.archive)))
    else:
        restore(args.archive, args.db)
        print(json.dumps({'restored': str(args.db)}))


if __name__ == '__main__':
    main()
