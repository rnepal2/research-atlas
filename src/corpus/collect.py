"""Bounded collection: python3 -m src.corpus.collect --max-pages 50."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
from datetime import date
from pathlib import Path

from src.corpus.store import CorpusStore
from src.scripts.collect_openalex_data import OpenAlexClient, OpenAlexCollectionDeferredError, WORK_FIELDS, load_config

CORE_TOPICS = ('large-language-models', 'ai-agents', 'retrieval-augmented-generation',
               'llm-evaluation', 'ai-safety-alignment', 'multimodal-foundation-models',
               'code-generation-ai', 'model-compression')


def load_local_env(path=Path('.env')):
    if path.exists():
        for line in path.read_text().splitlines():
            key, sep, value = line.partition('=')
            if sep and re.fullmatch(r'[A-Z_][A-Z0-9_]*', key.strip()):
                os.environ.setdefault(key.strip(), value.strip().strip('\"\''))


def query_for(topic):
    # Same AND-of-token semantics as local eligibility. API stemming may still
    # broaden recall; local eligibility remains a separate audited stage.
    return ' OR '.join('(' + ' AND '.join(re.findall(r'[a-z0-9]+', phrase.lower())) + ')'
                       for phrase in topic.get('keyword_queries', []))


def collect(store, client, topics, max_pages=50, budget=.25, start_year=2017):
    pages = 0
    for year in range(date.today().year, start_year - 1, -1):
        for topic in topics:
            params = {'search': query_for(topic), 'filter': f'publication_year:{year}',
                      'per_page': 100, 'select': WORK_FIELDS + ',referenced_works,updated_date,is_retracted'}
            version = hashlib.sha256(json.dumps(params, sort_keys=True).encode()).hexdigest()[:16]
            partition = f'{topic["slug"]}/{year}/{version}'
            state = store.checkpoint(partition)
            if state and state[1]:
                continue
            cursor = state[0] if state else '*'
            while cursor:
                # Search calls cost $0.001; reserve twice that for bounded retries.
                if pages >= max_pages or store.spent_today() + .002 > budget:
                    return {'outcome': 'checkpointed', 'pages': pages, 'spentToday': store.spent_today()}
                payload = client.get('works', {**params, 'cursor': cursor}, use_cache=False)
                rows = payload.get('results', [])
                cursor = payload.get('meta', {}).get('next_cursor') if rows else None
                cost = float(payload.get('meta', {}).get('cost_usd', .001))
                store.page(partition, topic['slug'], rows, cursor, payload.get('meta', {}).get('count', 0), cost)
                pages += 1
                print(f'{topic["slug"]} {year}: +{len(rows)} records; page {pages}', flush=True)
    return {'outcome': 'complete', 'pages': pages, 'spentToday': store.spent_today()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', type=Path, default=Path('.cache/corpus/atlas.sqlite'))
    parser.add_argument('--max-pages', type=int, default=50)
    parser.add_argument('--budget', type=float, default=.25)
    parser.add_argument('--start-year', type=int, default=2017)
    parser.add_argument('--reconcile', action='store_true', help='Restart completed partitions to capture late indexing and corrections.')
    args = parser.parse_args()
    load_local_env()
    key = os.getenv('OPENALEX_API_KEY')
    if not key:
        raise SystemExit('Set OPENALEX_API_KEY in the process environment or local .env.')
    store = CorpusStore(args.db)
    if args.reconcile:
        with store.db:
            store.db.execute('DELETE FROM partitions')
    client = OpenAlexClient(key, Path('.cache/corpus/http'), min_interval=.7)
    try:
        print(json.dumps(collect(store, client, [t for t in load_config(Path('data/config/topics.yaml')) if t['slug'] in CORE_TOPICS], args.max_pages, args.budget, args.start_year)))
    except OpenAlexCollectionDeferredError:
        print('Collection deferred by OpenAlex; committed pages are safe. Run again to resume.')
    finally:
        store.close()


if __name__ == '__main__':
    main()
