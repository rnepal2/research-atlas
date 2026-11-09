import tempfile
import unittest
from pathlib import Path

from src.corpus.store import CorpusStore
from src.corpus.collect import collect
from src.corpus.partitions import partition_plan, coverage_rows
from datetime import date


class CorpusTests(unittest.TestCase):
    def test_malformed_success_response_cannot_exhaust_a_partition(self):
        with tempfile.TemporaryDirectory() as directory:
            store = CorpusStore(Path(directory) / 'corpus.sqlite')
            class Client:
                def get(self, *args, **kwargs):
                    return {'meta': {'count': 1000}}
            with self.assertRaisesRegex(ValueError, 'checkpoint'):
                collect(store, Client(), [{'slug': 'one', 'keyword_queries': ['ai']}], start_year=date.today().year)
            self.assertEqual(store.db.execute('SELECT count(*) FROM partitions').fetchone()[0], 0)
            store.close()
    def test_fairness_survives_budget_limited_restarts(self):
        with tempfile.TemporaryDirectory() as directory:
            store = CorpusStore(Path(directory) / 'corpus.sqlite')
            calls = []
            class Client:
                def get(self, path, params, use_cache):
                    calls.append(params['search.title_and_abstract'])
                    return {'results': [{'id': f'W{len(calls)}'}], 'meta': {'next_cursor': 'next', 'count': 1000}}
            topics = [{'slug': 'one', 'keyword_queries': ['first']}, {'slug': 'two', 'keyword_queries': ['second']}]
            for _ in range(2):
                collect(store, Client(), topics, max_pages=1, start_year=date.today().year)
            self.assertEqual(calls, ['(first)', '(second)'])
            rows = coverage_rows(store, partition_plan(topics, date.today().year - 1))
            self.assertEqual(len(rows), 4)
            self.assertEqual(sum(row['observed'] is None for row in rows), 2)
            store.close()

    def test_reconciliation_does_not_reset_other_boundaries(self):
        with tempfile.TemporaryDirectory() as directory:
            store = CorpusStore(Path(directory) / 'corpus.sqlite')
            store.page('selected', 'one', [{'id': 'W1'}], None, 1)
            store.page('unrelated', 'two', [{'id': 'W2'}], None, 1)
            store.restart(['selected'])
            self.assertEqual(store.checkpoint('selected'), ('*', 0))
            self.assertEqual(store.checkpoint('unrelated'), (None, 1))
            store.page('selected', 'one', [{'id': 'W1'}], None, 1)
            self.assertEqual(store.db.execute("SELECT fetched FROM partitions WHERE id='selected'").fetchone()[0], 1)
            store.close()

    def test_large_topic_does_not_starve_other_topics(self):
        with tempfile.TemporaryDirectory() as directory:
            store = CorpusStore(Path(directory) / 'corpus.sqlite')
            calls = []
            class Client:
                def get(self, path, params, use_cache):
                    calls.append(params['search.title_and_abstract'])
                    return {'results':[{'id':f'W{len(calls)}'}], 'meta':{'next_cursor':'next','count':1000,'cost_usd':.001}}
            collect(store, Client(), [{'slug':'one','keyword_queries':['first']},{'slug':'two','keyword_queries':['second']}], max_pages=2, start_year=date.today().year)
            self.assertEqual(calls,['(first)','(second)'])
            store.close()
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
            self.assertEqual(store.db.execute('SELECT fetched FROM partitions WHERE id=?', ('p',)).fetchone()[0], 1)
            self.assertAlmostEqual(store.spent_today(), .002)
            store.close()
