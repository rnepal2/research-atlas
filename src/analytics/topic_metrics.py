from __future__ import annotations

from typing import Iterable


def safe_divide(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def growth_rate(recent: float, prior: float) -> float:
    if prior <= 0 and recent > 0:
        return 1.0
    if prior <= 0:
        return 0.0
    return (recent - prior) / prior


def hhi(values: Iterable[float]) -> float:
    values = [max(0.0, float(value)) for value in values]
    total = sum(values)
    if total <= 0:
        return 0.0
    return sum((value / total) ** 2 for value in values)


def fragmentation_score(edge_count: int, node_count: int) -> float:
    if node_count <= 1:
        return 0.0
    possible_edges = node_count * (node_count - 1) / 2
    density = safe_divide(edge_count, possible_edges)
    return max(0.0, min(1.0, 1.0 - density))


