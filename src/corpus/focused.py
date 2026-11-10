"""Inspect the isolated, query-locked candidate for a complete focused corpus."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sqlite3
from datetime import date
from pathlib import Path

import yaml

from src.corpus.partitions import partition_plan, query_for, work_filters
from src.corpus.scope import edition_topics
from src.scripts.collect_openalex_data import WORK_FIELDS

CONFIG = Path('data/config/focused-corpus.yaml')
DB = Path('.cache/corpus/focused.sqlite')
MANIFEST = Path('data/research/research-manifest.json')
SELECT_FIELDS = WORK_FIELDS + ',referenced_works,updated_date,is_retracted'


def year_db(year: int) -> Path:
    return DB.with_name(f'focused-{year}.sqlite')


def focused_spent_today(directory: Path = DB.parent) -> float:
    """Sum local usage across pilot and year shards to bound one project's calls."""
    total = 0.0
    for path in directory.glob('focused*.sqlite'):
        with sqlite3.connect(f'file:{path}?mode=ro', uri=True) as db:
            row = db.execute("SELECT usd FROM usage WHERE day=date('now')").fetchone()
            total += row[0] if row else 0.0
    return total


def validate_year_checkpoint(db: sqlite3.Connection, topics: list[dict], start_year: int,
                             year: int) -> None:
    """Never resume a shard with another year's or another query's cursors."""
    expected = {item['id'] for item in partition_plan(topics, start_year) if item['year'] == year}
    stored = {row[0] for row in db.execute('SELECT id FROM partitions')}
    if not stored <= expected:
        raise ValueError('Focused checkpoint contains obsolete or wrong-year query boundaries')


def signature(topics: list[dict]) -> str:
    """Fingerprint all source-side boundaries except the year itself."""
    boundaries = [
        {'slug': topic['slug'], 'query': query_for(topic),
         'filter': work_filters(topic, 'publication_year:YYYY'),
         'select': SELECT_FIELDS}
        for topic in topics
    ]
    return hashlib.sha256(json.dumps(boundaries, sort_keys=True).encode()).hexdigest()[:20]


def focused_topics(config_path: Path = CONFIG) -> tuple[dict, list[dict]]:
    policy = yaml.safe_load(config_path.read_text())
    slugs = policy.get('topics')
    if not isinstance(slugs, list) or not slugs or len(slugs) != len(set(slugs)):
        raise ValueError('Focused topic slugs must be a nonempty, unique list')
    if not isinstance(policy.get('start_year'), int) or not 2017 <= policy['start_year'] <= date.today().year:
        raise ValueError('Focused start year is invalid')
    configured = {topic['slug']: topic for topic in edition_topics()}
    unknown = set(slugs) - set(configured)
    if unknown:
        raise ValueError('Unknown focused topics: ' + ', '.join(sorted(unknown)))
    topics = [configured[slug] for slug in slugs]
    if signature(topics) != policy.get('query_signature'):
        raise ValueError('Focused query boundary changed; version and reconcile it deliberately')
    return policy, topics


def annual_estimate(policy: dict, topics: list[dict], manifest_path: Path = MANIFEST) -> dict:
    manifest = json.loads(manifest_path.read_text())
    trends = json.loads((manifest_path.parent / manifest['base'] / 'trends.json').read_text())
    indexed = {row['slug']: row for row in trends['topics']}
    end_year = date.today().year
    years = range(policy['start_year'], end_year + 1)
    rows = []
    for topic in topics:
        row = indexed[topic['slug']]
        if row['query']['search.title_and_abstract'] != query_for(topic):
            raise ValueError(f'Stale annual query for {topic["slug"]}')
        expected_filter = work_filters(topic, f'publication_year:{policy["start_year"]}-{end_year}')
        if row['query']['filter'] != expected_filter:
            raise ValueError(f'Stale annual filter for {topic["slug"]}')
        counts = {item['year']: item['works'] for item in row['years']}
        if any(year not in counts for year in years):
            raise ValueError(f'Missing annual counts for {topic["slug"]}')
        matches = sum(counts[year] for year in years)
        pages = sum(max(1, math.ceil(counts[year] / 100)) for year in years)
        rows.append({'slug': topic['slug'], 'field': topic['field'],
                     'matches': matches, 'estimatedPages': pages})
    return {'version': policy['version'], 'status': policy['status'],
            'startYear': policy['start_year'], 'throughYear': end_year,
            'countSnapshot': manifest['snapshot'],
            'querySignature': policy['query_signature'], 'topics': rows,
            'topicYearBoundaries': len(rows) * len(years),
            'topicMatchesWithOverlap': sum(row['matches'] for row in rows),
            'estimatedPages': sum(row['estimatedPages'] for row in rows),
            'estimatedApiUsd': round(sum(row['estimatedPages'] for row in rows) * .001, 3),
            'note': 'Historical annual counts estimate cursor pages; overlaps, indexing changes, retries and future records are not included.'}


def checkpoint_status(policy: dict, topics: list[dict], db_path: Path = DB) -> dict:
    plan = partition_plan(topics, policy['start_year'])
    states = {}
    if db_path.exists():
        with sqlite3.connect(f'file:{db_path}?mode=ro', uri=True) as db:
            states = {row[0]: row[1:] for row in db.execute(
                'SELECT id, expected, fetched, complete FROM partitions')}
    return _coverage_summary(policy, plan, states)


def _coverage_summary(policy: dict, plan: list[dict], states: dict) -> dict:
    by_year = {}
    for item in plan:
        row = states.get(item['id'])
        tally = by_year.setdefault(item['year'], {'boundaries': 0, 'started': 0,
                                                  'complete': 0, 'countMismatch': 0,
                                                  'fetchedTopicMemberships': 0})
        tally['boundaries'] += 1
        tally['started'] += row is not None
        tally['complete'] += bool(row and row[2])
        tally['countMismatch'] += bool(row and row[2] and row[0] != row[1])
        tally['fetchedTopicMemberships'] += row[1] if row else 0
    return {'version': policy['version'], 'querySignature': policy['query_signature'],
            **{key: sum(tally[key] for tally in by_year.values())
               for key in ('boundaries', 'started', 'complete', 'countMismatch', 'fetchedTopicMemberships')},
            'byYear': dict(sorted(by_year.items())),
            'readyForRelevanceAudit': bool(plan) and all(
                (row := states.get(item['id'])) and row[2] and row[0] == row[1] for item in plan),
            'note': 'Cursor completion is only source-query coverage; local relevance, deduplication, quality and publication checks remain.'}


def sharded_status(policy: dict, topics: list[dict]) -> dict:
    """Report only year-sharded production-candidate checkpoints, excluding pilot."""
    plan = partition_plan(topics, policy['start_year'])
    states = {}
    for year in range(policy['start_year'], date.today().year + 1):
        path = year_db(year)
        if path.exists():
            with sqlite3.connect(f'file:{path}?mode=ro', uri=True) as db:
                states.update({row[0]: row[1:] for row in db.execute(
                    'SELECT id, expected, fetched, complete FROM partitions')})
    return {**_coverage_summary(policy, plan, states),
            'spentTodayAcrossLocalShards': round(focused_spent_today(), 6),
            'scope': 'Year-sharded candidate only; the unsharded pilot is excluded from coverage but included in local usage.'}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('plan', 'status'))
    parser.add_argument('--db', type=Path, help='Inspect one explicit database, including the unsharded pilot.')
    args = parser.parse_args()
    policy, topics = focused_topics()
    report = annual_estimate(policy, topics) if args.command == 'plan' else (
        checkpoint_status(policy, topics, args.db) if args.db else sharded_status(policy, topics))
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
