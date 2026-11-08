from __future__ import annotations

from collections import Counter, defaultdict
from itertools import combinations
from typing import Iterable


def coauthor_edges(works: Iterable[dict]) -> Counter:
    edges: Counter = Counter()
    for work in works:
        authors = []
        for authorship in work.get("authorships", []):
            author = authorship.get("author") or {}
            author_id = author.get("id")
            if author_id:
                authors.append(author_id)
        for left, right in combinations(sorted(set(authors)), 2):
            edges[(left, right)] += 1
    return edges


def degree_centrality(edges: Counter) -> dict[str, float]:
    degree: defaultdict[str, float] = defaultdict(float)
    for (source, target), weight in edges.items():
        degree[source] += weight
        degree[target] += weight
    max_degree = max(degree.values(), default=1.0)
    return {node: value / max_degree for node, value in degree.items()}


def betweenness_centrality(edges: Counter, max_nodes: int = 180) -> dict[str, float]:
    import networkx as nx

    graph = nx.Graph()
    for (source, target), weight in edges.items():
        graph.add_edge(source, target, weight=weight, distance=1.0 / max(weight, 1))
    if graph.number_of_nodes() == 0:
        return {}
    # Sample source paths on the complete graph rather than deleting peripheral
    # nodes, which changes the topology being measured. The seed is reproducible.
    return nx.betweenness_centrality(
        graph, k=min(max_nodes, graph.number_of_nodes()), seed=42,
        weight="distance", normalized=True,
    )
