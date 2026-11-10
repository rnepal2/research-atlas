"""Replace legacy cached evidence with current source records in bounded batches."""
import argparse
import json
import os
from pathlib import Path

from src.corpus.collect import load_local_env, CORE_TOPICS
from src.corpus.store import CorpusStore
from src.scripts.collect_openalex_data import OpenAlexClient, WORK_FIELDS, read_jsonl, write_jsonl


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--all-topics', action='store_true')
    parser.add_argument('--max-pages', type=int, default=25)
    args = parser.parse_args()
    load_local_env()
    store = CorpusStore(Path('.cache/corpus/atlas.sqlite'))
    files = [p for p in Path('data/raw').glob('*/works.jsonl') if args.all_topics or p.parent.name in CORE_TOPICS]
    memberships = {}
    for path in files:
        for work in read_jsonl(path):
            if work.get('id'):
                memberships.setdefault(work['id'], set()).add(path.parent.name)
    client = OpenAlexClient(os.environ['OPENALEX_API_KEY'], Path('.cache/corpus/rehydrate'), min_interval=.7)
    ids = sorted(memberships)
    verified = {}
    for start in range(0, min(len(ids), args.max_pages * 100), 100):
        batch = ids[start:start+100]
        payload = client.get('works', {'filter': 'ids.openalex:' + '|'.join(i.rsplit('/',1)[-1] for i in batch),
                                     'per_page':100, 'select':WORK_FIELDS + ',referenced_works,updated_date,is_retracted'}, use_cache=False)
        rows = payload.get('results', [])
        verified.update({w['id']:w for w in rows})
        for work in rows:
            for topic in memberships.get(work['id'], []):
                store.page('verified/' + work['id'], topic, [work], None, 1)
        print(f'Verified {len(verified)} / {len(ids)} legacy IDs', flush=True)
    # A complete reconciliation replaces legacy files; merged/missing IDs are
    # recorded as unresolved, never retained with a stale mismatched title.
    if args.max_pages * 100 >= len(ids):
        for path in files:
            write_jsonl(path, [verified[w['id']] for w in read_jsonl(path) if w.get('id') in verified])
    report = {'requested':len(ids), 'verified':len(verified), 'complete':args.max_pages*100>=len(ids),
              'unresolvedIds': sorted(set(ids)-set(verified))}
    Path('.cache/corpus/rehydration.json').write_text(json.dumps(report, indent=2))
    store.close()


if __name__ == '__main__':
    main()
