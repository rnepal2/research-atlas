#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape


SITE_URL = "https://rnepal2.github.io/research-atlas"


def route(path: str) -> str:
    return f"{SITE_URL}{path}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate static SEO assets for Research Atlas.")
    parser.add_argument("--artifact", default="data/processed/atlas.json")
    parser.add_argument("--public-dir", default="frontend/public")
    args = parser.parse_args()

    artifact = json.loads(Path(args.artifact).read_text())
    public_dir = Path(args.public_dir)
    public_dir.mkdir(parents=True, exist_ok=True)
    generated = datetime.now(timezone.utc).date().isoformat()

    routes = [
        {
            "path": "/",
            "title": "Research Atlas",
            "description": "Explore research momentum, rising researchers, institutions, papers, geography, and collaboration networks from OpenAlex.",
        },
        {
            "path": "/trending",
            "title": "Trending Intelligence | Research Atlas",
            "description": "Ranked research topics by publication growth, citation velocity, author growth, and institution expansion.",
        },
        {
            "path": "/researchers",
            "title": "Researcher Visibility | Research Atlas",
            "description": "Discover researchers with increasing visibility across curated OpenAlex topic snapshots.",
        },
        {
            "path": "/networks",
            "title": "Collaboration Intelligence | Research Atlas",
            "description": "Explore researcher, institution, geographic, and subtopic collaboration structure.",
        },
        {
            "path": "/about",
            "title": "About Research Atlas",
            "description": "What Research Atlas covers, where its OpenAlex data comes from, and how to interpret its directional signals.",
        },
    ]
    for topic in artifact.get("topics", []):
        title = f"{topic['label']} Research Atlas"
        description = f"OpenAlex intelligence profile for {topic['label']}: momentum, papers, institutions, researchers, geography, and collaboration networks."
        routes.extend(
            [
                {"path": f"/topic/{topic['slug']}", "title": title, "description": description},
                {"path": f"/topic/{topic['slug']}/network", "title": f"{topic['label']} Collaboration Network", "description": description},
                {"path": f"/topic/{topic['slug']}/rising-researchers", "title": f"{topic['label']} Rising Researchers", "description": description},
            ]
        )

    sitemap_items = "\n".join(
        f"  <url><loc>{escape(route(item['path']))}</loc><lastmod>{generated}</lastmod></url>"
        for item in routes
    )
    (public_dir / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{sitemap_items}\n</urlset>\n')
    (public_dir / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n")
    (public_dir / "route-metadata.json").write_text(json.dumps({"siteUrl": SITE_URL, "routes": routes}, separators=(",", ":")))


if __name__ == "__main__":
    main()
