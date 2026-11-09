import json
import tempfile
import unittest
from datetime import date
from pathlib import Path

from src.corpus.trends import annual_query, refresh_trends, validate_trends
from src.corpus.store import CorpusStore
from src.corpus.relevance import edition_eligible, method_tags


class EditionTrendTests(unittest.TestCase):
    def topic(self, slug='physics'):
        return {'slug': slug, 'editionLabel': slug, 'editionRole': 'applications',
                'field': 'Physics and Astronomy', 'keyword_queries': ['particle physics'],
                'editionSearch': '(neural AND operator) OR (machine AND learning)',
                'openalex_topic_ids': ['https://openalex.org/T1']}

    def test_annual_query_matches_declared_application_scope(self):
        query = annual_query(self.topic())
        self.assertIn('AND ((neural AND operator)', query['search.title_and_abstract'])
        self.assertIn('topics.id:T1', query['filter'])
        self.assertIn('conference-paper', query['filter'])
        self.assertNotIn('proceedings-article', query['filter'])
        self.assertNotIn('search', query)

    def test_failed_batch_and_invalid_groups_preserve_accepted_context(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'accepted.json'
            target.write_text('accepted')
            store = CorpusStore(Path(directory) / 'test.sqlite')
            class Client:
                calls = 0
                def get(self, *args, **kwargs):
                    self.calls += 1
                    if self.calls == 2:
                        raise RuntimeError('source unavailable')
                    return {'meta': {'count': 3}, 'group_by': [{'key': str(date.today().year), 'count': 3}]}
            with self.assertRaises(RuntimeError):
                refresh_trends(Client(), [self.topic(), self.topic('second')], store, .1, target)
            self.assertEqual(target.read_text(), 'accepted')
            class BadClient:
                def get(self, *args, **kwargs):
                    return {'meta': {'count': 3}, 'group_by': []}
            with self.assertRaisesRegex(ValueError, 'reconcile'):
                refresh_trends(BadClient(), [self.topic()], store, .1, target)
            self.assertEqual(target.read_text(), 'accepted')
            store.close()

    def test_complete_zero_query_is_distinct_from_missing_data(self):
        with tempfile.TemporaryDirectory() as directory:
            store = CorpusStore(Path(directory) / 'test.sqlite')
            class Client:
                def get(self, *args, **kwargs): return {'meta': {'count': 0}, 'group_by': []}
            target = Path(directory) / 'annual.json'
            payload = refresh_trends(Client(), [self.topic()], store, .1, target)
            validate_trends(payload, [self.topic()])
            self.assertEqual(len(payload['topics'][0]['years']), 10)
            self.assertEqual(sum(row['works'] for row in payload['topics'][0]['years']), 0)
            self.assertEqual(json.loads(target.read_text()), payload)
            payload['topics'][0]['years'].pop()
            with self.assertRaisesRegex(ValueError, 'years'): validate_trends(payload, [self.topic()])
            store.close()

    def test_budget_gate_runs_before_any_request(self):
        with tempfile.TemporaryDirectory() as directory:
            store = CorpusStore(Path(directory) / 'test.sqlite')
            with self.assertRaisesRegex(ValueError, 'budget'):
                refresh_trends(None, [self.topic()], store, .001)
            self.assertEqual(store.spent_today(), 0)
            store.close()

    def test_same_day_reuse_requires_identical_queries_and_keeps_atomic_publication(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'annual.json'
            store = CorpusStore(Path(directory) / 'test.sqlite')
            class Client:
                calls = 0
                def get(self, *args, **kwargs):
                    self.calls += 1
                    return {'meta': {'count': 2}, 'group_by': [{'key': str(date.today().year), 'count': 2}]}
            client = Client()
            refresh_trends(client, [self.topic()], store, .1, target)
            before = target.read_text()
            refresh_trends(None, [self.topic()], store, store.spent_today(), target, reuse_today=True)
            self.assertEqual(client.calls, 1)
            changed = self.topic()
            changed['keyword_queries'] = ['cosmology']
            class Failed:
                def get(self, *args, **kwargs): raise RuntimeError('unavailable')
            stable = target.read_text()
            with self.assertRaises(RuntimeError):
                refresh_trends(Failed(), [changed], store, .1, target, reuse_today=True)
            self.assertEqual(target.read_text(), stable)
            self.assertEqual(json.loads(before)['topics'], json.loads(stable)['topics'])
            refresh_trends(client, [changed], store, .1, target, reuse_today=True)
            self.assertEqual(client.calls, 2)
            store.close()

    def test_scientific_ml_is_included_without_generic_ai_words(self):
        titles = ['Fourier neural operators for fluid dynamics',
                  'Neural quantum states for spin systems',
                  'Physics-informed neural solvers for plasma',
                  'Neural posterior estimation in cosmology',
                  'Gaussian process regression for physical simulations']
        for title in titles:
            self.assertTrue(edition_eligible({'title': title, 'type': 'article', 'publication_year': 2025}, self.topic()), title)
        for title in ['Quantum error correction', 'Simulation based inference in physics', 'A transformer for electrical power']:
            self.assertFalse(edition_eligible({'title': title, 'type': 'article', 'publication_year': 2025}, self.topic()), title)
        self.assertIn('neural-operators', method_tags(titles[0]))
        self.assertIn('physics-informed', method_tags(titles[2]))
