from __future__ import annotations

import re
from typing import Any


WORD_RE = re.compile(r"[a-z0-9]+")


def short_openalex_id(value: str | None) -> str:
    return (value or "").rstrip("/").split("/")[-1]


def work_topic_ids(work: dict[str, Any]) -> set[str]:
    topics = [work.get("primary_topic") or {}, *(work.get("topics") or [])]
    return {short_openalex_id(topic.get("id")) for topic in topics if topic.get("id")}


def work_text_tokens(work: dict[str, Any]) -> set[str]:
    parts = [str(work.get("title") or ""), str(work.get("display_name") or "")]
    abstract = work.get("abstract_inverted_index") or {}
    if isinstance(abstract, dict):
        parts.extend(str(token) for token in abstract)
    return set(WORD_RE.findall(" ".join(parts).lower()))


def query_matches_work(work: dict[str, Any], query: str) -> bool:
    query_tokens = set(WORD_RE.findall(query.lower()))
    return bool(query_tokens) and query_tokens.issubset(work_text_tokens(work))


def work_matches_topic(work: dict[str, Any], topic: dict[str, Any]) -> bool:
    """Return whether a sampled work is evidence for the configured topic.

    Profiles require every term in at least one curated query to occur in the
    work title or abstract. When a topic has an OpenAlex ID, that assignment is
    also required; this guards against broad topic assignments pulling adjacent
    research into a narrower profile.
    """

    configured_ids = {short_openalex_id(value) for value in topic.get("openalex_topic_ids", []) if value}
    keyword_match = any(query_matches_work(work, query) for query in topic.get("keyword_queries", []))
    if configured_ids:
        return bool(configured_ids.intersection(work_topic_ids(work))) and keyword_match
    return keyword_match
