# Methodology

Research Atlas is a static OpenAlex snapshot. Its scores are discovery signals, not judgments of scientific quality.

## Topic Profiles

Each topic is defined in `data/config/topics.yaml` with an OpenAlex-style domain, field, subfield, work area, optional topic IDs, and keyword fallback queries. The refresh pipeline collects recent works, deduplicates them by OpenAlex ID, and builds compact profiles for the frontend.

## Trend Score

Trend score combines normalized recent signals:

- Work growth
- Citation velocity growth
- Active author growth
- Institution growth
- Cross-topic expansion
- A size penalty for very large established areas

This keeps broad fields from automatically outranking smaller areas with faster momentum.

## Rising Researcher Score

Rising researcher means increasing visibility inside a selected topic. It is based on recent topic publications, citation velocity, growth versus the prior period, collaboration or bridge signal, and topic focus.

## Institution Strength

Institution strength combines topic publication share, citation share, rising-author presence, collaboration breadth, and subtopic breadth.

## Networks

Researcher networks use coauthorship edges. Institution networks use shared-work collaboration edges. Node scores come from the topic-level rankings, and community summaries are grouped from the processed graph metadata.

## Caveats

- OpenAlex topic assignment is model-generated and can be noisy.
- Keyword fallback can capture adjacent work when a topic is new or broad.
- Citations favor older papers, so the app also uses citation velocity.
- Author and institution disambiguation depends on OpenAlex records.
- The public site is static until the pipeline is refreshed and rebuilt.
