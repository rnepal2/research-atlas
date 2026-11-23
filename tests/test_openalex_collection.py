import json
import os
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

from src.scripts import collect_openalex_data as collector


class CollectionTests(unittest.TestCase):
    def test_materials_entry_point_retains_recent_title_abstract_matches(self):
        """A broad-search page can be crowded out by locally ineligible hits."""
        topic = next(t for t in collector.load_config(Path('data/config/topics.yaml'))
                     if t['slug'] == 'materials-informatics')
        recent = {'id': 'https://openalex.org/W1',
                  'title': 'Materials informatics using machine learning',
                  'publication_year': date.today().year}
        old = {'id': 'https://openalex.org/W2',
               'title': 'High throughput materials screening',
               'publication_year': 2018}
        irrelevant = {'id': 'https://openalex.org/W3', 'title': 'Unrelated research',
                      'publication_year': date.today().year}
        calls = []

        def get(client, path, params=None, use_cache=True):
            calls.append(dict(params))
            if 'group_by' in params:
                return {'group_by': [{'key': str(date.today().year), 'count': 7}]}
            # Synthetic boundary fixture, not a recorded OpenAlex response.
            if 'search.title_and_abstract' in params:
                return {'results': [recent, old, irrelevant, recent], 'meta': {}}
            return {'results': [old, irrelevant], 'meta': {}}

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            argv = ['collect', '--topic', topic['slug'], '--skip-metadata',
                    '--allow-unauthenticated', '--output-dir', str(root / 'raw'),
                    '--cache-dir', str(root / 'cache')]
            with patch.object(sys, 'argv', argv), \
                 patch.dict(os.environ, {}, clear=True), \
                 patch.object(collector.OpenAlexClient, 'get', get):
                collector.main()
            works = collector.read_jsonl(root / 'raw' / topic['slug'] / 'works.jsonl')
            self.assertIn(recent, works)
            self.assertEqual({w['id'] for w in works}, {recent['id'], old['id']})
            self.assertEqual(len(works), 2)
            self.assertTrue(json.loads((root / 'cache' / 'refresh_status.json').read_text())['complete'])
        samples = [p for p in calls if 'group_by' not in p]
        self.assertEqual(len(samples), len(topic['keyword_queries']) + 1)
        self.assertTrue(all('search' not in p for p in samples))
        self.assertEqual(samples[0]['search.title_and_abstract'],
                         collector.boolean_search_query([topic['keyword_queries'][0]]))
        self.assertEqual(samples[-1]['search.title_and_abstract'], collector.yearly_search_query(topic))
        self.assertEqual(samples[-1]['sort'], 'publication_date:desc')
        self.assertTrue(all(p['per-page'] == 100 for p in samples))

    def test_sampling_keeps_topic_assignment_and_local_eligibility(self):
        topic = {'slug': 'assigned', 'openalex_topic_ids': ['T1'],
                 'keyword_queries': ['materials informatics']}
        good = {'id': 'W1', 'title': 'Materials informatics', 'topics': [{'id': 'T1'}]}
        wrong = dict(good, id='W2', topics=[{'id': 'T2'}])
        calls = []

        class Client:
            def get(self, path, params):
                calls.append(params)
                return {'results': [good, wrong], 'meta': {}}

        with tempfile.TemporaryDirectory() as directory:
            works = collector.collect_works(Client(), topic, Path(directory), None)
        self.assertEqual(works, [good])
        self.assertTrue(all(',topics.id:T1' in p['filter'] for p in calls))

    def test_other_configured_topic_preserves_existing_requests(self):
        topics = collector.load_config(Path('data/config/topics.yaml'))
        self.assertEqual([t['slug'] for t in topics
                          if 'sample_search_field' in t.get('collection', {})],
                         ['materials-informatics'])
        topic = next(t for t in topics if t['slug'] == 'perovskite-solar-cells')
        calls = []

        class Client:
            def get(self, path, params):
                calls.append(params)
                return {'results': [], 'meta': {}}

        with tempfile.TemporaryDirectory() as directory:
            collector.collect_works(Client(), topic, Path(directory), None)
        queries = topic['keyword_queries']
        self.assertEqual([p['search'] for p in calls], queries + [collector.yearly_search_query(topic)])
        self.assertEqual([p['sort'] for p in calls],
                         ['cited_by_count:desc'] * len(queries) + ['publication_date:desc'])
        self.assertTrue(all('search.title_and_abstract' not in p for p in calls))
        self.assertTrue(all(p['per-page'] == 100 for p in calls))

    def test_invalid_sample_search_field_is_rejected_before_request(self):
        topic = {'slug': 'invalid', 'collection': {'sample_search_field': 'typo'}}
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, 'invalid sample_search_field'):
                collector.collect_works(None, topic, Path(directory), None)
