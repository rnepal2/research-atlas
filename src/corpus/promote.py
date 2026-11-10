"""Promote or roll back a local research snapshot after verifying every file."""
import argparse
import json
import re
import shutil
from pathlib import Path

from src.corpus.validate import validate


def promote(source: Path, target: Path, snapshot: str):
    if not re.fullmatch('[a-f0-9]{16}', snapshot):
        raise ValueError('Snapshot ID must be a content hash.')
    manifest = json.loads((source / 'snapshots' / snapshot / 'manifest.json').read_text())
    if manifest['snapshot'] != snapshot:
        raise ValueError('Snapshot identity mismatch')
    validate(source, manifest)
    destination = target / manifest['base']
    destination.parent.mkdir(parents=True, exist_ok=True)
    if source.resolve() != target.resolve():
        shutil.copytree(source / manifest['base'], destination, dirs_exist_ok=True)
    validate(target, manifest)
    pointer = target / 'research-manifest.tmp'
    pointer.write_text(json.dumps(manifest, sort_keys=True, separators=(',', ':')))
    pointer.replace(target / 'research-manifest.json')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot')
    parser.add_argument('--source', type=Path, default=Path('data/research'))
    parser.add_argument('--target', type=Path, required=True, help='Local preview asset directory; does not publish to production.')
    args = parser.parse_args()
    promote(args.source, args.target, args.snapshot)
