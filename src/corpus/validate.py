"""Verify a research snapshot without trusting filenames or partial uploads."""
import argparse
import hashlib
import json
import math
import re
from datetime import date
from pathlib import Path
from collections import defaultdict
from src.analytics.authorship import is_credible_author


def validate_entity_evidence(papers, authors, institutions):
    """Independently reconcile directory relationships against paper authorships."""
    author_works, affiliation_names, institution_works, institution_authors = (defaultdict(set) for _ in range(4))
    credits = defaultdict(float)
    for identifier, paper in papers.items():
        entries = paper['authors']
        credited = len({a['id'] for a in entries if a.get('id')}) + sum(not a.get('id') for a in entries)
        if 'creditDivisor' in paper and paper['creditDivisor'] != max(1, credited):
            raise ValueError('Paper fractional credit denominator does not reconcile')
        seen = set()
        for entry in entries:
            person = bool(entry.get('id')) and is_credible_author({'display_name': entry.get('name')})
            author = entry.get('id')
            if person:
                author_works[author].add(identifier)
                if author not in seen:
                    credits[author] += paper['citations'] / max(1, credited)
                seen.add(author)
            for institution in entry.get('institutions', []):
                key = institution.get('id')
                if not key:
                    continue
                institution_works[key].add(identifier)
                if person:
                    affiliation_names[author].add(institution.get('display_name') or key)
                    institution_authors[key].add(author)
    if len({a['id'] for a in authors}) != len(authors) or {a['id'] for a in authors} != set(author_works):
        raise ValueError('Author directory does not reconcile with paper evidence')
    if len({i['id'] for i in institutions}) != len(institutions) or {i['id'] for i in institutions} != set(institution_works):
        raise ValueError('Institution directory does not reconcile with paper evidence')
    for author in authors:
        key = author['id']
        if set(author['works']) != author_works[key] or set(author.get('affiliations', [])) != affiliation_names[key] or not math.isclose(author['citations'], credits[key], abs_tol=.011, rel_tol=0):
            raise ValueError('Author attribution does not reconcile with paper evidence')
    for institution in institutions:
        key = institution['id']
        citations = sum(papers[w]['citations'] for w in institution_works[key])
        if set(institution['works']) != institution_works[key] or set(institution.get('authors', [])) != institution_authors[key] or institution['citations'] != citations:
            raise ValueError('Institution attribution does not reconcile with paper evidence')


def validate(root, manifest=None):
    manifest = manifest or json.loads((root / 'research-manifest.json').read_text())
    modern = manifest.get('schemaVersion') == 2
    if modern:
        digest = hashlib.sha256(json.dumps(manifest['files'], ensure_ascii=False, separators=(',', ':'), sort_keys=True).encode()).hexdigest()[:16]
        if manifest['snapshot'] != digest or manifest['base'] != f'snapshots/{digest}/':
            raise ValueError('Snapshot content identity mismatch')
        required = {'landscape.json', 'coverage.json', 'authors.json', 'institutions.json', 'insights.json'}
        if not required <= manifest['files'].keys():
            raise ValueError('Missing required research artifacts')
    base = root / manifest['base']
    if not base.resolve().is_relative_to(root.resolve()):
        raise ValueError('Invalid snapshot base')
    for name, meta in manifest['files'].items():
        path = base / name
        if not path.resolve().is_relative_to(base.resolve()):
            raise ValueError('Invalid file path')
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != meta['sha256'] or len(data) != meta['bytes']:
            raise ValueError(f'Integrity failure: {name}')
    landscape = json.loads((base / 'landscape.json').read_text())
    ids = [p['id'] for p in landscape['points']]
    if len(set(ids)) != len(ids) or len(ids) != manifest['uniqueWorks']:
        raise ValueError('Duplicate or inconsistent work count')
    shards = {}
    topics = {t['slug'] for t in landscape.get('topics', [])}
    clusters = {c['id'] for c in landscape.get('clusters', [])}
    for point in landscape['points']:
        if not all(math.isfinite(point[key]) for key in ['x', 'y']):
            raise ValueError('Non-finite coordinates')
        if modern:
            if not re.fullmatch(r'W\d+', point['id']) or not str(point.get('title') or '').strip():
                raise ValueError('Invalid paper identity or title')
            if not 2017 <= point['year'] <= date.today().year or point['citations'] < 0:
                raise ValueError('Invalid paper year or citation count')
            if point['cluster'] not in clusters or not point['topics'] or not set(point['topics']) <= topics:
                raise ValueError('Unresolved paper topic or theme')
            if f'papers-{point["shard"]}.json' not in manifest['files']:
                raise ValueError('Paper detail shard is not checksummed')
        if point['shard'] not in shards:
            shards[point['shard']] = json.loads((base / f'papers-{point["shard"]}.json').read_text())
        papers = shards[point['shard']]
        if point['id'] not in papers:
            raise ValueError('Missing detail evidence')
        if modern and any(papers[point['id']].get(key) != value for key, value in point.items()):
            raise ValueError('Paper detail does not match its plotted record')
    if modern:
        evidence = {identifier: paper for shard in shards.values() for identifier, paper in shard.items()}
        if set(evidence) != set(ids):
            raise ValueError('Unplotted or missing paper detail records')
        if landscape.get('methods'):
            methods = landscape['methods']
            if len({m['id'] for m in methods}) != len(methods):
                raise ValueError('Duplicate method definitions')
            for paper in evidence.values():
                if not set(paper.get('methods', [])) <= {m['id'] for m in methods}:
                    raise ValueError('Unknown method tag')
                if not all('terms' in m for m in methods):
                    continue  # Historical snapshots predate embedded terminology definitions.
                text = re.sub(r'[\s-]+', ' ', paper['title'] + ' ' + paper.get('abstract', '')).lower()
                expected = {m['id'] for m in methods if any(re.search(r'\b' + re.escape(term) + r's?\b', text) for term in m['terms'])}
                if set(paper.get('methods', [])) != expected:
                    raise ValueError('Method tags do not reconcile to title/abstract evidence')
        validate_entity_evidence(evidence, json.loads((base / 'authors.json').read_text()), json.loads((base / 'institutions.json').read_text()))
        if 'trends.json' in manifest['files']:
            from src.corpus.trends import validate_trends
            trends = json.loads((base / 'trends.json').read_text())
            if trends.get('corpusVersion') != manifest.get('corpusVersion'):
                raise ValueError('Annual context and paper snapshot editions differ')
            validate_trends(trends, landscape['topics'], current_policy=False)
        for topic in landscape['topics']:
            if topic['count'] != sum(topic['slug'] in p['topics'] for p in landscape['points']):
                raise ValueError('Topic count does not reconcile')
        for cluster in landscape['clusters']:
            if not all(math.isfinite(cluster[key]) for key in ['x', 'y']) or cluster['count'] != sum(p['cluster'] == cluster['id'] for p in landscape['points']):
                raise ValueError('Invalid theme coordinates or count')
        coverage = json.loads((base / 'coverage.json').read_text())
        if coverage['eligibleUniqueWorks'] != len(ids) or len(coverage['partitions']) != coverage['expectedPartitionCount']:
            raise ValueError('Coverage does not reconcile')
    print(f'Validated research snapshot {manifest["snapshot"]}: {len(ids)} unique works')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', nargs='?', type=Path, default=Path('data/research'))
    validate(parser.parse_args().root)
