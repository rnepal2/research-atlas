# Data Sources

## OpenAlex

Primary source: OpenAlex API and OpenAlex Topics.

Research Atlas uses:

- Works
- Authors through work authorships
- Institutions through work authorships
- Sources through primary locations
- Topics through `primary_topic` and `topics`

API behavior encoded in the collector:

- `OPENALEX_API_KEY` is passed as `api_key=...`
- Cursor pagination is used for works
- Topic filters use `topics.id`
- Keyword fallback uses OpenAlex work search
- Raw JSONL stays local by default
- Processed JSON artifacts are compact enough for GitHub Pages

## Optional Future Sources

Potential enrichment sources:

- Crossref for DOI metadata checks
- NIH RePORTER for biomedical grant context
- PubMed for MeSH terms in biomedical domains
- ROR for institution metadata
- OpenCitations for citation enrichment

These are intentionally out of scope for the MVP.

