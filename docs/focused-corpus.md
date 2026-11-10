# Focused corpus: acquisition candidate

The candidate in `data/config/focused-corpus.yaml` covers twelve query-defined topics: six in AI methods and generative AI, and six applications spanning medicine/biology, physics, materials and chemistry. It does **not** replace the published edition or its weekly refresh. Topic names describe the analytical lens, not a complete census of all work in a scientific field.

## Cost and duration

`python3 -m src.corpus.focused plan` reads the accepted OpenAlex annual-count snapshot and estimates the number of 100-record cursor pages. On 2026-11-10 it reports 615,181 topic matches **with overlap** across 120 topic-year boundaries, about 6,209 pages and $6.209 in base request charges. Counts will move as OpenAlex indexes and corrects records; retries and other requests add cost. The free key provides $1/day, so this is at least seven fully utilized days, or about 13 days at a $0.50/day project cap. That cap leaves headroom but is not an account-wide quota check: the local checkpoint cannot see use by the production weekly workflow or other clients. Do not run the two collectors simultaneously with the same key.

OpenAlex supports 100 records per cursor page and requires a free key after the first page. Free access does not include the updated-date sync filters. Sources: [pricing](https://help.openalex.org/access/pricing/), [paging](https://help.openalex.org/api/paging/), [sync](https://help.openalex.org/access/sync/).

## Safe acquisition

The candidate has its own ignored `.cache/corpus/focused.sqlite`. The configuration locks a signature of every search, topic filter and selected field; changing a query requires a new version and explicit reconciliation, not silent reuse of old checkpoints. Each page and its cursor commit in one SQLite transaction. Inspect progress with `python3 -m src.corpus.focused status`; collect a bounded batch with `python3 -m src.corpus.collect --focused --max-pages 250 --budget 0.50`. The budget applies to usage recorded **in this database for the current UTC day**. Preserve and back up this database between sessions. The local `.env` key is never copied into config or site assets.

The pilot on 2026-11-10 spent $0.120 to start every topic-year boundary. Run `python3 -m src.corpus.audit` to inspect local eligibility by topic and year. These are first-page samples, not representative precision estimates; OpenAlex relevance ordering and source stemming matter. Simple plural normalization now prevents obvious false exclusions, but some older-year and application matches still need a more careful relevance audit before scale-up.

Create an online, integrity-checked backup with `python3 -m src.corpus.checkpoint save`. To recover on another machine, put the archive at `.cache/corpus/focused.sqlite.gz` and run `python3 -m src.corpus.checkpoint restore`; restoration refuses to overwrite an existing database. Keep a durable off-machine copy of each daily archive. A single GitHub release asset may eventually exceed its size limit, so the full-corpus checkpoint transport will need sharding or another bounded design before moving this crawl into Actions.

## Promotion gates

1. Audit the query boundaries and local eligibility on stratified years and cursor positions; version any changed boundary before the full crawl.
2. Exhaust all versioned topic-year partitions, reconcile expected versus fetched counts, and recheck source counts for indexing drift. A completed cursor alone is not a complete corpus claim.
3. Deduplicate work IDs across overlapping topics; validate years, types, abstracts, retractions, topic membership and missingness. Report exclusions and source limitations.
4. Build compact, versioned aggregates and a bounded interactive paper sample. The current full-record t-SNE build and static JSON export cannot be assumed to scale to hundreds of thousands of works or fit a static site. Keep the acquisition database out of the published site.
5. Stage and validate the entire candidate snapshot before atomically switching a public pointer. Only then align the weekly refresh to the focused edition; retain the accepted snapshot on failure.

GitHub Actions scheduling uses the default branch. This feature-branch candidate is deliberately manual until the checkpoint, artifact-size and promotion workflow is designed and tested; the production schedule remains unchanged.
