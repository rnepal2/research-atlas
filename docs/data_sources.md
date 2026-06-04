# Data Sources

Research Atlas currently uses OpenAlex only.

## Snapshot

- 100 configured topic profiles
- 78 currently collected and validated topic profiles
- 52,089 collected OpenAlex works in the current processed snapshot
- 3 OpenAlex-aligned domains: Physical Sciences, Health Sciences, Life Sciences
- Compact published artifact: `data/processed/atlas.json`
- Synced frontend copy: `frontend/public/data/atlas.json`
- Raw OpenAlex JSONL and API cache files stay local and are not committed

## OpenAlex Entities

The pipeline collects and derives product data from:

- Works
- Topics and optional topic metadata
- Authors through work authorships
- Institutions through work authorships
- Countries through institution country codes
- Sources through primary work locations

The collector supports `OPENALEX_API_KEY`, cursor pagination, retries, rate limiting, local caching, topic-id filters, and keyword fallback queries for newer or fuzzier areas. The normal refresh skips topic metadata searches because the frontend artifact is derived from works/authorships; use `src/scripts/discover_openalex_topics.py` when curating OpenAlex topic IDs.

## Refresh

```bash
./src/refresh_data.sh --max-works 900
```

Set `OPENALEX_API_KEY` before production refreshes when possible. Public OpenAlex access works for development, but an API key is more reliable for larger runs.

For a local rebuild from already collected raw files:

```bash
./src/refresh_data.sh --fast
```

## Future Enrichment

Good next sources are Crossref for DOI checks, PubMed for biomedical indexing, NIH RePORTER for grant context, ROR for institution metadata, and OpenCitations for citation graph enrichment.
