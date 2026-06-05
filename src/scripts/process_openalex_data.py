#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from src.analytics.network_metrics import betweenness_centrality, coauthor_edges, degree_centrality
from src.analytics.ranking import institution_strength_score, normalize, rising_researcher_score, topic_trend_score
from src.analytics.topic_metrics import fragmentation_score, growth_rate, hhi, safe_divide

COUNTRY_NAMES = {
    "AE": "United Arab Emirates",
    "AR": "Argentina",
    "AT": "Austria",
    "AU": "Australia",
    "BD": "Bangladesh",
    "BE": "Belgium",
    "BR": "Brazil",
    "CA": "Canada",
    "CH": "Switzerland",
    "CL": "Chile",
    "CN": "China",
    "CO": "Colombia",
    "CZ": "Czechia",
    "DE": "Germany",
    "DK": "Denmark",
    "EG": "Egypt",
    "ES": "Spain",
    "ET": "Ethiopia",
    "FI": "Finland",
    "FR": "France",
    "GB": "United Kingdom",
    "GH": "Ghana",
    "GR": "Greece",
    "HK": "Hong Kong",
    "HU": "Hungary",
    "ID": "Indonesia",
    "IE": "Ireland",
    "IL": "Israel",
    "IN": "India",
    "IR": "Iran",
    "IT": "Italy",
    "JP": "Japan",
    "KE": "Kenya",
    "KR": "South Korea",
    "LB": "Lebanon",
    "MA": "Morocco",
    "MX": "Mexico",
    "MY": "Malaysia",
    "NG": "Nigeria",
    "NL": "Netherlands",
    "NO": "Norway",
    "NZ": "New Zealand",
    "PK": "Pakistan",
    "PL": "Poland",
    "PT": "Portugal",
    "RO": "Romania",
    "RU": "Russia",
    "SA": "Saudi Arabia",
    "SE": "Sweden",
    "SG": "Singapore",
    "TH": "Thailand",
    "TR": "Turkey",
    "TW": "Taiwan",
    "UA": "Ukraine",
    "US": "United States",
    "VN": "Vietnam",
    "ZA": "South Africa",
}


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows = []
    with path.open() as handle:
        for line in handle:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def publication_year(work: dict[str, Any]) -> int:
    try:
        return int(work.get("publication_year") or 0)
    except (TypeError, ValueError):
        return 0


def short_id(value: str | None) -> str:
    if not value:
        return ""
    return value.rstrip("/").split("/")[-1]


def entity_url(openalex_id: str | None) -> str | None:
    return openalex_id if openalex_id and openalex_id.startswith("http") else None


def author_entries(work: dict[str, Any]) -> list[dict[str, Any]]:
    entries = []
    for authorship in work.get("authorships", []):
        author = authorship.get("author") or {}
        if author.get("id"):
            entries.append({"author": author, "authorship": authorship})
    return entries


def work_institutions(work: dict[str, Any]) -> list[dict[str, Any]]:
    institutions: dict[str, dict[str, Any]] = {}
    for authorship in work.get("authorships", []):
        for institution in authorship.get("institutions", []):
            if institution.get("id"):
                institutions[institution["id"]] = institution
    return list(institutions.values())


def source_name(work: dict[str, Any]) -> str:
    source = (((work.get("primary_location") or {}).get("source")) or {})
    return source.get("display_name") or "Unspecified source"


def country_name(code: str) -> str:
    return COUNTRY_NAMES.get(code, code)


def quality_label(score: float) -> str:
    if score >= 82:
        return "Strong snapshot"
    if score >= 70:
        return "Usable snapshot"
    return "Needs deeper collection"


def concentration_label(score: float) -> str:
    if score < 0.06:
        return "distributed"
    if score < 0.14:
        return "moderately concentrated"
    return "concentrated"


def topic_label(topic_obj: dict[str, Any] | None) -> str:
    if not topic_obj:
        return "Unclassified"
    return topic_obj.get("display_name") or "Unclassified"


def work_topic_ids(work: dict[str, Any]) -> set[str]:
    ids = set()
    primary = work.get("primary_topic") or {}
    if primary.get("id"):
        ids.add(short_id(primary["id"]))
    for topic in work.get("topics", []):
        if topic.get("id"):
            ids.add(short_id(topic["id"]))
    return ids


def year_window(current_year: int) -> list[int]:
    return list(range(current_year - 9, current_year + 1))


def build_yearly_metrics(works: list[dict[str, Any]], current_year: int) -> list[dict[str, Any]]:
    rows = []
    for year in year_window(current_year):
        year_works = [work for work in works if work.get("publication_year") == year]
        authors = {
            (entry["author"] or {}).get("id")
            for work in year_works
            for entry in author_entries(work)
            if (entry["author"] or {}).get("id")
        }
        institutions = {institution["id"] for work in year_works for institution in work_institutions(work)}
        citations = sum(int(work.get("cited_by_count") or 0) for work in year_works)
        rows.append(
            {
                "year": year,
                "works": len(year_works),
                "citations": citations,
                "citationVelocity": round(safe_divide(citations, max(1, current_year - year + 1)), 2),
                "authors": len(authors),
                "institutions": len(institutions),
            }
        )
    return rows


def period_sum(rows: list[dict[str, Any]], key: str, start_year: int, end_year: int) -> float:
    return sum(float(row.get(key, 0)) for row in rows if start_year <= int(row["year"]) <= end_year)


def build_subtopics(works: list[dict[str, Any]], current_year: int) -> list[dict[str, Any]]:
    counts: defaultdict[str, dict[str, Any]] = defaultdict(lambda: {"works": 0, "citations": 0, "recent": 0, "prior": 0, "field": ""})
    for work in works:
        year = int(work.get("publication_year") or 0)
        for topic in work.get("topics", [])[:6]:
            label = topic_label(topic)
            counts[label]["works"] += 1
            counts[label]["citations"] += int(work.get("cited_by_count") or 0)
            counts[label]["field"] = ((topic.get("field") or {}).get("display_name")) or counts[label]["field"]
            if year >= current_year - 2:
                counts[label]["recent"] += 1
            elif current_year - 5 <= year <= current_year - 3:
                counts[label]["prior"] += 1
    rows = []
    for label, values in counts.items():
        rows.append(
            {
                "label": label,
                "works": values["works"],
                "citations": values["citations"],
                "growth": round(growth_rate(values["recent"], values["prior"]), 3),
                "field": values["field"] or "Mixed",
            }
        )
    return sorted(rows, key=lambda row: (row["growth"], row["works"]), reverse=True)[:12]


def build_subtopic_series(works: list[dict[str, Any]], subtopics: list[dict[str, Any]], current_year: int) -> list[dict[str, Any]]:
    labels = [subtopic["label"] for subtopic in subtopics[:8]]
    label_set = set(labels)
    yearly: defaultdict[tuple[int, str], dict[str, int]] = defaultdict(lambda: {"works": 0, "citations": 0})
    for work in works:
        year = int(work.get("publication_year") or 0)
        if year not in year_window(current_year):
            continue
        citations = int(work.get("cited_by_count") or 0)
        matched = []
        for topic in work.get("topics", [])[:8]:
            label = topic_label(topic)
            if label in label_set:
                matched.append(label)
        if not matched:
            primary = topic_label(work.get("primary_topic"))
            if primary in label_set:
                matched.append(primary)
        for label in set(matched):
            yearly[(year, label)]["works"] += 1
            yearly[(year, label)]["citations"] += citations

    rows = []
    for year in year_window(current_year):
        year_total = sum(values["works"] for (row_year, _), values in yearly.items() if row_year == year)
        for label in labels:
            values = yearly[(year, label)]
            rows.append(
                {
                    "year": year,
                    "subtopic": label,
                    "works": values["works"],
                    "citations": values["citations"],
                    "share": round(safe_divide(values["works"], year_total), 3),
                }
            )
    return rows


def paper_profile(work: dict[str, Any], current_year: int) -> dict[str, Any]:
    authors = [entry["author"].get("display_name") for entry in author_entries(work)[:4]]
    citations = int(work.get("cited_by_count") or 0)
    year = int(work.get("publication_year") or current_year)
    topics = [topic_label(topic) for topic in work.get("topics", [])[:5]]
    return {
        "id": short_id(work.get("id")),
        "openalexId": work.get("id"),
        "title": work.get("title") or work.get("display_name") or "Untitled work",
        "year": year,
        "date": work.get("publication_date"),
        "type": work.get("type") or "work",
        "citations": citations,
        "citationVelocity": round(safe_divide(citations, max(1, current_year - year + 1)), 2),
        "source": source_name(work),
        "authors": [author for author in authors if author],
        "topic": topic_label(work.get("primary_topic")),
        "topics": topics,
        "url": work.get("doi") or work.get("id"),
    }


def build_papers(works: list[dict[str, Any]], current_year: int) -> list[dict[str, Any]]:
    papers = [paper_profile(work, current_year) for work in works]
    papers.sort(key=lambda row: (row["year"] >= current_year - 4, row["citations"], row["citationVelocity"]), reverse=True)
    return papers[:36]


def build_paper_collections(works: list[dict[str, Any]], current_year: int) -> dict[str, list[dict[str, Any]]]:
    papers = [paper_profile(work, current_year) for work in works]
    by_recent_impact = sorted(papers, key=lambda row: (row["year"] >= current_year - 4, row["citationVelocity"], row["citations"]), reverse=True)
    by_cited = sorted(papers, key=lambda row: (row["citations"], row["citationVelocity"]), reverse=True)
    by_newest = sorted(papers, key=lambda row: (row.get("date") or "", row["year"], row["citations"]), reverse=True)
    reviews = [paper for paper in by_cited if "review" in paper["type"].lower() or "review" in paper["title"].lower()]
    bridge = sorted(
        [paper for paper in papers if len({topic for topic in paper.get("topics", []) if topic != "Unclassified"}) >= 3],
        key=lambda row: (len(set(row.get("topics", []))), row["citationVelocity"], row["citations"]),
        reverse=True,
    )
    fallback_reviews = reviews if reviews else by_cited[:8]
    fallback_bridge = bridge if bridge else by_recent_impact[:8]
    return {
        "recentImpact": by_recent_impact[:10],
        "mostCited": by_cited[:10],
        "newest": by_newest[:10],
        "reviews": fallback_reviews[:10],
        "bridgePapers": fallback_bridge[:10],
    }


def build_authors(works: list[dict[str, Any]], current_year: int, centrality: dict[str, float], bridge: dict[str, float]) -> list[dict[str, Any]]:
    authors: defaultdict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "name": "",
            "works": 0,
            "recentWorks": 0,
            "priorWorks": 0,
            "citations": 0,
            "institutions": Counter(),
            "countries": Counter(),
            "topics": Counter(),
            "recentWork": "",
        }
    )
    for work in works:
        year = int(work.get("publication_year") or 0)
        citations = int(work.get("cited_by_count") or 0)
        primary_topic = topic_label(work.get("primary_topic"))
        for entry in author_entries(work):
            author = entry["author"]
            author_id = author["id"]
            row = authors[author_id]
            row["name"] = author.get("display_name") or short_id(author_id)
            row["works"] += 1
            row["citations"] += citations
            row["topics"][primary_topic] += 1
            if year >= current_year - 2:
                row["recentWorks"] += 1
                if not row["recentWork"]:
                    row["recentWork"] = work.get("title") or work.get("display_name") or ""
            elif current_year - 5 <= year <= current_year - 3:
                row["priorWorks"] += 1
            for institution in entry["authorship"].get("institutions", []):
                if institution.get("display_name"):
                    row["institutions"][institution["display_name"]] += 1
                if institution.get("country_code"):
                    row["countries"][institution["country_code"]] += 1

    rows = []
    for author_id, row in authors.items():
        if row["recentWorks"] <= 0:
            continue
        publication_component = normalize(row["recentWorks"], 8)
        citation_velocity = safe_divide(row["citations"], max(1, row["works"]))
        growth_component = normalize(max(0.0, growth_rate(row["recentWorks"], row["priorWorks"])), 2.0)
        bridge_component = normalize((centrality.get(author_id, 0.0) + bridge.get(author_id, 0.0)) / 2.0, 1.0)
        focus_component = normalize(row["recentWorks"] / max(1, row["works"]), 1.0)
        score = rising_researcher_score(publication_component, normalize(citation_velocity, 250), growth_component, bridge_component, focus_component)
        drivers = []
        if row["recentWorks"] >= 3:
            drivers.append(f"{row['recentWorks']} recent works")
        if citation_velocity >= 50:
            drivers.append("high citation velocity")
        if bridge_component >= 25:
            drivers.append("bridge position")
        if focus_component >= 60:
            drivers.append("topic focus")
        rows.append(
            {
                "id": short_id(author_id),
                "openalexId": author_id,
                "name": row["name"],
                "institution": row["institutions"].most_common(1)[0][0] if row["institutions"] else "Institution not resolved",
                "country": row["countries"].most_common(1)[0][0] if row["countries"] else "",
                "works": row["works"],
                "recentWorks": row["recentWorks"],
                "citations": row["citations"],
                "citationVelocity": round(citation_velocity, 2),
                "risingScore": round(score, 1),
                "focus": round(row["recentWorks"] / max(1, row["works"]), 2),
                "bridgeScore": round(100 * bridge.get(author_id, 0.0), 1),
                "collaborationBreadth": len(row["institutions"]),
                "countryBreadth": len(row["countries"]),
                "scoreDrivers": drivers[:4],
                "topics": [name for name, _ in row["topics"].most_common(4)],
                "recentWork": row["recentWork"],
                "url": entity_url(author_id),
            }
        )
    return sorted(rows, key=lambda row: row["risingScore"], reverse=True)[:30]


def build_institutions(works: list[dict[str, Any]], authors: list[dict[str, Any]], current_year: int) -> list[dict[str, Any]]:
    rows: defaultdict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "name": "",
            "country": "",
            "type": "",
            "works": 0,
            "recentWorks": 0,
            "citations": 0,
            "authors": set(),
            "topics": Counter(),
            "partners": Counter(),
        }
    )
    total_works = max(1, len(works))
    total_citations = max(1, sum(int(work.get("cited_by_count") or 0) for work in works))
    rising_author_institutions = Counter(author["institution"] for author in authors[:20])

    for work in works:
        year = int(work.get("publication_year") or 0)
        citations = int(work.get("cited_by_count") or 0)
        institutions = work_institutions(work)
        ids = [institution["id"] for institution in institutions if institution.get("id")]
        for institution in institutions:
            institution_id = institution["id"]
            row = rows[institution_id]
            row["name"] = institution.get("display_name") or short_id(institution_id)
            row["country"] = institution.get("country_code") or row["country"]
            row["type"] = institution.get("type") or row["type"]
            row["works"] += 1
            row["citations"] += citations
            if year >= current_year - 2:
                row["recentWorks"] += 1
            row["topics"][topic_label(work.get("primary_topic"))] += 1
            for entry in author_entries(work):
                row["authors"].add(entry["author"]["id"])
            for partner_id in ids:
                if partner_id != institution_id:
                    row["partners"][partner_id] += 1

    output = []
    for institution_id, row in rows.items():
        publication_share = row["works"] / total_works
        citation_share = row["citations"] / total_citations
        rising_component = min(1.0, rising_author_institutions.get(row["name"], 0) / 4)
        centrality_component = min(1.0, len(row["partners"]) / 20)
        breadth_component = min(1.0, len(row["topics"]) / 8)
        score = institution_strength_score(publication_share, citation_share, rising_component, centrality_component, breadth_component)
        drivers = []
        if row["works"] >= 8:
            drivers.append(f"{row['works']} topic works")
        if citation_share >= 0.08:
            drivers.append("large citation share")
        if len(row["partners"]) >= 8:
            drivers.append("broad collaboration")
        if len(row["topics"]) >= 4:
            drivers.append("subtopic breadth")
        output.append(
            {
                "id": short_id(institution_id),
                "openalexId": institution_id,
                "name": row["name"],
                "country": row["country"],
                "type": row["type"] or "institution",
                "works": row["works"],
                "recentWorks": row["recentWorks"],
                "citations": row["citations"],
                "activeAuthors": len(row["authors"]),
                "strengthScore": round(score, 1),
                "subtopics": [name for name, _ in row["topics"].most_common(5)],
                "partnerCount": len(row["partners"]),
                "topicBreadth": len(row["topics"]),
                "scoreDrivers": drivers[:4],
                "url": entity_url(institution_id),
            }
        )
    return sorted(output, key=lambda row: row["strengthScore"], reverse=True)[:30]


def build_country_rows(works: list[dict[str, Any]]) -> list[dict[str, Any]]:
    countries: defaultdict[str, dict[str, Any]] = defaultdict(lambda: {"works": 0, "institutions": set(), "citations": 0})
    for work in works:
        citations = int(work.get("cited_by_count") or 0)
        seen_countries = set()
        for institution in work_institutions(work):
            country = institution.get("country_code") or "Unknown"
            countries[country]["institutions"].add(institution.get("id"))
            seen_countries.add(country)
        for country in seen_countries:
            countries[country]["works"] += 1
            countries[country]["citations"] += citations
    total = max(1, sum(values["works"] for values in countries.values() if values["works"]))
    rows = []
    for country, values in sorted(countries.items(), key=lambda item: item[1]["works"], reverse=True)[:32]:
        rows.append(
            {
                "country": country,
                "name": country_name(country),
                "works": values["works"],
                "institutions": len(values["institutions"]),
                "citations": values["citations"],
                "workShare": round(safe_divide(values["works"], total), 3),
                "rank": len(rows) + 1,
            }
        )
    return rows


def build_author_network(works: list[dict[str, Any]], authors: list[dict[str, Any]], edges_counter: Counter) -> dict[str, Any]:
    author_metadata: dict[str, dict[str, Any]] = {}
    for work in works:
        for entry in author_entries(work):
            author = entry["author"]
            institution = "Institution not resolved"
            for item in entry["authorship"].get("institutions", []):
                if item.get("display_name"):
                    institution = item["display_name"]
                    break
            author_metadata[author["id"]] = {
                "name": author.get("display_name") or short_id(author["id"]),
                "institution": institution,
                "topic": topic_label(work.get("primary_topic")),
            }

    top_author_ids = {author["openalexId"] for author in authors[:50]}
    for (source, target), _ in edges_counter.most_common(140):
        top_author_ids.add(source)
        top_author_ids.add(target)
        if len(top_author_ids) >= 100:
            break

    author_lookup = {author["openalexId"]: author for author in authors}
    nodes = []
    for author_id in top_author_ids:
        author = author_lookup.get(author_id)
        metadata = author_metadata.get(author_id, {})
        nodes.append(
            {
                "id": short_id(author_id),
                "openalexId": author_id,
                "label": author["name"] if author else metadata.get("name", short_id(author_id)),
                "type": "author",
                "score": author["risingScore"] if author else 20,
                "community": author["topics"][0] if author and author["topics"] else metadata.get("topic", "Mixed"),
                "institution": author["institution"] if author else metadata.get("institution", "Institution not resolved"),
            }
        )

    edges = []
    for (source, target), weight in edges_counter.most_common(220):
        if source in top_author_ids and target in top_author_ids:
            edges.append({"source": short_id(source), "target": short_id(target), "weight": weight, "type": "coauthorship"})

    return {"nodes": nodes, "edges": edges}


def build_institution_network(works: list[dict[str, Any]], institutions: list[dict[str, Any]]) -> dict[str, Any]:
    lookup = {institution["openalexId"]: institution for institution in institutions}
    edge_counts: Counter = Counter()
    for work in works:
        ids = sorted({institution.get("id") for institution in work_institutions(work) if institution.get("id")})
        for index, source in enumerate(ids):
            for target in ids[index + 1 :]:
                edge_counts[(source, target)] += 1

    top_ids = {institution["openalexId"] for institution in institutions[:60]}
    for (source, target), _ in edge_counts.most_common(120):
        top_ids.add(source)
        top_ids.add(target)
        if len(top_ids) >= 90:
            break

    nodes = []
    for institution_id in top_ids:
        institution = lookup.get(institution_id)
        if institution:
            nodes.append(
                {
                    "id": short_id(institution_id),
                    "openalexId": institution_id,
                    "label": institution["name"],
                    "type": "institution",
                    "score": institution["strengthScore"],
                    "community": institution.get("country") or "Unknown",
                    "country": institution.get("country") or "",
                    "works": institution.get("works", 0),
                }
            )

    edges = []
    for (source, target), weight in edge_counts.most_common(220):
        if source in top_ids and target in top_ids:
            edges.append({"source": short_id(source), "target": short_id(target), "weight": weight, "type": "institution-collaboration"})
    return {"nodes": nodes, "edges": edges}


def build_network_communities(network: dict[str, Any]) -> list[dict[str, Any]]:
    groups: defaultdict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "label": "",
            "nodeCount": 0,
            "edgeCount": 0,
            "scoreTotal": 0.0,
            "institutions": Counter(),
            "countries": Counter(),
            "topNodes": [],
        }
    )
    node_lookup = {node["id"]: node for node in network.get("nodes", [])}
    for node in network.get("nodes", []):
        community = node.get("community") or "Mixed"
        row = groups[community]
        row["label"] = community
        row["nodeCount"] += 1
        row["scoreTotal"] += float(node.get("score") or 0)
        if node.get("institution"):
            row["institutions"][node["institution"]] += 1
        if node.get("country"):
            row["countries"][node["country"]] += 1
        row["topNodes"].append({"label": node.get("label", ""), "score": round(float(node.get("score") or 0), 1)})

    for edge in network.get("edges", []):
        source = node_lookup.get(edge["source"])
        target = node_lookup.get(edge["target"])
        if source and target and (source.get("community") or "Mixed") == (target.get("community") or "Mixed"):
            groups[source.get("community") or "Mixed"]["edgeCount"] += 1

    rows = []
    for row in groups.values():
        top_nodes = sorted(row["topNodes"], key=lambda item: item["score"], reverse=True)[:4]
        rows.append(
            {
                "label": row["label"],
                "nodeCount": row["nodeCount"],
                "edgeCount": row["edgeCount"],
                "avgScore": round(safe_divide(row["scoreTotal"], row["nodeCount"]), 1),
                "topInstitutions": [name for name, _ in row["institutions"].most_common(3)],
                "topCountries": [name for name, _ in row["countries"].most_common(3)],
                "topNodes": top_nodes,
            }
        )
    return sorted(rows, key=lambda item: (item["nodeCount"], item["edgeCount"]), reverse=True)[:8]


def build_subtopic_matrix(institutions: list[dict[str, Any]], subtopics: list[dict[str, Any]]) -> dict[str, Any]:
    columns = [subtopic["label"] for subtopic in subtopics[:8]]
    rows = []
    for institution in institutions[:10]:
        values = []
        institution_topics = set(institution.get("subtopics", []))
        for column in columns:
            values.append(
                {
                    "subtopic": column,
                    "value": 1.0 if column in institution_topics else 0.22 if any(part in column for part in institution_topics) else 0.0,
                }
            )
        rows.append({"institution": institution["name"], "country": institution.get("country", ""), "values": values})
    return {"columns": columns, "rows": rows}


def frontier_cards(topic: dict[str, Any], subtopics: list[dict[str, Any]], authors: list[dict[str, Any]], institutions: list[dict[str, Any]], papers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cards = []
    if subtopics:
        cards.append(
            {
                "label": "Fastest-growing subtopic",
                "title": subtopics[0]["label"],
                "value": f"{round(subtopics[0]['growth'] * 100)}%",
                "description": "Three-year growth versus the prior three-year window.",
                "type": "growth",
            }
        )
    if institutions:
        cards.append(
            {
                "label": "Institutional hub",
                "title": institutions[0]["name"],
                "value": f"{institutions[0]['works']} works",
                "description": "Highest institution strength score in the selected artifact.",
                "type": "institution",
            }
        )
    if authors:
        cards.append(
            {
                "label": "Rising visibility",
                "title": authors[0]["name"],
                "value": f"{authors[0]['risingScore']}",
                "description": "Top rising visibility score among recent topic authors.",
                "type": "author",
            }
        )
    if papers:
        cards.append(
            {
                "label": "Recent impact paper",
                "title": papers[0]["title"],
                "value": f"{papers[0]['citations']} citations",
                "description": f"Published {papers[0]['year']} / {papers[0]['source']}.",
                "type": "paper",
                "url": papers[0].get("url"),
            }
        )
    return cards


def build_quality(topic: dict[str, Any], works: list[dict[str, Any]], countries: list[dict[str, Any]]) -> dict[str, Any]:
    seed_topic_ids = {short_id(value) for value in topic.get("openalex_topic_ids", [])}
    matched_by_topic = sum(1 for work in works if seed_topic_ids and seed_topic_ids.intersection(work_topic_ids(work)))
    authorships = [authorship for work in works for authorship in work.get("authorships", [])]
    author_slots = len(authorships)
    institution_mentions = [
        institution
        for authorship in authorships
        for institution in authorship.get("institutions", [])
    ]
    resolved_institutions = [institution for institution in institution_mentions if institution.get("id")]
    resolved_countries = [institution for institution in resolved_institutions if institution.get("country_code")]
    latest_year = max((int(work.get("publication_year") or 0) for work in works), default=0)
    country_rows = [country for country in countries if country["country"] != "Unknown"]
    topic_id_share = safe_divide(matched_by_topic, len(works)) if seed_topic_ids else 0.0
    author_rate = safe_divide(sum(1 for authorship in authorships if (authorship.get("author") or {}).get("id")), author_slots)
    institution_rate = safe_divide(len(resolved_institutions), len(institution_mentions))
    country_rate = safe_divide(len(resolved_countries), len(resolved_institutions))
    completeness = (
        0.25 * min(1.0, len(works) / 900)
        + 0.2 * (topic_id_share if seed_topic_ids else 0.55)
        + 0.2 * author_rate
        + 0.2 * institution_rate
        + 0.15 * country_rate
    )
    return {
        "worksCollected": len(works),
        "topicIdMatchShare": round(topic_id_share, 3),
        "keywordFallbackShare": round(1.0 - topic_id_share, 3) if seed_topic_ids else 1.0,
        "authorResolutionRate": round(author_rate, 3),
        "institutionResolutionRate": round(institution_rate, 3),
        "countryResolutionRate": round(country_rate, 3),
        "latestPublicationYear": latest_year,
        "mappedCountries": len(country_rows),
        "dataCompletenessScore": round(100 * completeness, 1),
    }


def build_insights(
    topic: dict[str, Any],
    metrics: dict[str, Any],
    quality: dict[str, Any],
    subtopics: list[dict[str, Any]],
    authors: list[dict[str, Any]],
    institutions: list[dict[str, Any]],
    countries: list[dict[str, Any]],
    papers: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    top_country = next((country for country in countries if country["country"] != "Unknown"), None)
    top_subtopic = subtopics[0] if subtopics else None
    top_author = authors[0] if authors else None
    top_institution = institutions[0] if institutions else None
    top_paper = papers[0] if papers else None
    trend_detail = (
        f"{top_subtopic['label']} is the fastest visible subtopic, and recent work volume is "
        f"{metrics['worksLast3Years']:,} works across the latest three-year window."
        if top_subtopic
        else f"Recent work volume is {metrics['worksLast3Years']:,} works across the latest three-year window."
    )
    cards = [
        {
            "label": "Why this topic is moving",
            "title": f"{round(metrics['growthRate'] * 100)}% recent growth",
            "value": f"{metrics['worksLast3Years']:,} works",
            "description": f"{trend_detail} Trend score is {metrics['trendScore']}.",
            "type": "trend",
        },
        {
            "label": "Where activity concentrates",
            "title": top_institution["name"] if top_institution else "Institution not resolved",
            "value": f"{metrics['activeInstitutions']:,} institutions",
            "description": f"Activity looks {concentration_label(metrics['concentrationScore'])}; the leading institution signal is based on works, citations, collaborators, and subtopic breadth.",
            "type": "institution",
        },
        {
            "label": "Who is entering the field",
            "title": top_author["name"] if top_author else "Author not resolved",
            "value": f"{round(metrics['newAuthorShare'] * 100)}% new-author share",
            "description": "; ".join(top_author.get("scoreDrivers", [])[:3]) if top_author and top_author.get("scoreDrivers") else "New-author share estimates how much recent activity comes from authors not seen in the prior window.",
            "type": "author",
        },
        {
            "label": "Which papers changed the signal",
            "title": top_paper["title"] if top_paper else "Paper not resolved",
            "value": f"{top_paper['citations']:,} citations" if top_paper else "No papers",
            "description": f"{top_paper['year']} in {top_paper['source']}; ranked by recency, citations, and citation velocity." if top_paper else "No paper signal is available in this topic snapshot.",
            "type": "paper",
            "url": top_paper.get("url") if top_paper else None,
        },
        {
            "label": "Geographic footprint",
            "title": top_country.get("name") or country_name(top_country["country"]) if top_country else "Country not resolved",
            "value": f"{quality['mappedCountries']} mapped countries",
            "description": f"{round((top_country or {}).get('workShare', 0) * 100)}% of mapped works are attributed to the leading country; country resolution is {round(quality['countryResolutionRate'] * 100)}%.",
            "type": "geo",
        },
    ]
    if subtopics:
        cards.insert(
            1,
            {
                "label": "Fastest visible subtopic",
                "title": subtopics[0]["label"],
                "value": f"{round(subtopics[0]['growth'] * 100)}% growth",
                "description": "Subtopic growth uses recent versus prior three-year work counts among OpenAlex-assigned topics.",
                "type": "subtopic",
            },
        )
    return cards[:6]


def narrative_summary(topic: dict[str, Any], metrics: dict[str, Any], top_subtopic: str, top_institution: str) -> str:
    return (
        f"{topic['label']} is represented as a curated static OpenAlex topic profile. "
        f"The current artifact tracks {metrics['worksLast5Years']:,} works in the last five years, "
        f"with {metrics['activeAuthors']:,} active authors and {metrics['activeInstitutions']:,} active institutions. "
        f"The strongest visible subtopic is {top_subtopic}, while {top_institution} appears as a leading institution in this snapshot."
    )


def trending_drivers(topic: dict[str, Any]) -> list[str]:
    metrics = topic["metrics"]
    quality = topic["quality"]
    drivers = []
    if metrics["growthRate"] > 0:
        drivers.append(f"{round(metrics['growthRate'] * 100)}% growth")
    if metrics["newAuthorShare"] >= 0.6:
        drivers.append(f"{round(metrics['newAuthorShare'] * 100)}% new authors")
    if metrics["activeInstitutions"] >= 20:
        drivers.append(f"{metrics['activeInstitutions']:,} institutions")
    if quality["mappedCountries"] >= 10:
        drivers.append(f"{quality['mappedCountries']} countries")
    if topic.get("subtopics"):
        drivers.append(topic["subtopics"][0]["label"])
    return drivers[:4]


def trending_explanation(topic: dict[str, Any]) -> str:
    metrics = topic["metrics"]
    subtopic = topic["subtopics"][0]["label"] if topic.get("subtopics") else "the leading subtopic"
    institution = topic["institutions"][0]["name"] if topic.get("institutions") else "the leading institution"
    return (
        f"{metrics['worksLast3Years']:,} recent works, {round(metrics['growthRate'] * 100)}% growth, "
        f"and {round(metrics['newAuthorShare'] * 100)}% new-author share; {subtopic} and {institution} anchor the visible signal."
    )


def process_topic(topic: dict[str, Any], raw_dir: Path, current_year: int) -> dict[str, Any]:
    works = read_jsonl(raw_dir / topic["slug"] / "works.jsonl")
    works = list(
        {
            work.get("id"): work
            for work in works
            if work.get("id") and publication_year(work) <= current_year
        }.values()
    )

    yearly = build_yearly_metrics(works, current_year)
    edges_counter = coauthor_edges(works)
    centrality = degree_centrality(edges_counter)
    bridge = betweenness_centrality(edges_counter)
    subtopics = build_subtopics(works, current_year)
    subtopic_series = build_subtopic_series(works, subtopics, current_year)
    authors = build_authors(works, current_year, centrality, bridge)
    institutions = build_institutions(works, authors, current_year)
    papers = build_papers(works, current_year)
    paper_collections = build_paper_collections(works, current_year)
    countries = build_country_rows(works)
    quality = build_quality(topic, works, countries)
    network = build_author_network(works, authors, edges_counter)
    institution_network = build_institution_network(works, institutions)
    network_communities = {
        "authors": build_network_communities(network),
        "institutions": build_network_communities(institution_network),
    }
    subtopic_matrix = build_subtopic_matrix(institutions, subtopics)

    recent_start = current_year - 2
    prior_start = current_year - 5
    works_recent = period_sum(yearly, "works", recent_start, current_year)
    works_prior = period_sum(yearly, "works", prior_start, recent_start - 1)
    citation_recent = period_sum(yearly, "citationVelocity", recent_start, current_year)
    citation_prior = period_sum(yearly, "citationVelocity", prior_start, recent_start - 1)
    authors_recent = period_sum(yearly, "authors", recent_start, current_year)
    authors_prior = period_sum(yearly, "authors", prior_start, recent_start - 1)
    institutions_recent = period_sum(yearly, "institutions", recent_start, current_year)
    institutions_prior = period_sum(yearly, "institutions", prior_start, recent_start - 1)

    institution_work_values = [institution["works"] for institution in institutions]
    all_authors = {entry["author"]["id"] for work in works for entry in author_entries(work)}
    recent_authors = {
        entry["author"]["id"]
        for work in works
        if int(work.get("publication_year") or 0) >= recent_start
        for entry in author_entries(work)
    }
    prior_authors = {
        entry["author"]["id"]
        for work in works
        if prior_start <= int(work.get("publication_year") or 0) < recent_start
        for entry in author_entries(work)
    }
    new_author_share = safe_divide(len(recent_authors - prior_authors), len(recent_authors))

    trend = topic_trend_score(
        max(0.0, growth_rate(works_recent, works_prior)),
        max(0.0, growth_rate(citation_recent, citation_prior)),
        max(0.0, growth_rate(authors_recent, authors_prior)),
        max(0.0, growth_rate(institutions_recent, institutions_prior)),
        min(1.0, len(subtopics) / 12),
        len(works),
    )
    metrics = {
        "worksLastYear": int(period_sum(yearly, "works", current_year, current_year)),
        "worksLast3Years": int(works_recent),
        "worksLast5Years": int(period_sum(yearly, "works", current_year - 4, current_year)),
        "growthRate": round(growth_rate(works_recent, works_prior), 3),
        "citationVelocity": round(period_sum(yearly, "citationVelocity", recent_start, current_year), 2),
        "activeAuthors": len(all_authors),
        "activeInstitutions": len({institution["openalexId"] for institution in institutions}),
        "concentrationScore": round(hhi(institution_work_values), 3),
        "fragmentationScore": round(fragmentation_score(len(network["edges"]), len(network["nodes"])), 3),
        "newAuthorShare": round(new_author_share, 3),
        "crossDisciplinarySpread": len({subtopic["field"] for subtopic in subtopics}),
        "trendScore": round(trend, 1),
    }
    top_subtopic = subtopics[0]["label"] if subtopics else "Unclassified"
    top_institution = institutions[0]["name"] if institutions else "institution not resolved"

    return {
        "slug": topic["slug"],
        "label": topic["label"],
        "domain": topic["domain"],
        "field": topic.get("field", ""),
        "subfield": topic.get("subfield", ""),
        "workArea": topic.get("work_area", ""),
        "description": topic["description"],
        "summary": narrative_summary(topic, metrics, top_subtopic, top_institution),
        "openalexTopicIds": topic.get("openalex_topic_ids", []),
        "keywordQueries": topic.get("keyword_queries", []),
        "metrics": metrics,
        "quality": quality,
        "insights": build_insights(topic, metrics, quality, subtopics, authors, institutions, countries, papers),
        "yearlyMetrics": yearly,
        "subtopics": subtopics,
        "subtopicSeries": subtopic_series,
        "authors": authors,
        "institutions": institutions,
        "countries": countries,
        "papers": papers,
        "paperCollections": paper_collections,
        "network": network,
        "institutionNetwork": institution_network,
        "networkCommunities": network_communities,
        "subtopicMatrix": subtopic_matrix,
        "frontierCards": frontier_cards(topic, subtopics, authors, institutions, papers),
    }


def build_taxonomy(topics: list[dict[str, Any]]) -> list[dict[str, Any]]:
    domains: defaultdict[str, dict[str, Any]] = defaultdict(lambda: {"domain": "", "fields": defaultdict(lambda: {"field": "", "subfields": defaultdict(list)})})
    for topic in topics:
        domain = topic["domain"]
        field = topic.get("field") or "Unspecified field"
        subfield = topic.get("subfield") or "Unspecified subfield"
        domains[domain]["domain"] = domain
        domains[domain]["fields"][field]["field"] = field
        domains[domain]["fields"][field]["subfields"][subfield].append(
            {
                "slug": topic["slug"],
                "label": topic["label"],
                "workArea": topic.get("workArea", ""),
                "trendScore": topic["metrics"]["trendScore"],
            }
        )
    output = []
    for domain in sorted(domains.values(), key=lambda item: item["domain"]):
        fields = []
        for field in sorted(domain["fields"].values(), key=lambda item: item["field"]):
            subfields = []
            for subfield, subtopics in sorted(field["subfields"].items(), key=lambda item: item[0]):
                subfields.append({"subfield": subfield, "topics": sorted(subtopics, key=lambda item: item["label"])})
            fields.append({"field": field["field"], "subfields": subfields})
        output.append({"domain": domain["domain"], "fields": fields})
    return output


def build_global_leaderboards(topics: list[dict[str, Any]]) -> dict[str, Any]:
    authors: dict[str, dict[str, Any]] = {}
    institutions: dict[str, dict[str, Any]] = {}
    for topic in topics:
        for author in topic["authors"]:
            row = authors.setdefault(
                author["openalexId"],
                {
                    **author,
                    "topicsSeen": [],
                    "aggregateScore": 0.0,
                    "aggregateRecentWorks": 0,
                },
            )
            row["topicsSeen"].append(topic["label"])
            row["aggregateScore"] += author.get("risingScore", 0)
            row["aggregateRecentWorks"] += author.get("recentWorks", 0)
        for institution in topic["institutions"]:
            row = institutions.setdefault(
                institution["openalexId"],
                {
                    **institution,
                    "topicsSeen": [],
                    "aggregateScore": 0.0,
                    "aggregateWorks": 0,
                },
            )
            row["topicsSeen"].append(topic["label"])
            row["aggregateScore"] += institution.get("strengthScore", 0)
            row["aggregateWorks"] += institution.get("works", 0)

    return {
        "authors": sorted(authors.values(), key=lambda row: (row["aggregateScore"], row["aggregateRecentWorks"]), reverse=True)[:80],
        "institutions": sorted(institutions.values(), key=lambda row: (row["aggregateScore"], row["aggregateWorks"]), reverse=True)[:80],
    }


def build_search_index(topics: list[dict[str, Any]], leaderboards: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for topic in topics:
        rows.append(
            {
                "type": "topic",
                "label": topic["label"],
                "description": topic["description"],
                "meta": f"{topic['domain']} / {topic['field']}",
                "path": f"/topic/{topic['slug']}",
                "score": topic["metrics"]["trendScore"],
            }
        )
        for paper in topic["papers"][:3]:
            rows.append(
                {
                    "type": "paper",
                    "label": paper["title"],
                    "description": ", ".join(paper.get("authors", [])[:2]) or paper["source"],
                    "meta": f"{topic['label']} / {paper['year']}",
                    "path": f"/topic/{topic['slug']}",
                    "score": paper["citationVelocity"],
                }
            )
    for author in leaderboards["authors"][:80]:
        rows.append(
            {
                "type": "author",
                "label": author["name"],
                "description": author["institution"],
                "meta": ", ".join(author.get("topicsSeen", [])[:2]),
                "path": "/researchers",
                "score": author["aggregateScore"],
            }
        )
    for institution in leaderboards["institutions"][:80]:
        rows.append(
            {
                "type": "institution",
                "label": institution["name"],
                "description": institution.get("country") or "Country not resolved",
                "meta": ", ".join(institution.get("topicsSeen", [])[:2]),
                "path": "/researchers",
                "score": institution["aggregateScore"],
            }
        )
    return sorted(rows, key=lambda row: row["score"], reverse=True)[:450]


def build_coverage(topics: list[dict[str, Any]], configured_topic_count: int = 0, skipped_topic_count: int = 0) -> dict[str, Any]:
    topic_count = len(topics)
    works = sum(topic["quality"]["worksCollected"] for topic in topics)
    work_counts = sorted(topic["quality"]["worksCollected"] for topic in topics)
    countries = {country["country"] for topic in topics for country in topic["countries"] if country["country"] != "Unknown"}
    fields = {topic["field"] for topic in topics if topic.get("field")}
    work_areas = {topic["workArea"] for topic in topics if topic.get("workArea")}
    quality_scores = [topic["quality"]["dataCompletenessScore"] for topic in topics]
    latest_years = [topic["quality"].get("latestPublicationYear", 0) for topic in topics]
    configured = configured_topic_count or topic_count
    target_depth = round(52089 * 5 / max(1, configured))
    shallowest_topics = sorted(
        [
            {
                "slug": topic["slug"],
                "label": topic["label"],
                "worksCollected": topic["quality"]["worksCollected"],
                "field": topic.get("field", ""),
                "workArea": topic.get("workArea", ""),
            }
            for topic in topics
        ],
        key=lambda row: row["worksCollected"],
    )[:8]
    return {
        "configuredTopics": configured,
        "topics": topic_count,
        "skippedTopics": skipped_topic_count,
        "worksCollected": works,
        "averageWorksPerProfile": round(safe_divide(works, topic_count), 1),
        "minimumWorksPerProfile": work_counts[0] if work_counts else 0,
        "medianWorksPerProfile": work_counts[len(work_counts) // 2] if work_counts else 0,
        "coverageDepthTarget": target_depth,
        "topicsAtOrAboveTargetDepth": sum(1 for count in work_counts if count >= target_depth),
        "topicsBelowTargetDepth": sum(1 for count in work_counts if count < target_depth),
        "shallowestTopics": shallowest_topics,
        "profileCompletionRate": round(safe_divide(topic_count, configured), 3),
        "fields": len(fields),
        "workAreas": len(work_areas),
        "mappedCountries": len(countries),
        "latestPublicationYear": max(latest_years, default=0),
        "averageCompletenessScore": round(safe_divide(sum(quality_scores), len(quality_scores)), 1),
    }


def topic_summary(topic: dict[str, Any]) -> dict[str, Any]:
    return {
        "slug": topic["slug"],
        "label": topic["label"],
        "domain": topic["domain"],
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


def build_index_artifact(artifact: dict[str, Any]) -> dict[str, Any]:
    return {
        "version": artifact["version"],
        "generatedAt": artifact["generatedAt"],
        "artifactStatus": artifact["artifactStatus"],
        "source": artifact["source"],
        "taxonomy": artifact["taxonomy"],
        "coverage": artifact["coverage"],
        "leaderboards": artifact["leaderboards"],
        "searchIndex": artifact["searchIndex"],
        "skippedTopics": artifact.get("skippedTopics", []),
        "topics": [topic_summary(topic) for topic in artifact["topics"]],
        "trending": artifact["trending"],
        "methodology": artifact["methodology"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Process raw OpenAlex JSONL into Research Atlas static artifacts.")
    parser.add_argument("--config", default="data/config/topics.yaml")
    parser.add_argument("--raw-dir", default="data/raw")
    parser.add_argument("--output-dir", default="data/processed")
    parser.add_argument("--topic-artifacts", action="store_true")
    parser.add_argument("--skip-empty", action="store_true")
    parser.add_argument("--min-raw-works", type=int, default=40)
    args = parser.parse_args()

    topics = yaml.safe_load(Path(args.config).read_text()).get("topics", [])
    current_year = date.today().year
    skipped_topics = []
    raw_dir = Path(args.raw_dir)
    processed_topics = []
    for topic in topics:
        works_path = raw_dir / topic["slug"] / "works.jsonl"
        works_count = sum(1 for _ in works_path.open()) if works_path.exists() else 0
        if args.skip_empty and works_count < args.min_raw_works:
            skipped_topics.append({"slug": topic["slug"], "label": topic["label"], "worksCollected": works_count})
            continue
        processed_topics.append(process_topic(topic, raw_dir, current_year))
    trending = sorted(
        [
            {
                "slug": topic["slug"],
                "label": topic["label"],
                "domain": topic["domain"],
                "field": topic.get("field", ""),
                "subfield": topic.get("subfield", ""),
                "workArea": topic.get("workArea", ""),
                "trendScore": topic["metrics"]["trendScore"],
                "growthRate": topic["metrics"]["growthRate"],
                "worksLast3Years": topic["metrics"]["worksLast3Years"],
                "topSubtopic": topic["subtopics"][0]["label"] if topic["subtopics"] else "Unclassified",
                "topInstitution": topic["institutions"][0]["name"] if topic["institutions"] else "Institution not resolved",
                "topCountry": next((country.get("name") or country_name(country["country"]) for country in topic["countries"] if country["country"] != "Unknown"), "Unknown"),
                "newAuthorShare": topic["metrics"]["newAuthorShare"],
                "qualityScore": topic["quality"]["dataCompletenessScore"],
                "qualityLabel": quality_label(topic["quality"]["dataCompletenessScore"]),
                "signalDrivers": trending_drivers(topic),
                "whyTrending": trending_explanation(topic),
            }
            for topic in processed_topics
        ],
        key=lambda row: row["trendScore"],
        reverse=True,
    )
    leaderboards = build_global_leaderboards(processed_topics)
    artifact = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "artifactStatus": "openalex-derived" if any(topic["papers"] for topic in processed_topics) else "sample-empty",
        "source": {
            "label": "OpenAlex",
            "url": "https://openalex.org",
            "notes": "Generated from OpenAlex works, topics, authorships, and institutions.",
        },
        "taxonomy": build_taxonomy(processed_topics),
        "leaderboards": leaderboards,
        "coverage": build_coverage(processed_topics, len(topics), len(skipped_topics)),
        "searchIndex": build_search_index(processed_topics, leaderboards),
        "skippedTopics": skipped_topics,
        "topics": processed_topics,
        "trending": trending,
        "methodology": {
            "trendScore": "recent publication growth, citation velocity, author growth, institution growth, cross-topic expansion, and baseline size penalty",
            "risingResearcherScore": "recent topic publications, citation velocity, growth versus prior period, bridge signal, and topic focus",
            "institutionStrengthScore": "topic publication share, citation share, rising author count, collaboration centrality, and subtopic breadth",
        },
    }

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "atlas.json").write_text(json.dumps(artifact, ensure_ascii=False, separators=(",", ":")))
    (output_dir / "atlas-index.json").write_text(json.dumps(build_index_artifact(artifact), ensure_ascii=False, separators=(",", ":")))
    topics_dir = output_dir / "topics"
    topics_dir.mkdir(parents=True, exist_ok=True)
    for stale in topics_dir.glob("*.json"):
        stale.unlink()
    for topic in processed_topics:
        (topics_dir / f"{topic['slug']}.json").write_text(json.dumps(topic, ensure_ascii=False, separators=(",", ":")))
    if args.topic_artifacts:
        for topic in processed_topics:
            topic_dir = output_dir / topic["slug"]
            topic_dir.mkdir(parents=True, exist_ok=True)
            for key in [
                "metrics",
                "yearlyMetrics",
                "subtopicSeries",
                "authors",
                "institutions",
                "papers",
                "network",
                "institutionNetwork",
                "networkCommunities",
            ]:
                (topic_dir / f"{key}.json").write_text(json.dumps(topic[key], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
