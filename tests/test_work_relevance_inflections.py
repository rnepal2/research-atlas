import unittest

from src.analytics.work_relevance import query_matches_work


class WorkRelevanceInflectionTests(unittest.TestCase):
    def test_plural_model_matches_declared_singular_query(self):
        work = {'title': 'A survey of large language models'}
        self.assertTrue(query_matches_work(work, 'large language model'))

    def test_plural_agent_and_system_match_declared_query(self):
        work = {'title': 'Multi-agent systems for scientific discovery'}
        self.assertTrue(query_matches_work(work, 'multi agent system'))

    def test_missing_term_remains_excluded(self):
        work = {'title': 'A survey of language models'}
        self.assertFalse(query_matches_work(work, 'large language model'))

    def test_technical_terms_do_not_lose_suffix(self):
        work = {'title': 'Particle physics with machine learning'}
        self.assertTrue(query_matches_work(work, 'particle physics'))


if __name__ == '__main__':
    unittest.main()
