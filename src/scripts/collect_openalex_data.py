#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import time
from datetime import date
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import requests
import yaml


BASE_URL = "https://api.openalex.org"
WORK_FIELDS = ",".join(
    [
        "id",
        "doi",
        "ids",
        "title",
        "display_name",
        "publication_year",
        "publication_date",
        "type",
        "cited_by_count",
        "referenced_works_count",
        "related_works",
        "authorships",
        "primary_topic",
        "topics",
        "primary_location",
        "open_access",
        "locations_count",
        "abstract_inverted_index",
    ]
)
TOPIC_FIELDS = "id,display_name,description,works_count,cited_by_count,domain,field,subfield,keywords"


class OpenAlexClient:
    def __init__(self, api_key: str | None, cache_dir: Path, min_interval: float = 0.28, max_attempts: int = 4) -> None:
        self.api_key = api_key
        self.cache_dir = cache_dir
        self.min_interval = min_interval
        self.max_attempts = max_attempts
        self.session = requests.Session()
        self.last_request_at = 0.0
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def get(self, path: str, params: dict[str, Any] | None = None, use_cache: bool = True) -> dict[str, Any]:
        params = dict(params or {})
        if self.api_key:
            params["api_key"] = self.api_key
        url = f"{BASE_URL}/{path.lstrip('/')}"
        cache_key = hashlib.sha256(f"{url}?{urlencode(sorted(params.items()))}".encode()).hexdigest()
        cache_path = self.cache_dir / f"{cache_key}.json"
        if use_cache and cache_path.exists():
            return json.loads(cache_path.read_text())

        for attempt in range(self.max_attempts):
            elapsed = time.time() - self.last_request_at
            if elapsed < self.min_interval:
                time.sleep(self.min_interval - elapsed)
            response = self.session.get(url, params=params, timeout=45)
            self.last_request_at = time.time()
            if response.status_code in {429, 500, 502, 503, 504}:
                wait = min(60, 2**attempt)
                logging.warning("OpenAlex %s for %s; retrying in %ss", response.status_code, response.url, wait)
                time.sleep(wait)
                continue
            response.raise_for_status()
            payload = response.json()
            if use_cache:
                cache_path.write_text(json.dumps(payload, ensure_ascii=False))
            return payload

        response.raise_for_status()
        raise RuntimeError("unreachable")


def short_openalex_id(value: str) -> str:
    return value.rstrip("/").split("/")[-1]


def load_config(path: Path) -> list[dict[str, Any]]:
    config = yaml.safe_load(path.read_text())
    return config.get("topics", [])


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def collect_topic_metadata(client: OpenAlexClient, topic: dict[str, Any], output_dir: Path) -> list[dict[str, Any]]:
    metadata = []
    for topic_id in topic.get("openalex_topic_ids", []):
        entity_id = short_openalex_id(topic_id)
        try:
            payload = client.get(f"topics/{entity_id}", {"select": TOPIC_FIELDS})
            metadata.append(payload)
        except requests.HTTPError as exc:
            logging.warning("Skipping OpenAlex topic metadata after retries for %s: %s", topic["slug"], exc)

    for query in topic.get("keyword_queries", [])[:2]:
        try:
            payload = client.get("topics", {"search": query, "per-page": 5, "select": TOPIC_FIELDS})
            metadata.extend(payload.get("results", []))
        except requests.HTTPError as exc:
            logging.warning("Skipping OpenAlex topic search after retries for %s: %s", topic["slug"], exc)

    seen = {}
    for item in metadata:
        if item.get("id"):
            seen[item["id"]] = item
    output_path = output_dir / "topic_metadata" / f"{topic['slug']}.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(list(seen.values()), indent=2, ensure_ascii=False))
    return list(seen.values())


def fetch_works_for_params(
    client: OpenAlexClient,
    params: dict[str, Any],
    max_works: int,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    cursor = "*"
    while len(rows) < max_works and cursor:
        page_params = dict(params)
        page_params["cursor"] = cursor
        page_params["per-page"] = min(200, max_works - len(rows))
        page_params["select"] = WORK_FIELDS
        try:
            payload = client.get("works", page_params)
        except requests.HTTPError as exc:
            logging.warning("Skipping OpenAlex works page after retries: %s", exc)
            break
        rows.extend(payload.get("results", []))
        cursor = payload.get("meta", {}).get("next_cursor")
        if not payload.get("results"):
            break
    return rows[:max_works]


def collect_works(client: OpenAlexClient, topic: dict[str, Any], output_dir: Path, max_works_override: int | None) -> list[dict[str, Any]]:
    current_year = date.today().year
    years_back = int(topic.get("collection", {}).get("years_back", 10))
    min_year = current_year - years_back
    configured_max = int(topic.get("collection", {}).get("max_works", 0))
    max_works = int(max_works_override or max(configured_max, 900))
    per_query_cap = max(50, max_works // max(1, len(topic.get("openalex_topic_ids", [])) + len(topic.get("keyword_queries", []))))
    collected: dict[str, dict[str, Any]] = {}

    for topic_id in topic.get("openalex_topic_ids", []):
        filter_value = f"publication_year:>{min_year},topics.id:{short_openalex_id(topic_id)}"
        for sort_order in ["cited_by_count:desc", "publication_date:desc"]:
            params = {"filter": filter_value, "sort": sort_order}
            for work in fetch_works_for_params(client, params, max(25, per_query_cap // 2)):
                if work.get("id"):
                    collected[work["id"]] = work

    for query in topic.get("keyword_queries", []):
        for sort_order in ["cited_by_count:desc", "publication_date:desc"]:
            params = {
                "search": query,
                "filter": f"publication_year:>{min_year}",
                "sort": sort_order,
            }
            for work in fetch_works_for_params(client, params, max(25, per_query_cap // 2)):
                if work.get("id"):
                    collected[work["id"]] = work

    works = list(collected.values())[:max_works]
    write_jsonl(output_dir / topic["slug"] / "works.jsonl", works)
    logging.info("Collected %s works for %s", len(works), topic["slug"])
    return works


def collect_entity_extracts(topic: dict[str, Any], works: list[dict[str, Any]], output_dir: Path) -> None:
    authors: dict[str, dict[str, Any]] = {}
    institutions: dict[str, dict[str, Any]] = {}
    sources: dict[str, dict[str, Any]] = {}

    for work in works:
        source = (((work.get("primary_location") or {}).get("source")) or {})
        if source.get("id"):
            sources[source["id"]] = source
        for authorship in work.get("authorships", []):
            author = authorship.get("author") or {}
            if author.get("id"):
                authors[author["id"]] = author
            for institution in authorship.get("institutions", []):
                if institution.get("id"):
                    institutions[institution["id"]] = institution

    base = output_dir / topic["slug"]
    write_jsonl(base / "authors.jsonl", list(authors.values()))
    write_jsonl(base / "institutions.jsonl", list(institutions.values()))
    write_jsonl(base / "sources.jsonl", list(sources.values()))


def main() -> None:
    parser = argparse.ArgumentParser(description="Collect OpenAlex raw data for Research Atlas topics.")
    parser.add_argument("--config", default="data/config/topics.yaml")
    parser.add_argument("--output-dir", default="data/raw")
    parser.add_argument("--cache-dir", default=".cache/openalex")
    parser.add_argument("--topic", help="Optional topic slug to collect")
    parser.add_argument("--max-works", type=int, help="Override max works per topic")
    parser.add_argument("--skip-metadata", action="store_true", help="Skip topic metadata search and collect works/entities only.")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    topics = load_config(Path(args.config))
    if args.topic:
        topics = [topic for topic in topics if topic["slug"] == args.topic]
    if not topics:
        raise SystemExit("No matching topics found.")

    client = OpenAlexClient(os.getenv("OPENALEX_API_KEY"), Path(args.cache_dir))
    output_dir = Path(args.output_dir)
    for topic in topics:
        if not args.skip_metadata:
            collect_topic_metadata(client, topic, output_dir)
        works = collect_works(client, topic, output_dir, args.max_works)
        collect_entity_extracts(topic, works, output_dir)


if __name__ == "__main__":
    main()
