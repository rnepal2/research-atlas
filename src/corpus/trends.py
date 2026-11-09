"""Atomic annual query context for the same declared AI/computing edition."""
from __future__ import annotations

import argparse
import json
import os
from datetime import date, datetime, timezone
from pathlib import Path

from src.corpus.collect import load_local_env
from src.corpus.partitions import query_for, work_filters
from src.corpus.scope import edition_policy, edition_topics
from src.corpus.store import CorpusStore
from src.scripts.collect_openalex_data import OpenAlexClient

TARGET = Path('data/raw/edition-trends.json')


def annual_query(topic, year=None):
    year = year or date.today().year
    return {'search.title_and_abstract': query_for(topic), 'filter': work_filters(topic, f'publication_year:{year - 9}-{year}'),
            'group_by': 'publication_year', 'per_page': 200}


def validate_trends(payload, topics=None, current_policy=True):
    topics = topics if topics is not None else edition_topics()
    year = payload.get('throughYear')
    if payload.get('schemaVersion') != 1 or not payload.get('corpusVersion') or (current_policy and payload['corpusVersion'] != edition_policy()['version']):
        raise ValueError('Annual context edition version mismatch')
    if not isinstance(year, int) or not 2017 <= year <= date.today().year or (current_policy and year != date.today().year):
        raise ValueError('Annual context year is stale; refresh before building')
    rows = payload.get('topics', [])
    indexed = {row['slug']: row for row in rows}
    if len(indexed) != len(rows) or set(indexed) != {topic['slug'] for topic in topics}:
        raise ValueError('Incomplete annual context topic set')
    for topic in topics:
        row = indexed[topic['slug']]
        years = row.get('years', [])
        if (current_policy and row.get('query') != annual_query(topic, year)) or not row.get('observedAt') or not row.get('query'):
            raise ValueError('Annual context query does not match the edition')
        if [r.get('year') for r in years] != list(range(year - 9, year + 1)):
            raise ValueError('Missing annual context years')
        if any(type(r.get('works')) is not int or r['works'] < 0 for r in years):
            raise ValueError('Invalid annual context count')


def refresh_trends(client, topics, store, budget, target=TARGET, reuse_today=False):
    # Bound both attempts per request before starting; unrelated API use is not included.
    reserve = .002
    reusable = {}
    if reuse_today and target.exists():
        previous = json.loads(target.read_text())
        if previous.get('corpusVersion') == edition_policy()['version'] and previous.get('throughYear') == date.today().year:
            for row in previous.get('topics', []):
                if str(row.get('observedAt', '')).startswith(date.today().isoformat()):
                    reusable[row['slug']] = row
    reusable = {topic['slug']: reusable[topic['slug']] for topic in topics
                if reusable.get(topic['slug'], {}).get('query') == annual_query(topic)}
    if store.spent_today() + (len(topics) - len(reusable)) * reserve > budget:
        raise ValueError('Insufficient project budget for the complete annual batch')
    year = date.today().year
    rows = []
    for topic in topics:
        if topic['slug'] in reusable:
            rows.append(reusable[topic['slug']])
            continue
        store.reserve(reserve)
        query = annual_query(topic, year)
        result = client.get('works', query, use_cache=False)
        groups, total = result.get('group_by'), result.get('meta', {}).get('count')
        if not isinstance(groups, list) or type(total) is not int or total < 0:
            raise ValueError('Unverifiable annual aggregate response')
        counts = {}
        for group in groups:
            key, count = str(group.get('key', '')), group.get('count')
            if not key.isdigit() or not year - 9 <= int(key) <= year or type(count) is not int or count < 0 or int(key) in counts:
                raise ValueError('Invalid annual aggregate group')
            counts[int(key)] = count
        if sum(counts.values()) != total:
            raise ValueError('Annual counts do not reconcile to query total')
        rows.append({'slug': topic['slug'], 'label': topic['editionLabel'], 'field': topic['field'],
                     'role': topic['editionRole'], 'observedAt': datetime.now(timezone.utc).isoformat(),
                     'query': query, 'years': [{'year': y, 'works': counts.get(y, 0)} for y in range(year - 9, year + 1)]})
        print(f'Edition annual context staged: {topic["slug"]}', flush=True)
    payload = {'schemaVersion': 1, 'corpusVersion': edition_policy()['version'], 'throughYear': year,
               'generatedAt': datetime.now(timezone.utc).isoformat(), 'topics': rows,
               'definition': 'OpenAlex title-and-abstract query matches, constrained by declared topic assignments, work types and years. Application queries additionally require AI/ML method terms. API stemming differs from local lexical eligibility. Query volume is not verified adoption, quality or a complete field census.'}
    validate_trends(payload, topics)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix('.tmp')
    temporary.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')))
    temporary.replace(target)
    return payload


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--budget', type=float, default=.45)
    parser.add_argument('--reuse-today', action='store_true', help='Reuse only same-day observations with exactly unchanged query definitions.')
    args = parser.parse_args()
    load_local_env()
    if not os.getenv('OPENALEX_API_KEY'):
        raise SystemExit('Set OPENALEX_API_KEY in the ignored local .env.')
    store = CorpusStore(Path('.cache/corpus/atlas.sqlite'))
    try:
        refresh_trends(OpenAlexClient(os.environ['OPENALEX_API_KEY'], Path('.cache/corpus/trends'), min_interval=.7), edition_topics(), store, args.budget, reuse_today=args.reuse_today)
    finally:
        store.close()
