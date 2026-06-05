#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

import yaml


BASELINE = {
    "topics": 78,
    "worksCollected": 52089,
    "insightItemsPerTopic": 6,
}


def ratio(value: float, baseline: float) -> float:
    return round(value / baseline, 3) if baseline else 0.0


def count_jsonl(path: Path) -> int:
    if not path.exists():
        return 0
    with path.open() as handle:
        return sum(1 for line in handle if line.strip())


def main() -> None:
    parser = argparse.ArgumentParser(description="Measure Research Atlas progress against the current improvement goal.")
    parser.add_argument("--artifact", default="data/processed/atlas.json")
    parser.add_argument("--output", default="data/processed/progress_metrics.json")
    parser.add_argument("--config", default="data/config/topics.yaml")
    parser.add_argument("--raw-dir", default="data/raw")
    args = parser.parse_args()

    artifact_path = Path(args.artifact)
    output_dir = artifact_path.parent
    index_path = output_dir / "atlas-index.json"
    topics_dir = output_dir / "topics"
    artifact: dict[str, Any] = json.loads(artifact_path.read_text())
    topics = artifact.get("topics", [])
    configured_topics = yaml.safe_load(Path(args.config).read_text()).get("topics", [])
    raw_counts = [count_jsonl(Path(args.raw_dir) / topic["slug"] / "works.jsonl") for topic in configured_topics]
    shallow_topics = sorted(
        [
            {
                "slug": topic["slug"],
                "label": topic.get("label", topic["slug"]),
                "rawWorks": raw_count,
                "field": topic.get("field", ""),
                "workArea": topic.get("work_area", ""),
            }
            for topic, raw_count in zip(configured_topics, raw_counts)
        ],
        key=lambda row: row["rawWorks"],
    )
    insight_counts = [
        sum(len(section.get("items", [])) for section in topic.get("insightSections", [])) or len(topic.get("insights", []))
        for topic in topics
    ]
    topics_with_benchmarks = sum(1 for topic in topics if topic.get("benchmarks", {}).get("fieldTrendRank"))
    works_collected = int(artifact.get("coverage", {}).get("worksCollected", 0))
    topic_count = len(topics)
    median_insights = sorted(insight_counts)[len(insight_counts) // 2] if insight_counts else 0
    target_works = BASELINE["worksCollected"] * 5
    target_topics = BASELINE["topics"] * 5
    target_depth = round(target_works / max(1, len(configured_topics)))
    sorted_raw_counts = sorted(raw_counts)
    metrics = {
        "baseline": BASELINE,
        "current": {
            "configuredTopics": len(configured_topics),
            "topics": topic_count,
            "worksCollected": works_collected,
            "rawTopicsWithWorks": sum(1 for count in raw_counts if count > 0),
            "rawWorksTotal": sum(raw_counts),
            "minimumRawWorksPerTopic": sorted_raw_counts[0] if sorted_raw_counts else 0,
            "medianRawWorksPerTopic": sorted_raw_counts[len(sorted_raw_counts) // 2] if sorted_raw_counts else 0,
            "topicsAtOrAboveTargetDepth": sum(1 for count in raw_counts if count >= target_depth),
            "topicsBelowTargetDepth": sum(1 for count in raw_counts if count < target_depth),
            "medianInsightItemsPerTopic": median_insights,
            "topicsWithBenchmarks": topics_with_benchmarks,
            "benchmarkCoverage": round(topics_with_benchmarks / max(1, topic_count), 3),
            "artifactBytes": artifact_path.stat().st_size,
            "indexArtifactBytes": index_path.stat().st_size if index_path.exists() else 0,
            "topicArtifactCount": len(list(topics_dir.glob("*.json"))) if topics_dir.exists() else 0,
            "skippedTopics": len(artifact.get("skippedTopics", [])),
            "shallowestTopics": shallow_topics[:10],
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
            "targetTopics": target_topics,
            "targetWorksCollected": target_works,
        },
        "deficit": {
            "topicsToFiveX": max(0, target_topics - topic_count),
            "worksToFiveX": max(0, target_works - works_collected),
            "rawTopicsWithoutWorks": sum(1 for count in raw_counts if count == 0),
            "avgWorksNeededPerConfiguredTopic": target_depth,
            "suggestedCollectionCommand": "./src/refresh_data.sh --stale-below 3000 --max-works 3000",
        },
        "refreshStrategy": {
            "openAlexApiKeyPresentAtMeasurement": bool(os.getenv("OPENALEX_API_KEY")),
            "authenticatedDeepRefreshRecommended": max(0, target_works - works_collected) > 0,
            "authenticatedCommand": "OPENALEX_API_KEY=... ./src/refresh_data.sh --stale-below 3000 --max-works 3000",
            "incrementalCommand": "./src/refresh_data.sh --stale-below 2604 --max-works 3000 --sort-by-raw-depth --limit-topics 10",
            "probeCommand": "./src/refresh_data.sh --topic <slug> --max-works 900 --allow-unauthenticated-openalex --min-interval 1.5 --max-attempts 1 --max-retry-wait 3",
            "note": "Unauthenticated OpenAlex refreshes are useful for probes but rate-limit before a reliable 5x corpus refresh.",
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
