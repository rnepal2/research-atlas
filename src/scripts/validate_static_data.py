#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


TOPIC_KEYS = {
    "slug",
    "label",
    "metrics",
    "quality",
    "insights",
    "insightSections",
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


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def validate_topic(topic: dict[str, Any]) -> None:
    missing = TOPIC_KEYS - topic.keys()
    require(not missing, f"{topic.get('slug', 'unknown topic')} missing keys: {sorted(missing)}")
    require(topic["yearlyMetrics"], f"{topic['slug']} has no yearly metrics")
    require(len(topic["papers"]) >= 8, f"{topic['slug']} has too few papers")
    require(len(topic["authors"]) >= 8, f"{topic['slug']} has too few authors")
    require(len(topic["institutions"]) >= 8, f"{topic['slug']} has too few institutions")
    require(len(topic["countries"]) >= 4, f"{topic['slug']} has too few country rows")
    require(all(country.get("name") for country in topic["countries"]), f"{topic['slug']} has country rows without display names")
    require(all("workShare" in country for country in topic["countries"]), f"{topic['slug']} has country rows without work share")
    require(topic["quality"].get("worksCollected", 0) >= 40, f"{topic['slug']} has too few collected works")
    require(topic["quality"].get("latestPublicationYear", 0) >= 2020, f"{topic['slug']} has stale publication coverage")
    require(topic["network"].get("nodes"), f"{topic['slug']} has no researcher network nodes")
    require(topic["institutionNetwork"].get("nodes"), f"{topic['slug']} has no institution network nodes")
    require(topic.get("insights"), f"{topic['slug']} has no generated insights")
    require(sum(len(section.get("items", [])) for section in topic.get("insightSections", [])) >= 18, f"{topic['slug']} has too few insight-section items")
    require(topic.get("paperCollections", {}).get("recentImpact"), f"{topic['slug']} has no recent-impact papers")


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate the static Research Atlas artifact.")
    parser.add_argument("--artifact", default="data/processed/atlas.json")
    parser.add_argument("--min-topics", type=int, default=3)
    parser.add_argument("--max-artifact-mb", type=float, default=14.0)
    args = parser.parse_args()

    artifact_path = Path(args.artifact)
    require(artifact_path.exists(), f"Missing artifact: {artifact_path}")
    require(artifact_path.stat().st_size <= args.max_artifact_mb * 1024 * 1024, f"Artifact exceeds {args.max_artifact_mb:g} MB")
    artifact = json.loads(artifact_path.read_text())

    topics = artifact.get("topics") or []
    require(artifact.get("version") == 1, "Artifact version must be 1")
    require(len(topics) >= args.min_topics, f"Expected at least {args.min_topics} topics")
    require(artifact.get("taxonomy"), "Artifact taxonomy is empty")
    require(artifact.get("trending"), "Artifact trending list is empty")
    require(artifact.get("coverage"), "Artifact coverage summary is empty")
    coverage = artifact["coverage"]
    require(coverage.get("configuredTopics", 0) >= len(topics), "Coverage is missing configured topic count")
    require(coverage.get("profileCompletionRate", 0) > 0, "Coverage profile completion rate is missing")
    require(coverage.get("averageWorksPerProfile", 0) > 0, "Coverage average works per profile is missing")
    require(coverage.get("latestPublicationYear", 0) >= 2020, "Coverage latest publication year is stale or missing")
    require(artifact.get("searchIndex"), "Artifact search index is empty")
    for row in artifact["trending"]:
        require(row.get("signalDrivers"), f"{row.get('slug', 'trending row')} has no signal drivers")
        require(row.get("qualityLabel"), f"{row.get('slug', 'trending row')} has no quality label")
    for topic in topics:
        validate_topic(topic)

    print(f"Validated {artifact_path} with {len(topics)} topics")


if __name__ == "__main__":
    main()
