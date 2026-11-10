import copy
import unittest
from src.corpus.validate import validate_entity_evidence


class EvidenceValidationTests(unittest.TestCase):
    def fixture(self):
        papers = {'W1': {'citations': 120, 'authors': [
            {'id': 'A1', 'name': 'Jane Smith', 'institutions': [{'id': 'I1', 'display_name': 'First'}]},
            {'id': 'A2', 'name': 'Assignee Research', 'institutions': [{'id': 'I1', 'display_name': 'First'}]},
            {'id': None, 'name': 'Unresolved', 'institutions': []},
        ]}}
        authors = [{'id': 'A1', 'works': ['W1'], 'citations': 40, 'affiliations': ['First']}]
        institutions = [{'id': 'I1', 'works': ['W1'], 'citations': 120, 'authors': ['A1']}]
        return papers, authors, institutions

    def test_direct_paper_authorship_reconciliation(self):
        validate_entity_evidence(*self.fixture())

    def test_unsupported_credit_and_coauthors_are_rejected(self):
        papers, authors, institutions = self.fixture()
        wrong = copy.deepcopy(authors)
        wrong[0]['citations'] = 120
        with self.assertRaisesRegex(ValueError, 'Author attribution'):
            validate_entity_evidence(papers, wrong, institutions)
        institutions[0]['authors'].append('A2')
        with self.assertRaisesRegex(ValueError, 'Institution attribution'):
            validate_entity_evidence(papers, authors, institutions)
