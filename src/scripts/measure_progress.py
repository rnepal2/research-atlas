#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


BASELINE = {
    "topics": 78,
    "worksCollected": 52089,
    "insightItemsPerTopic": 6,
}


def ratio(value: float, baseline: float) -> float:
    return round(value / baseline, 3) if baseline else 0.0


def main() -> None:
    parser = argparse.ArgumentParser(description="Measure Research Atlas progress against the current improvement goal.")
    parser.add_argument("--artifact", default="data/processed/atlas.json")
    parser.add_argument("--output", default="data/processed/progress_metrics.json")
    args = parser.parse_args()

    artifact_path = Path(args.artifact)
    output_dir = artifact_path.parent
    index_path = output_dir / "atlas-index.json"
    topics_dir = output_dir / "topics"
    artifact: dict[str, Any] = json.loads(artifact_path.read_text())
    topics = artifact.get("topics", [])
    insight_counts = [
        sum(len(section.get("items", [])) for section in topic.get("insightSections", [])) or len(topic.get("insights", []))
        for topic in topics
    ]
    works_collected = int(artifact.get("coverage", {}).get("worksCollected", 0))
    topic_count = len(topics)
    median_insights = sorted(insight_counts)[len(insight_counts) // 2] if insight_counts else 0
    metrics = {
        "baseline": BASELINE,
        "current": {
            "topics": topic_count,
            "worksCollected": works_collected,
            "medianInsightItemsPerTopic": median_insights,
            "artifactBytes": artifact_path.stat().st_size,
            "indexArtifactBytes": index_path.stat().st_size if index_path.exists() else 0,
            "topicArtifactCount": len(list(topics_dir.glob("*.json"))) if topics_dir.exists() else 0,
            "skippedTopics": len(artifact.get("skippedTopics", [])),
        },
        "multipliers": {
            "topicCoverage": ratio(topic_count, BASELINE["topics"]),
            "workCoverage": ratio(works_collected, BASELINE["worksCollected"]),
            "analyticsDepth": ratio(median_insights, BASELINE["insightItemsPerTopic"]),
        },
        "targets": {
            "topicCoverageMultiplier": 5,
            "workCoverageMultiplier": 5,
            "analyticsDepthMultiplier": 3,
        },
    }
    metrics["status"] = {
        "coverageTargetMet": metrics["multipliers"]["workCoverage"] >= 5 or metrics["multipliers"]["topicCoverage"] >= 5,
        "analyticsTargetMet": metrics["multipliers"]["analyticsDepth"] >= 3,
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
