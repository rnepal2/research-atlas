import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from src.corpus.promote import promote


class SnapshotTests(unittest.TestCase):
    def test_corrupt_candidate_does_not_replace_pointer(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            snapshot = 'a' * 16
            source = root / 'source'
            target = root / 'target'
            target.mkdir()
            (target / 'research-manifest.json').write_text('previous release')
            data = source / 'snapshots' / snapshot
            data.mkdir(parents=True)
            (data / 'landscape.json').write_text('corrupt bytes')
            (data / 'manifest.json').write_text(json.dumps({'snapshot':snapshot, 'uniqueWorks':0, 'base':f'snapshots/{snapshot}/', 'files':{'landscape.json':{'sha256':hashlib.sha256(b'expected').hexdigest(),'bytes':8}}}))
            with self.assertRaises(ValueError):
                promote(source, target, snapshot)
            self.assertEqual((target / 'research-manifest.json').read_text(), 'previous release')

    def test_valid_snapshot_can_be_promoted_and_restored(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'source'
            target = root / 'target'
            for digit in ['a','b']:
                snapshot = digit * 16
                data = source / 'snapshots' / snapshot
                data.mkdir(parents=True)
                payload = json.dumps({'points':[]}).encode()
                (data / 'landscape.json').write_bytes(payload)
                (data / 'manifest.json').write_text(json.dumps({'snapshot':snapshot,'uniqueWorks':0,'base':f'snapshots/{snapshot}/','files':{'landscape.json':{'sha256':hashlib.sha256(payload).hexdigest(),'bytes':len(payload)}}}))
                promote(source,target,snapshot)
            promote(source,target,'a'*16)
            self.assertEqual(json.loads((target/'research-manifest.json').read_text())['snapshot'],'a'*16)
