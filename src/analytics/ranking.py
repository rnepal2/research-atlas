from __future__ import annotations


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def normalize(value: float, scale: float) -> float:
    if scale <= 0:
        return 0.0
    return clamp(100.0 * value / scale)


def topic_trend_score(
    recent_work_growth: float,
    topic_overlap_growth: float,
    baseline_size: int,
) -> float:
    size_penalty = min(15.0, max(0.0, (baseline_size - 50000) / 25000))
    work_component = min(1.0, max(0.0, recent_work_growth) / 4.0)
    overlap_component = min(1.0, max(0.0, topic_overlap_growth))
    score = 85.0 * work_component + 15.0 * overlap_component
    return clamp(score - size_penalty)


def rising_researcher_score(
    recent_publication_component: float,
    citation_velocity_component: float,
    growth_component: float,
    bridge_component: float,
    focus_component: float,
) -> float:
    return clamp(
        0.30 * recent_publication_component
        + 0.25 * citation_velocity_component
        + 0.20 * growth_component
        + 0.15 * bridge_component
        + 0.10 * focus_component
    )


def institution_strength_score(
    publication_share: float,
    citation_share: float,
    rising_author_component: float,
    centrality_component: float,
    breadth_component: float,
) -> float:
    return clamp(
        35.0 * publication_share
        + 25.0 * citation_share
        + 20.0 * rising_author_component
        + 10.0 * centrality_component
        + 10.0 * breadth_component
    )
