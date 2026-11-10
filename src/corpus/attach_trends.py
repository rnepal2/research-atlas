"""Attach validated annual context as a new immutable snapshot, retaining map geometry."""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

from src.corpus.trends import TARGET, validate_trends
from src.corpus.validate import validate


def encode(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'), sort_keys=True).encode()


def attach(root=Path('data/research'), context_path=TARGET):
    manifest = json.loads((root / 'research-manifest.json').read_text())
    validate(root, manifest)
    context = json.loads(context_path.read_text())
    validate_trends(context)
    if context['corpusVersion'] != manifest['corpusVersion']:
        raise ValueError('Annual context and paper snapshot editions differ')
    source = root / manifest['base']
    files = dict(manifest['files'])
    data = encode(context)
    files['trends.json'] = {'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
    digest = hashlib.sha256(encode(files)).hexdigest()[:16]
    if digest == manifest['snapshot']:
        return manifest
    destination = root / 'snapshots' / digest
    destination.mkdir(parents=True, exist_ok=True)
    for name in files:
        if name == 'trends.json':
            (destination / name).write_bytes(data)
        else:
            shutil.copyfile(source / name, destination / name)
    candidate = {**manifest, 'snapshot': digest, 'files': files,
                 'base': f'snapshots/{digest}/', 'processedAt': datetime.now(timezone.utc).isoformat(),
                 'contextUpdatedFrom': manifest['snapshot']}
    (destination / 'manifest.json').write_bytes(encode(candidate))
    validate(root, candidate)
    temporary = root / 'research-manifest.tmp'
    temporary.write_bytes(encode(candidate))
    temporary.replace(root / 'research-manifest.json')
    return candidate


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path('data/research'))
    parser.add_argument('--context', type=Path, default=TARGET)
    args = parser.parse_args()
    result = attach(args.root, args.context)
    print(f'Accepted annual-context snapshot {result["snapshot"]}: {result["uniqueWorks"]:,} unchanged paper records')
