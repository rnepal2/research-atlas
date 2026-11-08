"""Build immutable paper landscapes and provenance from local, inspectable data."""
from __future__ import annotations

import argparse
import hashlib
import json
import platform
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from sklearn.cluster import MiniBatchKMeans
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer

from src.corpus.collect import CORE_TOPICS
from src.corpus.store import CorpusStore
from src.scripts.collect_openalex_data import load_config, read_jsonl
from src.analytics.work_relevance import work_matches_topic


def encode(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'), sort_keys=True).encode()


def abstract_text(work):
    abstract = work.get('abstract_inverted_index') or {}
    words = {position: word for word, positions in abstract.items() for position in positions}
    return ' '.join(words[position] for position in sorted(words))


def build(db_path, output, raw_dir=Path('data/raw')):
    started = time.perf_counter()
    config = [t for t in load_config(Path('data/config/topics.yaml')) if t['slug'] in CORE_TOPICS]
    store = CorpusStore(db_path)
    works = {}
    memberships = defaultdict(set)
    allowed_types = {'article', 'review', 'preprint', 'conference-paper', 'proceedings-article', 'report'}
    for topic in config:
        for work in read_jsonl(raw_dir / topic['slug'] / 'works.jsonl'):
            if work.get('id') and work.get('type') in allowed_types and work_matches_topic(work, topic):
                works[work['id']] = work
                memberships[work['id']].add(topic['slug'])
    topic_lookup = {t['slug']: t for t in config}
    for slug, payload in store.db.execute('SELECT topic,payload FROM memberships JOIN works ON works.id=memberships.work ORDER BY works.id'):
        work = json.loads(payload)
        if slug in topic_lookup and work.get('type') in allowed_types and work_matches_topic(work, topic_lookup[slug]):
            works[work['id']] = work
            memberships[work['id']].add(slug)
    ordered = sorted(works.values(), key=lambda w: w['id'])
    if len(ordered) < 5:
        raise ValueError('At least five eligible papers are needed to build a landscape.')
    texts = [(w.get('title') or w.get('display_name') or '') + ' ' + abstract_text(w) for w in ordered]
    vectorizer = TfidfVectorizer(stop_words='english', max_features=12000, min_df=2, max_df=.95, sublinear_tf=True)
    matrix = vectorizer.fit_transform(texts)
    dimensions = min(32, matrix.shape[0] - 1, matrix.shape[1] - 1)
    latent = TruncatedSVD(n_components=max(2, dimensions), random_state=42).fit_transform(matrix)
    coordinates = latent[:, :2]
    coordinates = (coordinates - coordinates.mean(axis=0)) / np.maximum(coordinates.std(axis=0), 1e-8)
    count = min(12, max(2, len(ordered) // 80))
    assignments = MiniBatchKMeans(n_clusters=count, random_state=42, n_init=3, batch_size=512).fit_predict(latent)
    terms = vectorizer.get_feature_names_out()
    clusters = []
    for cluster in range(count):
        mask = assignments == cluster
        if not mask.any():
            continue
        indices = np.flatnonzero(mask)
        weights = np.asarray(matrix[indices].mean(axis=0)).ravel()
        keywords = [str(terms[i]) for i in weights.argsort()[-4:][::-1]]
        clusters.append({'id': cluster, 'label': ' · '.join(keywords[:3]), 'keywords': keywords,
                         'count': int(mask.sum()), 'x': float(coordinates[mask, 0].mean()), 'y': float(coordinates[mask, 1].mean())})
    points = []
    details = defaultdict(dict)
    for i, work in enumerate(ordered):
        identifier = work['id'].rsplit('/', 1)[-1]
        shard = hashlib.sha256(identifier.encode()).hexdigest()[:1]
        point = {'id': identifier, 'title': work.get('title') or work.get('display_name'),
                 'year': work.get('publication_year') or 0, 'citations': work.get('cited_by_count') or 0,
                 'type': work.get('type') or 'unknown', 'cluster': int(assignments[i]),
                 'x': round(float(coordinates[i, 0]), 5), 'y': round(float(coordinates[i, 1]), 5),
                 'topics': sorted(memberships[work['id']]), 'shard': shard,
                 'oa': bool((work.get('open_access') or {}).get('is_oa')), 'retracted': bool(work.get('is_retracted'))}
        points.append(point)
        details[shard][identifier] = {**point, 'abstract': abstract_text(work),
            'authors': [{'id': (a.get('author') or {}).get('id'), 'name': (a.get('author') or {}).get('display_name'),
                         'institutions': a.get('institutions', [])} for a in work.get('authorships', [])],
            'source': (((work.get('primary_location') or {}).get('source')) or {}).get('display_name', 'Source not resolved'),
            'url': work.get('doi') or work['id'],
            'references': [r.rsplit('/', 1)[-1] for r in work.get('referenced_works', [])],
            'referencesAvailable': 'referenced_works' in work,
            'inclusion': 'All tokens from a curated topic query appear in the title/abstract; configured OpenAlex topic IDs are also required where present.'}
    payload = {'schemaVersion': 2, 'method': 'TF-IDF → seeded truncated SVD (2D); k-means themes in 32D. Proximity is text similarity, not a citation relationship.',
               'points': points, 'clusters': clusters,
               'topics': [{'slug': t['slug'], 'label': t['label'], 'count': sum(t['slug'] in p['topics'] for p in points)} for t in config]}
    digest = hashlib.sha256(encode(payload) + encode(details)).hexdigest()[:16]
    directory = output / 'snapshots' / digest
    directory.mkdir(parents=True, exist_ok=True)
    files = {}
    def write(name, value):
        data = encode(value)
        (directory / name).write_bytes(data)
        files[name] = {'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
    write('landscape.json', payload)
    insights = []
    for topic in payload['topics']:
        eligible = [p for p in points if topic['slug'] in p['topics']]
        years = Counter(p['year'] for p in eligible)
        recent = sorted(eligible, key=lambda p: (-p['year'], -p['citations']))[:5]
        insights.append({'topic': topic['slug'], 'title': f'{topic["count"]:,} sampled papers available to investigate',
                         'scope': 'Eligible collected sample; collection order and query rules affect this distribution.',
                         'metric': 'unique sampled OpenAlex work IDs', 'value': len(eligible),
                         'yearCounts': dict(sorted(years.items())), 'supportingWorkIds': [p['id'] for p in recent]})
    write('insights.json', insights)
    for shard, values in details.items():
        write(f'papers-{shard}.json', values)
    partitions = [dict(zip(('id', 'expected', 'fetched', 'complete', 'observed'), row)) for row in store.db.execute('SELECT id,expected,fetched,complete,observed FROM partitions ORDER BY id')]
    write('coverage.json', {'partitions': partitions, 'complete': bool(partitions) and all(p['complete'] for p in partitions),
                           'eligibleUniqueWorks': len(points), 'abstractsAvailable': sum(bool(abstract_text(w)) for w in ordered),
                           'referencesAvailable': sum('referenced_works' in w for w in ordered),
                           'limitation': 'Focused sample plus partial cursor backfill; not a complete field census.'})
    manifest = {'snapshot': digest, 'schemaVersion': 2, 'corpusVersion': 'ai-curated-v1',
                'processedAt': datetime.now(timezone.utc).isoformat(), 'uniqueWorks': len(points),
                'files': files, 'base': f'snapshots/{digest}/', 'coverage': 'partial',
                'buildSeconds': round(time.perf_counter() - started, 3), 'python': platform.python_version()}
    # Publish the pointer only after every file has been written and hashed.
    temporary = output / 'research-manifest.tmp'
    temporary.write_bytes(encode(manifest))
    temporary.replace(output / 'research-manifest.json')
    store.close()
    print(json.dumps({k: v for k, v in manifest.items() if k != 'files'}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', type=Path, default=Path('.cache/corpus/atlas.sqlite'))
    parser.add_argument('--output', type=Path, default=Path('data/research'))
    args = parser.parse_args()
    build(args.db, args.output)
