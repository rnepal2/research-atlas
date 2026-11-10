"""Hand-checkable attribution and network regression fixtures."""
import unittest
from collections import Counter

from src.scripts.process_openalex_data import build_institutions
from src.analytics.network_metrics import betweenness_centrality


class MetricTests(unittest.TestCase):
    def test_affiliated_authors_and_unlimited_aggregate(self):
        institutions = [{"id": f"I{i}", "display_name": f"Institution {i}"} for i in range(35)]
        works = [{"id": "W1", "publication_year": 2026, "authorships": [
            {"author": {"id": f"A{i}", "display_name": f"Author {i}"}, "institutions": [institution]}
            for i, institution in enumerate(institutions)
        ]}]
        result = build_institutions(works, [], 2026)
        self.assertEqual(len(result), 35)
        self.assertTrue(all(row["activeAuthors"] == 1 for row in result))

    def test_bridge_counts_strong_links_as_short_distance(self):
        edges = Counter({("A", "B"): 10, ("B", "C"): 10, ("A", "C"): 1})
        bridge = betweenness_centrality(edges)
        self.assertGreater(bridge["B"], 0)
        self.assertEqual(bridge["A"], 0)


if __name__ == "__main__":
    unittest.main()
