"""Refresh all annual context queries as a staged batch, without collecting papers."""
import argparse
import json
import os
import shutil
import tempfile
from datetime import date
from pathlib import Path

from src.corpus.collect import load_local_env
from src.corpus.scope import edition_topics
from src.corpus.store import CorpusStore
from src.scripts.collect_openalex_data import OpenAlexClient, collect_yearly_counts


def refresh_context(client, topics, raw, store, budget):
    # Reserve for both bounded client attempts per query, even though most calls
    # cost less. This ledger does not include unrelated usage of the same key.
    reserve = .002
    if store.spent_today() + len(topics) * reserve > budget:
        raise ValueError('Not enough project budget for a complete annual-context batch.')
    with tempfile.TemporaryDirectory(prefix='atlas-context-') as directory:
        stage = Path(directory)
        for topic in topics:
            store.reserve(reserve)
            collect_yearly_counts(client, topic, stage)
            payload = json.loads((stage / topic['slug'] / 'yearly_counts.json').read_text())
            expected_years = list(range(date.today().year - 9, date.today().year + 1))
            if [r['year'] for r in payload['years']] != expected_years or any(r['works'] < 0 for r in payload['years']) or not payload.get('query'):
                raise ValueError(f'Invalid annual context for {topic["slug"]}')
            print(f'Annual context staged: {topic["slug"]}', flush=True)
        # No accepted source file is touched unless the entire batch succeeds.
        for topic in topics:
            target = raw / topic['slug'] / 'yearly_counts.json'
            target.parent.mkdir(parents=True, exist_ok=True)
            temporary = target.with_suffix('.tmp')
            shutil.copyfile(stage / topic['slug'] / 'yearly_counts.json', temporary)
            temporary.replace(target)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--budget', type=float, default=.45, help='Conservative project daily reservation ceiling in USD; unrelated key usage is not included.')
    args = parser.parse_args()
    load_local_env()
    if not os.getenv('OPENALEX_API_KEY'):
        raise SystemExit('Set OPENALEX_API_KEY in the environment or ignored local .env.')
    store = CorpusStore(Path('.cache/corpus/atlas.sqlite'))
    try:
        refresh_context(OpenAlexClient(os.environ['OPENALEX_API_KEY'], Path('.cache/corpus/context'), min_interval=.7), edition_topics(), Path('data/raw'), store, args.budget)
    finally:
        store.close()
