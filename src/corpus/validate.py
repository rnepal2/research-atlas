"""Verify a research snapshot without trusting filenames or partial uploads."""
import argparse
import hashlib
import json
import math
import re
from datetime import date
from pathlib import Path


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
