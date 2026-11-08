import tempfile
import unittest
from pathlib import Path

from src.corpus.store import CorpusStore


class CorpusTests(unittest.TestCase):
    def test_replay_restart_and_observations(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'corpus.sqlite'
            store = CorpusStore(path)
            rows = [{'id': 'W1', 'cited_by_count': 12}]
            store.page('p', 'topic', rows, 'next', 2, .001)
            store.close()
            store = CorpusStore(path)
            self.assertEqual(store.checkpoint('p'), ('next', 0))
            store.page('p', 'topic', rows, None, 2, .001)
            self.assertEqual(store.db.execute('SELECT count(*) FROM works').fetchone()[0], 1)
            self.assertEqual(store.db.execute('SELECT count(*) FROM memberships').fetchone()[0], 1)
            self.assertEqual(store.checkpoint('p'), (None, 1))
            self.assertAlmostEqual(store.spent_today(), .002)
            store.close()
