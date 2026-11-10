import hashlib
import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from src.corpus.attach_trends import attach, encode
from src.corpus.scope import edition_policy
from src.corpus.validate import validate


class AttachTrendsTests(unittest.TestCase):
    def fixture(self, root):
        payloads = {'landscape.json': {'points': [], 'topics': [], 'clusters': []},
                    'authors.json': [], 'institutions.json': [], 'insights.json': [],
                    'coverage.json': {'eligibleUniqueWorks': 0, 'partitions': [], 'expectedPartitionCount': 0}}
        files = {name: {'sha256': hashlib.sha256(encode(value)).hexdigest(), 'bytes': len(encode(value))}
                 for name, value in payloads.items()}
        digest = hashlib.sha256(encode(files)).hexdigest()[:16]
        directory = root / 'snapshots' / digest
        directory.mkdir(parents=True)
        for name, value in payloads.items(): (directory / name).write_bytes(encode(value))
        manifest = {'snapshot': digest, 'schemaVersion': 2, 'corpusVersion': edition_policy()['version'],
                    'base': f'snapshots/{digest}/', 'uniqueWorks': 0, 'files': files}
        (directory / 'manifest.json').write_bytes(encode(manifest))
        (root / 'research-manifest.json').write_bytes(encode(manifest))
        context = root / 'annual.json'
        context.write_bytes(encode({'schemaVersion': 1, 'corpusVersion': manifest['corpusVersion'],
                                   'throughYear': datetime.now(timezone.utc).year, 'topics': []}))
        return manifest, context

    def test_context_update_preserves_evidence_and_old_snapshot_and_is_idempotent(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            old, context = self.fixture(root)
            with patch('src.corpus.trends.edition_topics', return_value=[]):
                candidate = attach(root, context)
                self.assertNotEqual(candidate['snapshot'], old['snapshot'])
                self.assertEqual(candidate['contextUpdatedFrom'], old['snapshot'])
                for name, meta in old['files'].items():
                    self.assertEqual(meta, candidate['files'][name])
                    self.assertEqual((root / old['base'] / name).read_bytes(), (root / candidate['base'] / name).read_bytes())
                self.assertEqual(attach(root, context), candidate)
            validate(root)

    def test_invalid_annual_context_cannot_replace_accepted_pointer(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            old, context = self.fixture(root)
            context.write_text(json.dumps({'schemaVersion': 2, 'corpusVersion': 'wrong'}))
            with self.assertRaises(ValueError): attach(root, context)
            self.assertEqual(json.loads((root / 'research-manifest.json').read_text()), old)
