import tempfile
import unittest
from datetime import date
from pathlib import Path

from src.corpus.context import refresh_context
from src.corpus.store import CorpusStore


class ContextTests(unittest.TestCase):
    def test_failed_batch_preserves_every_accepted_annual_file(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            store = CorpusStore(root / 'corpus.sqlite')
            topics = [{'slug': slug, 'keyword_queries': ['natural language processing']} for slug in ('one', 'two')]
            for topic in topics:
                target = root / topic['slug'] / 'yearly_counts.json'
                target.parent.mkdir()
                target.write_text('accepted')
            class Client:
                calls = 0
                def get(self, path, params, **kwargs):
                    if 'search.title_and_abstract' not in params or 'search' in params:
                        raise AssertionError('Annual context must use title-and-abstract search')
                    self.calls += 1
                    if self.calls == 2:
                        raise RuntimeError('Source unavailable')
                    return {'group_by': [{'key': str(date.today().year), 'count': 5}]}
            with self.assertRaises(RuntimeError):
                refresh_context(Client(), topics, root, store, .1)
            self.assertTrue(all((root / topic['slug'] / 'yearly_counts.json').read_text() == 'accepted' for topic in topics))
            store.close()

    def test_missing_aggregate_is_not_silently_published_as_zero(self):
        from src.scripts.collect_openalex_data import collect_yearly_counts
        class Client:
            def get(self, *args, **kwargs):
                return {}
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(RuntimeError, 'aggregate'):
                collect_yearly_counts(Client(), {'slug': 'one', 'keyword_queries': ['ai research']}, Path(directory))

    def test_batch_budget_is_checked_before_any_request(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            store = CorpusStore(root / 'corpus.sqlite')
            with self.assertRaisesRegex(ValueError, 'budget'):
                refresh_context(None, [{'slug': 'one'}], root, store, .001)
            self.assertEqual(store.spent_today(), 0)
            store.close()
