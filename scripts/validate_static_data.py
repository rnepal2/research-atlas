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
    "yearlyMetrics",
    "authors",
    "institutions",
    "countries",
    "papers",
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
    require(topic["papers"], f"{topic['slug']} has no papers")
    require(topic["network"].get("nodes"), f"{topic['slug']} has no researcher network nodes")
    require(topic["institutionNetwork"].get("nodes"), f"{topic['slug']} has no institution network nodes")


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate the static Research Atlas artifact.")
    parser.add_argument("--artifact", default="data/processed/atlas.json")
    parser.add_argument("--min-topics", type=int, default=3)
    args = parser.parse_args()

    artifact_path = Path(args.artifact)
    require(artifact_path.exists(), f"Missing artifact: {artifact_path}")
    artifact = json.loads(artifact_path.read_text())

    topics = artifact.get("topics") or []
    require(artifact.get("version") == 1, "Artifact version must be 1")
    require(len(topics) >= args.min_topics, f"Expected at least {args.min_topics} topics")
    require(artifact.get("taxonomy"), "Artifact taxonomy is empty")
    require(artifact.get("trending"), "Artifact trending list is empty")
    for topic in topics:
        validate_topic(topic)

    print(f"Validated {artifact_path} with {len(topics)} topics")


if __name__ == "__main__":
    main()
