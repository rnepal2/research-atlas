import json
import tempfile
import unittest
from datetime import date
from pathlib import Path

from src.corpus.annual_scopes import annual_counts, boolean_node, scope_definitions, scope_query
from src.corpus.store import CorpusStore
from src.corpus.trends import refresh_trends, validate_trends


class AnnualScopeTests(unittest.TestCase):
    def topics(self):
        return [{'slug': slug, 'editionLabel': slug, 'field': 'Physics', 'editionRole': 'applications',
                 'keyword_queries': [phrase], 'editionSearch': '(machine AND learning)',
                 'openalex_topic_ids': ['T1'] if slug == 'one' else []}
                for slug, phrase in [('one', 'neural operator'), ('two', 'plasma simulation')]]

    def test_union_keeps_conditional_topic_assignments_and_factors_shared_method_predicate(self):
        q = scope_query(self.topics(), 2026)
        unions = q['filter_rows'][-1]['filters']
        branches = unions[0]['filters'][0]['filters']
        self.assertEqual(branches[0]['filters'][1]['filters'][0], {'column_id': 'topics.id', 'value': 'T1'})
        self.assertEqual(len(branches[1]['filters']), 1)
        self.assertEqual(json.dumps(q).count('"value": "machine"'), 1)
        self.assertEqual(q['calculate'], [{'measure': 'count'}])
        self.assertEqual(len(scope_definitions(self.topics())), 4)
        self.assertEqual(boolean_node('(a OR b) AND (c OR d)')['join'], 'and')
        with self.assertRaises(ValueError): boolean_node('(a AND b')

    def test_complete_batch_uses_source_union_not_sum_and_rejects_inconsistent_counts(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'annual.json'
            store = CorpusStore(Path(directory) / 'atlas.sqlite')
            year = date.today().year
            class Client:
                union_count = 3
                def get(self, *args, **kwargs):
                    return {'meta': {'count': 2}, 'group_by': [{'key': str(year), 'count': 2}]}
                def query(self, query, check=False):
                    if check: return {'validation': {'valid': True}, 'check': {'valid': True, 'cost': {'usd': .001}}}
                    return {'meta': {'count': self.union_count}, 'group_by': [{'key': str(year), 'count': self.union_count}]}
            client = Client()
            payload = refresh_trends(client, self.topics(), store, 1, target, include_scopes=True)
            self.assertEqual(payload['scopes'][0]['years'][-1]['works'], 3)  # 2 + 2 has an overlap.
            self.assertEqual(payload['schemaVersion'], 2)
            accepted = target.read_bytes()
            client.union_count = 5
            with self.assertRaisesRegex(ValueError, 'union'):
                refresh_trends(client, self.topics(), store, 1, target, include_scopes=True)
            self.assertEqual(target.read_bytes(), accepted)
            payload['scopes'].pop()
            with self.assertRaisesRegex(ValueError, 'scope set'): validate_trends(payload, self.topics())
            store.close()

    def test_missing_or_truncated_aggregates_do_not_become_zero(self):
        for result in [{'meta': {'count': 4}, 'group_by': []},
                       {'meta': {'count': 0, 'more_groups': True}, 'group_by': []},
                       {'meta': {'count': 0}}]:
            with self.assertRaises(ValueError): annual_counts(result, 2026)

    def test_union_budget_is_reserved_before_starting_topic_batch(self):
        with tempfile.TemporaryDirectory() as directory:
            store = CorpusStore(Path(directory) / 'atlas.sqlite')
            with self.assertRaisesRegex(ValueError, 'budget'):
                refresh_trends(None, self.topics(), store, .005, Path(directory) / 'annual.json', include_scopes=True)
            self.assertEqual(store.spent_today(), 0)
            store.close()
