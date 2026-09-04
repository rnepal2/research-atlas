#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import sys
import time
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import requests
import yaml

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from src.analytics.work_relevance import work_matches_topic


BASE_URL = "https://api.openalex.org"
DEFAULT_MAX_WORKS = 3000
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
MAX_RESULTS_PER_QUERY = 100


class OpenAlexCollectionDeferredError(RuntimeError):
    """Raised when the live refresh should stop and fall back to cached raw data."""


class OpenAlexClient:
    def __init__(
        self,
        api_key: str | None,
        cache_dir: Path,
        min_interval: float = 0.28,
        max_attempts: int = 2,
        max_retry_wait: int = 15,
        allow_unauthenticated: bool = False,
    ) -> None:
        self.api_key = api_key
        self.cache_dir = cache_dir
        self.min_interval = min_interval
        self.max_attempts = max_attempts
        self.max_retry_wait = max_retry_wait
        self.allow_unauthenticated = allow_unauthenticated
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
            if response.status_code == 429 and not self.api_key and not self.allow_unauthenticated:
                raise RuntimeError(
                    "OpenAlex returned 429 without OPENALEX_API_KEY. Set OPENALEX_API_KEY for live collection, "
                    "or rerun with --allow-unauthenticated for a small development probe."
                )
            if response.status_code in {429, 500, 502, 503, 504}:
                if response.status_code == 429:
                    remaining = response.headers.get("X-RateLimit-Remaining")
                    if remaining is not None:
                        try:
                            if float(remaining) <= 0:
                                raise OpenAlexCollectionDeferredError(
                                    "OpenAlex daily API budget is exhausted; using the last complete cached snapshot."
                                )
                        except ValueError:
                            pass
                    if attempt == self.max_attempts - 1:
                        raise OpenAlexCollectionDeferredError(
                            "OpenAlex remained rate-limited after a bounded retry; using the last complete cached snapshot."
                        )
                elif attempt == self.max_attempts - 1:
                    raise OpenAlexCollectionDeferredError(
                        f"OpenAlex remained unavailable with HTTP {response.status_code}; using the last complete cached snapshot."
                    )
                retry_after = response.headers.get("retry-after")
                wait = min(self.max_retry_wait, int(retry_after) if retry_after and retry_after.isdigit() else 2**attempt)
                logging.warning("OpenAlex %s for %s; retrying in %ss", response.status_code, response.url, wait)
                time.sleep(wait)
                continue
            if response.status_code in {401, 403}:
                raise RuntimeError("OpenAlex rejected the API request. Check that OPENALEX_API_KEY is set and valid.")
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


def raw_work_count(output_dir: Path, slug: str) -> int:
    path = output_dir / slug / "works.jsonl"
    if not path.exists():
        return 0
    with path.open() as handle:
        return sum(1 for line in handle if line.strip())


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows = []
    with path.open() as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))


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
        page_params["per-page"] = min(MAX_RESULTS_PER_QUERY, max_works - len(rows))
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
    max_works = int(max_works_override if max_works_override is not None else max(configured_max, DEFAULT_MAX_WORKS))
    collected: dict[str, dict[str, Any]] = {}
    works_path = output_dir / topic["slug"] / "works.jsonl"

    for work in read_jsonl(works_path):
        if work.get("id") and work_matches_topic(work, topic):
            collected[work["id"]] = work
    existing_count = len(collected)
    max_works = max(max_works, existing_count)
    topic_ids = [short_openalex_id(value) for value in topic.get("openalex_topic_ids", [])]
    filter_value = f"publication_year:>{min_year}"
    if topic_ids:
        filter_value += f",topics.id:{'|'.join(topic_ids)}"

    # Search each curated phrase once for influential works. Keeping the
    # phrases separate avoids broad combined searches crowding niche phrases
    # out of the first page, while the one-page cap keeps API spend bounded.
    for query in topic.get("keyword_queries", []):
        params = {
            "search": query,
            "filter": filter_value,
            "sort": "cited_by_count:desc",
        }
        for work in fetch_works_for_params(client, params, MAX_RESULTS_PER_QUERY):
            if work.get("id") and work_matches_topic(work, topic):
                collected[work["id"]] = work

    # Add one recency-focused page across all phrases so the sample supports
    # current-activity metrics as well as historical impact. At the current
    # 100-topic configuration this plan remains well below the free daily API
    # budget, including the yearly-count searches below.
    combined_query = yearly_search_query(topic)
    if combined_query:
        params = {
            "search": combined_query,
            "filter": filter_value,
            "sort": "publication_date:desc",
        }
        for work in fetch_works_for_params(client, params, MAX_RESULTS_PER_QUERY):
            if work.get("id") and work_matches_topic(work, topic):
                collected[work["id"]] = work

    works = list(collected.values())[:max_works]
    write_jsonl(works_path, works)
    logging.info("Collected %s works for %s (%+d)", len(works), topic["slug"], len(works) - existing_count)
    return works


def yearly_search_query(topic: dict[str, Any]) -> str:
    terms = []
    for query in topic.get("keyword_queries", []):
        escaped = str(query).replace('"', '\\"').strip()
        if escaped:
            terms.append(f'"{escaped}"')
    return " OR ".join(terms)


def collect_yearly_counts(client: OpenAlexClient, topic: dict[str, Any], output_dir: Path) -> None:
    current_year = date.today().year
    years_back = int(topic.get("collection", {}).get("years_back", 10))
    min_year = current_year - years_back
    topic_ids = [short_openalex_id(value) for value in topic.get("openalex_topic_ids", [])]
    strategy = topic.get("collection", {}).get("yearly_counts", "topic" if topic_ids else "search")

    params: dict[str, Any] = {
        "filter": f"publication_year:>{min_year}",
        "group_by": "publication_year",
        "per-page": MAX_RESULTS_PER_QUERY,
    }
    if strategy == "topic" and topic_ids:
        params["filter"] += f",topics.id:{'|'.join(topic_ids)}"
        source = "openalex-topic"
    else:
        query = yearly_search_query(topic)
        if not query:
            raise RuntimeError(f"{topic['slug']} has no usable query for yearly counts")
        params["search"] = query
        source = "curated-search"

    payload = client.get("works", params, use_cache=False)
    values = {
        int(row["key"]): int(row["count"])
        for row in payload.get("group_by", [])
        if str(row.get("key", "")).isdigit() and min_year < int(row["key"]) <= current_year
    }
    counts = [{"year": year, "works": values.get(year, 0)} for year in range(min_year + 1, current_year + 1)]
    write_json(
        output_dir / topic["slug"] / "yearly_counts.json",
        {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "source": source,
            "years": counts,
        },
    )
    logging.info("Collected %s yearly count rows for %s", len(counts), topic["slug"])


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
    parser.add_argument("--missing-only", action="store_true", help="Collect only configured topics with no raw works file.")
    parser.add_argument("--stale-below", type=int, help="Collect only topics whose raw works file has fewer than this many rows.")
    parser.add_argument("--sort-by-raw-depth", action="store_true", help="Collect shallower raw topic files first.")
    parser.add_argument("--limit-topics", type=int, help="Limit the number of matching topics collected in this run.")
    parser.add_argument("--allow-unauthenticated", action="store_true", help="Allow live collection without OPENALEX_API_KEY for small development probes.")
    parser.add_argument("--min-interval", type=float, help="Minimum seconds between OpenAlex requests.")
    parser.add_argument("--max-attempts", type=int, help="Maximum attempts for each OpenAlex request.")
    parser.add_argument("--max-retry-wait", type=int, help="Maximum seconds to wait between OpenAlex retries.")
    parser.add_argument("--skip-metadata", action="store_true", help="Skip topic metadata search and collect works/entities only.")
    parser.add_argument("--yearly-only", action="store_true", help="Refresh aggregate publication-year counts without collecting work samples.")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    topics = load_config(Path(args.config))
    output_dir = Path(args.output_dir)
    if args.topic:
        topics = [topic for topic in topics if topic["slug"] == args.topic]
    if args.missing_only:
        topics = [topic for topic in topics if raw_work_count(output_dir, topic["slug"]) == 0]
    if args.stale_below is not None:
        topics = [topic for topic in topics if raw_work_count(output_dir, topic["slug"]) < args.stale_below]
    if args.sort_by_raw_depth:
        topics = sorted(topics, key=lambda topic: raw_work_count(output_dir, topic["slug"]))
    if args.limit_topics is not None and args.limit_topics > 0:
        topics = topics[: args.limit_topics]
    if not topics:
        raise SystemExit("No matching topics found.")

    status_path = Path(args.cache_dir) / "refresh_status.json"
    write_json(
        status_path,
        {
            "complete": False,
            "topicsRequested": len(topics),
            "topicsCompleted": 0,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        },
    )
    api_key = os.getenv("OPENALEX_API_KEY")
    if not api_key and not args.allow_unauthenticated:
        raise SystemExit(
            "OPENALEX_API_KEY is required for live OpenAlex collection. "
            "Use --fast/--skip-collect for cached processing, or --allow-unauthenticated for a small development probe."
        )

    logging.info("Collecting %s topic(s); target max works per topic is %s", len(topics), args.max_works or DEFAULT_MAX_WORKS)
    min_interval = args.min_interval if args.min_interval is not None else (1.1 if not api_key else 0.28)
    max_attempts = args.max_attempts if args.max_attempts is not None else 2
    max_retry_wait = args.max_retry_wait if args.max_retry_wait is not None else (12 if not api_key and args.allow_unauthenticated else 15)
    client = OpenAlexClient(
        api_key,
        Path(args.cache_dir),
        min_interval=min_interval,
        max_attempts=max_attempts,
        max_retry_wait=max_retry_wait,
        allow_unauthenticated=args.allow_unauthenticated,
    )
    completed_topics = 0
    for topic in topics:
        try:
            if not args.skip_metadata and not args.yearly_only:
                collect_topic_metadata(client, topic, output_dir)
            collect_yearly_counts(client, topic, output_dir)
            if args.yearly_only:
                completed_topics += 1
                continue
            works = collect_works(client, topic, output_dir, args.max_works)
            collect_entity_extracts(topic, works, output_dir)
            completed_topics += 1
        except OpenAlexCollectionDeferredError as exc:
            logging.error("%s", exc)
            logging.error("Stopped live collection at %s; the last complete published snapshot will be retained.", topic["slug"])
            write_json(
                status_path,
                {
                    "complete": False,
                    "topicsRequested": len(topics),
                    "topicsCompleted": completed_topics,
                    "stoppedAtTopic": topic["slug"],
                    "reason": str(exc),
                    "generatedAt": datetime.now(timezone.utc).isoformat(),
                },
            )
            break
    else:
        write_json(
            status_path,
            {
                "complete": True,
                "topicsRequested": len(topics),
                "topicsCompleted": completed_topics,
                "generatedAt": datetime.now(timezone.utc).isoformat(),
            },
        )


if __name__ == "__main__":
    main()
