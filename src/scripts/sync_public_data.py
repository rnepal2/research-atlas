#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def topic_summary(topic: dict) -> dict:
    return {
        "slug": topic["slug"],
        "label": topic["label"],
        "domain": topic.get("domain", ""),
        "field": topic.get("field", ""),
        "subfield": topic.get("subfield", ""),
        "workArea": topic.get("workArea", ""),
        "description": topic.get("description", ""),
        "summary": topic.get("summary", ""),
        "metrics": topic.get("metrics", {}),
        "quality": topic.get("quality", {}),
        "insights": topic.get("insights", [])[:6],
        "topSubtopics": topic.get("subtopics", [])[:6],
        "topAuthors": topic.get("authors", [])[:6],
        "topInstitutions": topic.get("institutions", [])[:6],
        "topCountries": topic.get("countries", [])[:8],
        "topPapers": topic.get("papers", [])[:6],
        "networkCounts": {
            "researcherNodes": len(topic.get("network", {}).get("nodes", [])),
            "researcherEdges": len(topic.get("network", {}).get("edges", [])),
            "institutionNodes": len(topic.get("institutionNetwork", {}).get("nodes", [])),
            "institutionEdges": len(topic.get("institutionNetwork", {}).get("edges", [])),
        },
    }


def build_index(artifact: dict) -> dict:
    return {
        "version": artifact["version"],
        "generatedAt": artifact["generatedAt"],
        "artifactStatus": artifact["artifactStatus"],
        "source": artifact["source"],
        "taxonomy": artifact["taxonomy"],
        "coverage": artifact.get("coverage", {}),
        "leaderboards": artifact.get("leaderboards", {}),
        "searchIndex": artifact.get("searchIndex", []),
        "skippedTopics": artifact.get("skippedTopics", []),
        "topics": [topic_summary(topic) for topic in artifact.get("topics", [])],
        "trending": artifact.get("trending", []),
        "methodology": artifact.get("methodology", {}),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Copy processed Atlas data into the frontend public directory.")
    parser.add_argument("--source", default=str(ROOT / "data" / "processed" / "atlas.json"))
    parser.add_argument("--target", default=str(ROOT / "frontend" / "public" / "data" / "atlas.json"))
    parser.add_argument("--index-source", default=str(ROOT / "data" / "processed" / "atlas-index.json"))
    parser.add_argument("--index-target", default=str(ROOT / "frontend" / "public" / "data" / "atlas-index.json"))
    parser.add_argument("--topics-source", default=str(ROOT / "data" / "processed" / "topics"))
    parser.add_argument("--topics-target", default=str(ROOT / "frontend" / "public" / "data" / "topics"))
    parser.add_argument("--include-full-artifact", action="store_true")
    args = parser.parse_args()

    source = Path(args.source)
    target = Path(args.target)
    if not source.exists():
        raise SystemExit(f"Missing {source}; run src/scripts/process_openalex_data.py first.")
    artifact = json.loads(source.read_text())
    target.parent.mkdir(parents=True, exist_ok=True)
    if args.include_full_artifact:
        shutil.copyfile(source, target)
        print(f"Copied {source} -> {target}")
    elif target.exists():
        target.unlink()
        print(f"Removed legacy public artifact {target}")

    index_source = Path(args.index_source)
    index_target = Path(args.index_target)
    if index_source.exists():
        index_target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(index_source, index_target)
        print(f"Copied {index_source} -> {index_target}")
    else:
        index_target.parent.mkdir(parents=True, exist_ok=True)
        index_target.write_text(json.dumps(build_index(artifact), separators=(",", ":")))
        print(f"Generated {index_target}")

    topics_source = Path(args.topics_source)
    topics_target = Path(args.topics_target)
    if topics_source.exists():
        if topics_target.exists():
            shutil.rmtree(topics_target)
        shutil.copytree(topics_source, topics_target)
        print(f"Copied {topics_source} -> {topics_target}")
    else:
        if topics_target.exists():
            shutil.rmtree(topics_target)
        topics_target.mkdir(parents=True, exist_ok=True)
        for topic in artifact.get("topics", []):
            (topics_target / f"{topic['slug']}.json").write_text(json.dumps(topic, separators=(",", ":")))
        print(f"Generated {topics_target}")


if __name__ == "__main__":
    main()
