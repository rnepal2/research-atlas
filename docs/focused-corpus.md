# Focused corpus: acquisition candidate

The candidate in `data/config/focused-corpus.yaml` covers twelve query-defined topics: six in AI methods and generative AI, and six applications spanning medicine/biology, physics, materials and chemistry. It does **not** replace the published edition or its weekly refresh. Topic names describe the analytical lens, not a complete census of all work in a scientific field.

## Cost and duration

`python3 -m src.corpus.focused plan` reads the accepted OpenAlex annual-count snapshot and estimates the number of 100-record cursor pages. On 2026-11-10 it reports 615,181 topic matches **with overlap** across 120 topic-year boundaries, about 6,209 pages and $6.209 in base request charges. Counts will move as OpenAlex indexes and corrects records; retries and other requests add cost. The free key provides $1/day, so this is at least seven fully utilized days, or about 13 days at a $0.50/day project cap. That cap leaves headroom but is not an account-wide quota check: the local checkpoint cannot see use by the production weekly workflow or other clients. Do not run the two collectors simultaneously with the same key.

OpenAlex supports 100 records per cursor page and requires a free key after the first page. Free access does not include the updated-date sync filters. Sources: [pricing](https://help.openalex.org/access/pricing/), [paging](https://help.openalex.org/api/paging/), [sync](https://help.openalex.org/access/sync/).

## Safe acquisition

The unsharded `.cache/corpus/focused.sqlite` is a pilot only. Actual backfill uses an ignored checkpoint per year, such as `.cache/corpus/focused-2026.sqlite`. The configuration locks a signature of every search, topic filter and selected field; changing a query requires a new version and explicit reconciliation, not silent reuse of old checkpoints. Each page and its cursor commit in one SQLite transaction. Inspect sharded progress with `python3 -m src.corpus.focused status`; inspect the pilot with `python3 -m src.corpus.focused status --db .cache/corpus/focused.sqlite`. Collect a bounded 2026 batch with `python3 -m src.corpus.collect --focused --year 2026 --max-pages 250 --budget 0.50`. The budget sums local usage across the pilot and all year shards for the current UTC day, but cannot see other clients or the production workflow. Preserve and back up each shard between sessions. The local `.env` key is never copied into config or site assets.

The pilot on 2026-11-10 spent $0.120 to start every topic-year boundary. Run `python3 -m src.corpus.audit` to inspect that pilot's local eligibility by topic and year; use `--db .cache/corpus/focused-2026.sqlite` for a shard. These are first-page samples, not representative precision estimates; OpenAlex relevance ordering and source stemming matter. Simple plural normalization now prevents obvious false exclusions, but some older-year and application matches still need a more careful relevance audit before publication.

Create an online, integrity-checked backup with `python3 -m src.corpus.checkpoint save --db .cache/corpus/focused-2026.sqlite --archive .cache/corpus/focused-2026.sqlite.gz`. To recover on another machine, use the same paths with `restore`; restoration refuses to overwrite an existing database. Keep a durable off-machine copy of each daily archive. Year shards keep release assets and runner disk use bounded, though full size must still be measured before moving the crawl into Actions.

## Promotion gates

1. Audit the query boundaries and local eligibility on stratified years and cursor positions; version any changed boundary before the full crawl.
2. Exhaust all versioned topic-year partitions, reconcile expected versus fetched counts, and recheck source counts for indexing drift. A completed cursor alone is not a complete corpus claim.
3. Deduplicate work IDs across overlapping topics; validate years, types, abstracts, retractions, topic membership and missingness. Report exclusions and source limitations.
4. Build compact, versioned aggregates and a bounded interactive paper sample. The current full-record t-SNE build and static JSON export cannot be assumed to scale to hundreds of thousands of works or fit a static site. Keep the acquisition database out of the published site.
5. Stage and validate the entire candidate snapshot before atomically switching a public pointer. Only then align the weekly refresh to the focused edition; retain the accepted snapshot on failure.

GitHub Actions scheduling uses the default branch. This feature-branch candidate is deliberately manual until the checkpoint, artifact-size and promotion workflow is designed and tested; the production schedule remains unchanged.

## Refresh after the historical build

For free-key operation, refresh the annual aggregate counts separately from paper details. Weekly runs can recrawl a rolling publication-date window in the current and prior year and refresh a bounded set of high-visibility papers, using the same atomic staging gate. Older topic-year shards must be reconciled on a rotation; source records can be indexed late, deleted, merged or corrected, and the free key has no updated-date sync feed. The UI therefore needs a corpus as-of date and per-boundary reconciliation state. It must not describe a weekly incremental view as a continuously complete census. A full requery of all 2017–present boundaries at every weekly run would consume roughly the same multi-day budget as the initial build and is not viable on the free tier.
