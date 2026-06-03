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
    try:
        import networkx as nx
    except ImportError:
        return degree_centrality(edges)

    graph = nx.Graph()
    for (source, target), weight in edges.items():
        graph.add_edge(source, target, weight=weight)
    if graph.number_of_nodes() == 0:
        return {}
    if graph.number_of_nodes() > max_nodes:
        degree = dict(graph.degree(weight="weight"))
        keep = {
            node
            for node, _ in sorted(degree.items(), key=lambda item: item[1], reverse=True)[:max_nodes]
        }
        graph = graph.subgraph(keep).copy()
    return nx.betweenness_centrality(graph, weight="weight", normalized=True)
