import unittest
from src.corpus.collect import query_for
from src.corpus.relevance import title_is_ai
from src.scripts.collect_openalex_data import yearly_search_query


class QueryTests(unittest.TestCase):
    def test_precision_gate_rejects_broad_off_topic_abstract_matches(self):
        self.assertFalse(title_is_ai({'title': 'LAMMPS — a flexible simulation tool for particle-based materials modeling'}))
        self.assertFalse(title_is_ai({'title': 'History of socio-cultural transformation as linguistic data science'}))
        self.assertTrue(title_is_ai({'title': 'RoBERTa: A Robustly Optimized BERT Pretraining Approach'}))
        self.assertTrue(title_is_ai({'title': 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks'}))
    def test_boolean_query_does_not_turn_curated_terms_into_exact_phrase(self):
        topic = {'keyword_queries': ['large language model', 'agent tool use']}
        self.assertEqual(query_for(topic), '(large AND language AND model) OR (agent AND tool AND use)')
        self.assertEqual(yearly_search_query(topic), query_for(topic))
