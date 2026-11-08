"""Verify a research snapshot without trusting filenames or partial uploads."""
import argparse
import hashlib
import json
import math
from pathlib import Path


def validate(root):
    manifest = json.loads((root / 'research-manifest.json').read_text())
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
    for point in landscape['points']:
        if not all(math.isfinite(point[key]) for key in ['x', 'y']):
            raise ValueError('Non-finite coordinates')
        if point['shard'] not in shards:
            shards[point['shard']] = json.loads((base / f'papers-{point["shard"]}.json').read_text())
        papers = shards[point['shard']]
        if point['id'] not in papers:
            raise ValueError('Missing detail evidence')
    print(f'Validated research snapshot {manifest["snapshot"]}: {len(ids)} unique works')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', nargs='?', type=Path, default=Path('data/research'))
    validate(parser.parse_args().root)
