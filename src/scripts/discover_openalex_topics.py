#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

import requests
import yaml


BASE_URL = "https://api.openalex.org/topics"
SELECT = "id,display_name,description,works_count,cited_by_count,domain,field,subfield,keywords"


def topic_path(item: dict[str, Any]) -> str:
    parts = []
    for key in ["domain", "field", "subfield"]:
        value = item.get(key) or {}
        if value.get("display_name"):
            parts.append(value["display_name"])
    return " / ".join(parts)


def search_topics(query: str, limit: int, api_key: str | None) -> list[dict[str, Any]]:
    params = {"search": query, "per-page": limit, "select": SELECT}
    if api_key:
        params["api_key"] = api_key
    response = requests.get(BASE_URL, params=params, timeout=45)
    response.raise_for_status()
    return response.json().get("results", [])


def main() -> None:
    parser = argparse.ArgumentParser(description="Suggest OpenAlex topic IDs for curated Research Atlas topics.")
    parser.add_argument("--config", default="data/config/topics.yaml")
    parser.add_argument("--topic", help="Optional topic slug")
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--output", help="Optional JSON output path")
    args = parser.parse_args()

    topics = yaml.safe_load(Path(args.config).read_text()).get("topics", [])
    if args.topic:
        topics = [topic for topic in topics if topic["slug"] == args.topic]

    api_key = os.getenv("OPENALEX_API_KEY")
    rows = []
    for topic in topics:
        queries = [topic["label"], *topic.get("keyword_queries", [])[:2]]
        candidates = {}
        for query in queries:
            for item in search_topics(query, args.limit, api_key):
                if item.get("id"):
                    candidates[item["id"]] = {
                        "id": item["id"],
                        "label": item.get("display_name"),
                        "path": topic_path(item),
                        "worksCount": item.get("works_count"),
                        "citedByCount": item.get("cited_by_count"),
                        "description": item.get("description"),
                    }
        rows.append({"slug": topic["slug"], "label": topic["label"], "candidates": list(candidates.values())[: args.limit]})

    text = json.dumps(rows, indent=2, ensure_ascii=False)
    if args.output:
        Path(args.output).write_text(text)
    else:
        print(text)


if __name__ == "__main__":
    main()
