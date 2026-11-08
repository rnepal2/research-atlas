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
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.manifold import TSNE

from src.corpus.store import CorpusStore
from src.corpus.relevance import edition_eligible
from src.corpus.entities import entity_evidence
from src.corpus.scope import edition_topics, edition_policy
from src.corpus.partitions import partition_plan, coverage_rows
from src.corpus.validate import validate
from src.scripts.collect_openalex_data import read_jsonl
from src.analytics.work_relevance import work_matches_topic, query_matches_work


def encode(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'), sort_keys=True).encode()


def abstract_text(work):
    abstract = work.get('abstract_inverted_index') or {}
    words = {position: word for word, positions in abstract.items() for position in positions}
    return ' '.join(words[position] for position in sorted(words))


def build(db_path, output, raw_dir=Path('data/raw')):
    started = time.perf_counter()
    config = edition_topics()
    store = CorpusStore(db_path)
    observed = dict(store.db.execute('SELECT work,max(day) FROM observations GROUP BY work'))
    works = {}
    memberships = defaultdict(set)
    for topic in config:
        for work in read_jsonl(raw_dir / topic['slug'] / 'works.jsonl'):
            if work.get('id') and edition_eligible(work, topic) and work_matches_topic(work, topic):
                current = store.db.execute('SELECT payload FROM works WHERE id=?', (work['id'],)).fetchone()
                if current:
                    work = json.loads(current[0])
                    if not edition_eligible(work, topic) or not work_matches_topic(work, topic):
                        continue
                works[work['id']] = work
                memberships[work['id']].add(topic['slug'])
    topic_lookup = {t['slug']: t for t in config}
    for slug, payload in store.db.execute('SELECT topic,payload FROM memberships JOIN works ON works.id=memberships.work ORDER BY works.id'):
        work = json.loads(payload)
        if slug in topic_lookup and edition_eligible(work, topic_lookup[slug]) and work_matches_topic(work, topic_lookup[slug]):
            works[work['id']] = work
            memberships[work['id']].add(slug)
    ordered = sorted(works.values(), key=lambda w: w['id'])
    if len(ordered) < 5:
        raise ValueError('At least five eligible papers are needed to build a landscape.')
    texts = [(w.get('title') or w.get('display_name') or '') + ' ' + abstract_text(w) for w in ordered]
    stop_words = sorted(ENGLISH_STOP_WORDS | {'model', 'models', 'language', 'large', 'based', 'using', 'paper', 'arxiv'})
    vectorizer = TfidfVectorizer(stop_words=stop_words, token_pattern=r'(?u)\b[a-zA-Z][a-zA-Z-]{2,}\b', max_features=12000, min_df=2, max_df=.95, sublinear_tf=True)
    matrix = vectorizer.fit_transform(texts)
    if not np.isfinite(matrix.data).all():
        raise ValueError('Non-finite text features; retaining the accepted snapshot.')
    dimensions = min(32, matrix.shape[0] - 1, matrix.shape[1] - 1)
    latent = TruncatedSVD(n_components=max(2, dimensions), random_state=42).fit_transform(matrix)
    if not np.isfinite(latent).all():
        raise ValueError('Non-finite latent features; retaining the accepted snapshot.')
    coordinates = TSNE(n_components=2, perplexity=min(30, max(2, len(ordered) // 5)),
                       init='pca', learning_rate='auto', random_state=42).fit_transform(latent)
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
            'observedAt': observed.get(work['id']),
            'matchedQueries': sorted({query for topic in config if topic['slug'] in memberships[work['id']] for query in topic.get('keyword_queries', []) if query_matches_work(work, query)}),
            'authors': [{'id': (a.get('author') or {}).get('id'), 'name': (a.get('author') or {}).get('display_name'),
                         'institutions': a.get('institutions', [])} for a in work.get('authorships', [])],
            'source': (((work.get('primary_location') or {}).get('source')) or {}).get('display_name', 'Source not resolved'),
            'url': work.get('doi') or work['id'],
            'references': [r.rsplit('/', 1)[-1] for r in work.get('referenced_works', [])],
            'referencesAvailable': 'referenced_works' in work,
            'inclusion': 'Curated computer-science/AI methods topic, or an existing scientific topic with explicit AI methods in its title/abstract. All terms from a curated query and configured OpenAlex topic assignments are required. Type and date boundaries apply; relevant works can still be missed.'}
    payload = {'schemaVersion': 2, 'method': 'TF-IDF → 32D truncated SVD → seeded t-SNE (2D); k-means themes in latent space. Local proximity is text similarity, not citation, agreement, or a measure of global distance.',
               'points': points, 'clusters': clusters,
               'topics': [{'slug': t['slug'], 'label': t['editionLabel'], 'domain':t['domain'], 'role':t['editionRole'], 'count': sum(t['slug'] in p['topics'] for p in points)} for t in config]}
    files = {}
    pending = {}
    def write(name, value):
        data = encode(value)
        pending[name] = data
        files[name] = {'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
    write('landscape.json', payload)
    for kind, rows in entity_evidence(ordered).items():
        write(f'{kind}.json', rows)
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
    partitions = coverage_rows(store, partition_plan(config))
    exhausted = sum(bool(p['complete']) for p in partitions)
    write('coverage.json', {'partitions': partitions, 'complete': False,
                           'expectedPartitionCount': len(partitions), 'exhaustedPartitionCount': exhausted,
                           'startedPartitionCount': sum(p['observed'] is not None for p in partitions),
                           'queriesExhausted': exhausted == len(partitions),
                           'eligibleUniqueWorks': len(points), 'abstractsAvailable': sum(bool(abstract_text(w)) for w in ordered),
                           'referencesAvailable': sum('referenced_works' in w for w in ordered),
                           'limitation': 'Focused sample plus partial cursor backfill; not a complete field census.'})
    digest = hashlib.sha256(encode(files)).hexdigest()[:16]
    directory = output / 'snapshots' / digest
    directory.mkdir(parents=True, exist_ok=True)
    for name, data in pending.items():
        (directory / name).write_bytes(data)
    manifest = {'snapshot': digest, 'schemaVersion': 2, 'corpusVersion': edition_policy()['version'],
                'processedAt': datetime.now(timezone.utc).isoformat(), 'uniqueWorks': len(points),
                'files': files, 'base': f'snapshots/{digest}/', 'coverage': 'partial',
                'buildSeconds': round(time.perf_counter() - started, 3), 'python': platform.python_version()}
    (directory / 'manifest.json').write_bytes(encode(manifest))
    # A malformed candidate must never replace the last accepted snapshot.
    validate(output, manifest)
    # Publish the pointer only after every file and its relationships validate.
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
