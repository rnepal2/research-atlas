#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path
from typing import Any

import yaml


TOPIC_KEYS = {
    "slug",
    "label",
    "metrics",
    "quality",
    "insights",
    "yearlyMetrics",
    "authors",
    "institutions",
    "countries",
    "papers",
    "paperCollections",
    "network",
    "institutionNetwork",
    "networkCommunities",
    "subtopicMatrix",
    "frontierCards",
}

NON_PERSON_AUTHOR_MARKERS = (
    "anonymous",
    "assignee",
    "research team",
    "research group",
    "working group",
    "consortium",
    "collaboration",
)
NON_SCHOLARLY_TITLE_PREFIXES = ("data from ", "supplemental ", "supplementary ")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def validate_topic(topic: dict[str, Any]) -> None:
    missing = TOPIC_KEYS - topic.keys()
    require(not missing, f"{topic.get('slug', 'unknown topic')} missing keys: {sorted(missing)}")
    require(topic["yearlyMetrics"], f"{topic['slug']} has no yearly metrics")
    expected_years = set(range(date.today().year - 9, date.today().year + 1))
    actual_years = {int(row["year"]) for row in topic["yearlyMetrics"]}
    require(actual_years == expected_years, f"{topic['slug']} has incomplete yearly metrics")
    require(
        topic["quality"].get("yearlyCountSource") in {"openalex-topic", "curated-search"},
        f"{topic['slug']} yearly metrics are derived from a biased work sample",
    )
    require(topic["quality"].get("yearlyCountYears") == 10, f"{topic['slug']} has incomplete OpenAlex yearly counts")
    require(topic["quality"].get("worksCollected", 0) > 0, f"{topic['slug']} has no topic-relevant sampled works")
    require(
        topic["quality"].get("rawWorksCollected", 0) >= topic["quality"].get("worksCollected", 0),
        f"{topic['slug']} reports more qualifying works than raw works",
    )
    require(all(author.get("recentWorks", 0) >= 2 for author in topic["authors"]), f"{topic['slug']} includes a one-work researcher signal")
    require(all(author.get("citations", 0) >= 0 for author in topic["authors"]), f"{topic['slug']} has invalid author citations")
    require(
        all(
            author.get("name")
            and "*" not in author["name"]
            and not any(marker in author["name"].casefold() for marker in NON_PERSON_AUTHOR_MARKERS)
            for author in topic["authors"]
        ),
        f"{topic['slug']} includes a non-person researcher signal",
    )
    require(
        all(
            not str(author.get("recentWork") or "").casefold().startswith(NON_SCHOLARLY_TITLE_PREFIXES)
            for author in topic["authors"]
        ),
        f"{topic['slug']} includes a supplemental-data researcher signal",
    )
    require(all(paper.get("citations", 0) >= 0 for paper in topic["papers"]), f"{topic['slug']} has invalid paper citations")
    require(
        all(not str(paper.get("title") or "").casefold().startswith(NON_SCHOLARLY_TITLE_PREFIXES) for paper in topic["papers"]),
        f"{topic['slug']} includes a supplemental-data paper",
    )
    require(all(institution.get("works", 0) > 0 for institution in topic["institutions"]), f"{topic['slug']} has an institution without sampled works")
    require(all(country.get("name") for country in topic["countries"]), f"{topic['slug']} has country rows without display names")
    require(all("workShare" in country for country in topic["countries"]), f"{topic['slug']} has country rows without work share")
    require(topic["quality"].get("latestPublicationYear", 0) >= 2020, f"{topic['slug']} has stale publication coverage")
    if topic["authors"]:
        require(topic["network"].get("nodes"), f"{topic['slug']} has no researcher network nodes")
    require(topic["institutionNetwork"].get("nodes"), f"{topic['slug']} has no institution network nodes")
    require(len(topic.get("insights", [])) >= 4, f"{topic['slug']} has too few generated insights")
    require(topic.get("paperCollections", {}).get("recentImpact"), f"{topic['slug']} has no recent-impact papers")


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate the static Research Atlas artifact.")
    parser.add_argument("--artifact", default="data/processed/atlas.json")
    parser.add_argument("--index-artifact", default="data/processed/atlas-index.json")
    parser.add_argument("--topics-dir", default="data/processed/topics")
    parser.add_argument("--min-topics", type=int, default=3)
    parser.add_argument("--max-artifact-mb", type=float, default=24.0)
    parser.add_argument("--max-index-mb", type=float, default=3.0)
    parser.add_argument("--max-topic-file-mb", type=float, default=0.5)
    parser.add_argument("--config", default="data/config/topics.yaml")
    parser.add_argument("--require-complete-config", action="store_true")
    args = parser.parse_args()

    artifact_path = Path(args.artifact)
    require(artifact_path.exists(), f"Missing artifact: {artifact_path}")
    require(artifact_path.stat().st_size <= args.max_artifact_mb * 1024 * 1024, f"Artifact exceeds {args.max_artifact_mb:g} MB")
    artifact = json.loads(artifact_path.read_text())

    topics = artifact.get("topics") or []
    require(artifact.get("version") == 1, "Artifact version must be 1")
    require(len(topics) >= args.min_topics, f"Expected at least {args.min_topics} topics")
    if args.require_complete_config:
        config = yaml.safe_load(Path(args.config).read_text()) or {}
        configured_topics = config.get("topics", []) if isinstance(config, dict) else config
        require(
            len(topics) == len(configured_topics),
            f"Expected all {len(configured_topics)} configured topics, found {len(topics)}",
        )
    require(artifact.get("taxonomy"), "Artifact taxonomy is empty")
    require(artifact.get("trending"), "Artifact trending list is empty")
    require(artifact.get("coverage"), "Artifact coverage summary is empty")
    coverage = artifact["coverage"]
    require(coverage.get("configuredTopics", 0) >= len(topics), "Coverage is missing configured topic count")
    require(coverage.get("profileCompletionRate", 0) > 0, "Coverage profile completion rate is missing")
    require(coverage.get("averageWorksPerProfile", 0) > 0, "Coverage average works per profile is missing")
    require(coverage.get("minimumWorksPerProfile", 0) > 0, "Coverage minimum works per profile is missing")
    require(coverage.get("medianWorksPerProfile", 0) > 0, "Coverage median works per profile is missing")
    require(coverage.get("coverageDepthTarget", 0) > 0, "Coverage depth target is missing")
    require(coverage.get("topicsBelowTargetDepth") is not None, "Coverage below-target count is missing")
    require(coverage.get("shallowestTopics"), "Coverage shallowest topic list is missing")
    require(coverage.get("latestPublicationYear", 0) >= 2020, "Coverage latest publication year is stale or missing")
    require(artifact.get("searchIndex"), "Artifact search index is empty")
    index_path = Path(args.index_artifact)
    require(index_path.exists(), f"Missing index artifact: {index_path}")
    require(index_path.stat().st_size <= args.max_index_mb * 1024 * 1024, f"Index artifact exceeds {args.max_index_mb:g} MB")
    topics_dir = Path(args.topics_dir)
    topic_files = list(topics_dir.glob("*.json")) if topics_dir.exists() else []
    require(len(topic_files) == len(topics), f"Expected {len(topics)} topic files, found {len(topic_files)}")
    oversized_topic = next((path for path in topic_files if path.stat().st_size > args.max_topic_file_mb * 1024 * 1024), None)
    require(oversized_topic is None, f"Topic artifact exceeds {args.max_topic_file_mb:g} MB: {oversized_topic}")
    for row in artifact["trending"]:
        require(row.get("signalDrivers"), f"{row.get('slug', 'trending row')} has no signal drivers")
        require(row.get("qualityLabel"), f"{row.get('slug', 'trending row')} has no quality label")
    for topic in topics:
        validate_topic(topic)
    if len(topics) >= 20:
        current_year = date.today().year
        current_year_peaks = sum(
            next(row["works"] for row in topic["yearlyMetrics"] if row["year"] == current_year)
            >= max(row["works"] for row in topic["yearlyMetrics"])
            for topic in topics
        )
        require(
            current_year_peaks / len(topics) < 0.8,
            "Current year peaks across most topics; yearly metrics may be derived from a newest-work sample",
        )

    print(f"Validated {artifact_path} with {len(topics)} topics")


if __name__ == "__main__":
    main()
