# Focused corpus acquisition

`data/config/focused-corpus.yaml` defines twelve query-based topics: AI methods and generative AI, plus applications in medicine, biology, physics, materials, and chemistry. The collected paper corpus is a development candidate. It does not replace the published snapshot or its weekly topic-profile refresh. These topics are analytical selections, not a complete census of their fields.

## Budget and checkpoints

Run `python3 -m src.corpus.focused plan` to estimate current source matches and cursor-page cost. OpenAlex permits 100 records per cursor page and requires an API key beyond the first page. The free key has a daily allowance; [pricing](https://help.openalex.org/access/pricing/), [paging](https://help.openalex.org/api/paging/), and [sync access](https://help.openalex.org/access/sync/) can change. Check the current terms before a large run. Local budget accounting cannot see requests made by another client or workflow using the same key.

Use an ignored SQLite checkpoint per publication year. Collection commits each page and cursor together, so an interrupted run can resume. Query definitions are fingerprinted; changing a search or topic filter requires a new version and reconciliation rather than silent checkpoint reuse.

```bash
python3 -m src.corpus.collect --focused --year 2026 --max-pages 250 --budget 0.50
python3 -m src.corpus.focused status
python3 -m src.corpus.audit --db .cache/corpus/focused-2026.sqlite
```

The `Develop focused corpus` GitHub Action can collect one bounded year shard on `develop` and save its checkpoint. It does not publish the site. Do not run it concurrently with the production refresh using the same free key. Back up each shard off-machine; `python3 -m src.corpus.checkpoint save --db .cache/corpus/focused-2026.sqlite --archive .cache/corpus/focused-2026.sqlite.gz` creates an integrity-checked archive. `restore` refuses to overwrite an existing database.

## Before publication

1. Audit topic relevance across years and cursor positions; version any query changes.
2. Exhaust each topic-year partition, compare fetched records with fresh source counts, and reconcile late indexing or corrections.
3. Deduplicate work IDs across topics and validate eligibility, years, types, abstracts, retractions, memberships, and missingness.
4. Build bounded static aggregates and interactive samples; measure artifact size and browser performance before replacing the published view.
5. Stage and validate the full candidate before switching the public pointer. Preserve the accepted snapshot on failure.

A future paper-corpus refresh can recrawl a rolling publication window and rotate reconciliation of older partitions. Free access does not provide an updated-date sync feed, so a weekly incremental pull alone cannot establish complete historical coverage. The UI must state the corpus as-of date and coverage limits accurately.
