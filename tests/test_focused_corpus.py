import json
import sqlite3
import tempfile
import unittest
from datetime import date
from pathlib import Path

from src.corpus.focused import annual_estimate, checkpoint_status, focused_topics, signature
from src.corpus.partitions import partition_plan
from src.corpus.store import CorpusStore
from src.corpus.checkpoint import save, restore


class FocusedCorpusTests(unittest.TestCase):
    def test_candidate_is_locked_and_not_the_full_edition(self):
        policy, topics = focused_topics()
        self.assertEqual(len(topics), 12)
        self.assertEqual(signature(topics), policy['query_signature'])
        self.assertEqual(len({topic['slug'] for topic in topics}), len(topics))
        self.assertEqual(policy['status'], 'candidate')

    def test_query_change_requires_new_version_and_reconciliation(self):
        with tempfile.TemporaryDirectory() as directory:
            config = Path(directory) / 'candidate.yaml'
            config.write_text('version: test\nstart_year: 2017\nquery_signature: invalid\ntopics: [large-language-models]\n')
            with self.assertRaisesRegex(ValueError, 'query boundary changed'):
                focused_topics(config)

    def test_annual_estimate_uses_current_matching_source_counts(self):
        policy, topics = focused_topics()
        estimate = annual_estimate(policy, topics)
        self.assertEqual(estimate['topicYearBoundaries'], len(topics) * (date.today().year - 2016))
        self.assertGreaterEqual(estimate['estimatedPages'], estimate['topicYearBoundaries'])
        self.assertEqual(estimate['estimatedApiUsd'], round(estimate['estimatedPages'] * .001, 3))

    def test_status_requires_every_locked_boundary_and_count_reconciliation(self):
        policy, topics = focused_topics()
        with tempfile.TemporaryDirectory() as directory:
            db_path = Path(directory) / 'focused.sqlite'
            self.assertEqual(checkpoint_status(policy, topics, db_path)['started'], 0)
            store = CorpusStore(db_path)
            first = partition_plan(topics, policy['start_year'])[0]
            store.page(first['id'], first['topic'], [{'id': 'https://openalex.org/W1'}], None, 2)
            store.close()
            status = checkpoint_status(policy, topics, db_path)
            self.assertEqual(status['complete'], 1)
            self.assertEqual(status['countMismatch'], 1)
            self.assertFalse(status['readyForRelevanceAudit'])

    def test_checkpoint_round_trip_is_integrity_checked_and_no_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            original = root / 'original.sqlite'
            archive = root / 'backup.sqlite.gz'
            recovered = root / 'recovered.sqlite'
            store = CorpusStore(original)
            store.page('a', 'one', [{'id': 'https://openalex.org/W1'}], None, 1)
            store.close()
            saved = save(original, archive)
            self.assertGreater(saved['bytes'], 0)
            restore(archive, recovered)
            with sqlite3.connect(recovered) as db:
                self.assertEqual(db.execute('SELECT count(*) FROM works').fetchone()[0], 1)
            with self.assertRaises(FileExistsError):
                restore(archive, recovered)


if __name__ == '__main__':
    unittest.main()
