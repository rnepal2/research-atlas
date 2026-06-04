# Data Sources

Research Atlas currently uses OpenAlex only.

## Snapshot

- 51 curated topic profiles
- 3 OpenAlex-aligned domains: Physical Sciences, Health Sciences, Life Sciences
- Compact published artifact: `data/processed/atlas.json`
- Synced frontend copy: `frontend/public/data/atlas.json`
- Raw OpenAlex JSONL and API cache files stay local and are not committed

## OpenAlex Entities

The pipeline collects and derives product data from:

- Works
- Topics and topic metadata
- Authors through work authorships
- Institutions through work authorships
- Countries through institution country codes
- Sources through primary work locations

The collector supports `OPENALEX_API_KEY`, cursor pagination, retries, rate limiting, local caching, topic-id filters, and keyword fallback queries for newer or fuzzier areas.

## Refresh

```bash
./src/refresh_data.sh --max-works 260
```

Set `OPENALEX_API_KEY` before production refreshes when possible. Public OpenAlex access works for development, but an API key is more reliable for larger runs.

## Future Enrichment

Good next sources are Crossref for DOI checks, PubMed for biomedical indexing, NIH RePORTER for grant context, ROR for institution metadata, and OpenCitations for citation graph enrichment.
