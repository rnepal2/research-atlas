import unittest
from src.corpus.entities import entity_evidence


class EntityTests(unittest.TestCase):
    def test_group_authors_are_not_people_and_missing_credit_is_not_redistributed(self):
        works = [{'id': 'W1', 'cited_by_count': 120, 'authorships': [
            {'author': {'id': 'A1', 'display_name': 'Jane Smith'}, 'institutions': [{'id': 'I1'}]},
            {'author': {'id': 'A2', 'display_name': 'Assignee Research'}, 'institutions': [{'id': 'I1'}]},
            {'author': {'display_name': 'Unresolved'}},
        ]}]
        evidence = entity_evidence(works)
        self.assertEqual(len(evidence['authors']), 1)
        self.assertEqual(evidence['authors'][0]['citations'], 40)
        self.assertEqual(evidence['institutions'][0]['authors'], ['A1'])
        self.assertEqual(evidence['institutions'][0]['citations'], 120)

    def test_coauthor_and_institution_attribution_differ(self):
        works = [{'id':'https://openalex.org/W1', 'cited_by_count':100, 'authorships':[
            {'author':{'id':'A1','display_name':'One'},'institutions':[{'id':'I1','display_name':'First'}]},
            {'author':{'id':'A2','display_name':'Two'},'institutions':[{'id':'I2','display_name':'Second'}]},
        ]}]
        evidence = entity_evidence(works)
        self.assertEqual([a['citations'] for a in evidence['authors']], [50,50])
        self.assertEqual(evidence['institutions'][0]['authors'], ['A1'])
        self.assertEqual(evidence['institutions'][0]['works'], ['W1'])
        self.assertEqual(evidence['institutions'][0]['citations'], 100)
