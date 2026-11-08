import unittest
from src.corpus.relevance import edition_eligible
from src.corpus.scope import edition_topics


class EditionTests(unittest.TestCase):
    def test_application_requires_explicit_ai_evidence(self):
        topic = {'editionRole':'applications'}
        paper = {'type':'article','publication_year':2025,'title':'A new cancer treatment'}
        self.assertFalse(edition_eligible(paper,topic))
        paper['title'] = 'Machine learning for cancer treatment response'
        self.assertTrue(edition_eligible(paper,topic))

    def test_computer_science_does_not_have_to_mention_ai(self):
        self.assertTrue(edition_eligible({'type':'article','publication_year':2025,'title':'Quantum error correction'}, {'editionRole':'methods'}))

    def test_edition_stays_inside_existing_domains(self):
        topics = edition_topics()
        self.assertEqual(len(topics),100)
        self.assertTrue(all(t['editionRole'] in {'methods','applications'} for t in topics))
        self.assertTrue(all('editionSearch' in t for t in topics if t['editionRole']=='applications'))
