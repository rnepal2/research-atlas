# Research Atlas

## V2 development preview

The `feature/research-atlas-v2-plan` branch contains the **AI research, in context** preview:
Overview introduces the research landscape and explains how to read it, with compact
starting-point collections for AI, Physics, Health & life sciences, and Chemistry &
materials. Advancing AI and AI in science provide two lenses on the same evidence.
Trends shows the selected topic or field's annual publications by default, with
comparison available through Add comparison. People & collaboration combines the
directory, profiles and paper-backed networks. Research focus, Field and Topic
filters carry across these workspaces. The sidebar starts
collapsed and the snapshot build date appears at the top right. Old Explore links
resolve to Overview; comparisons and existing topic routes remain accessible
without separate primary navigation entries. Local reading lists, CSV/BibTeX exports
and snapshot-aware share links support investigation. `data/config/edition.yaml` defines the computational-methods
track and AI applications inside the existing scientific domains. Research coverage
is partial and explicitly labeled. The Folio theme is an editorial paper-and-ink design.

```bash
python3 -m pip install -r requirements-research.txt
python3 -m unittest discover -s tests -v
python3 -m src.corpus.validate
npm --prefix frontend ci
npm --prefix frontend test
npm --prefix frontend run dev
```

The checked-in research snapshot runs without an API key. To acquire more records,
set `OPENALEX_API_KEY` in the ignored root `.env` (never `VITE_OPENALEX_API_KEY`):

```bash
python3 -m src.corpus.collect --topic ai-agents --max-pages 50 --budget 0.25
python3 -m src.corpus.build
python3 -m src.corpus.validate
```

Annual context can be refreshed as a separate, staged batch with
`python3 -m src.corpus.context`. Its project budget reserves for bounded retries;
it cannot account for unrelated use of the same API key. Curated annual queries
use title/abstract terms rather than exact long phrases or full-text mentions.
Each profile retains the request and observation date.

The focused edition's Trends page uses its own query-matched annual batch, not
the broader legacy parent-topic totals. Refresh it before building after changing
edition queries (or at a year boundary):

```bash
python3 -m src.corpus.trends --budget 0.45
python3 -m src.corpus.build
python3 -m src.corpus.validate
```

All 100 annual profiles and 26 nonempty field/focus unions must validate before
the staged batch replaces the previous one. Broad totals use nested OpenAlex set
queries preserving each topic's title/abstract, method and assignment rules—not
summed topic counts. Requests use the documented [OpenAlex query-object API](https://help.openalex.org/api/oql/).
`--reuse-today` may reuse only same-UTC-day topic observations with exactly unchanged
query definitions. The build can reuse an accepted snapshot's annual data only
when edition, query fingerprints and year coverage still match. Annual query totals
are not a census, AI adoption rate, or the number of locally collected papers.

When only annual context changed, preserve accepted paper evidence and map geometry
while producing a new immutable snapshot:

```bash
python3 -m src.corpus.attach_trends
```

This validates both contexts and the candidate before changing the local pointer;
it does not deploy. The full annual batch reserves $0.252 for bounded retries at the
current 100-topic/26-union scope, in addition to today's existing project reservations.
Use an adequate budget (for example 0.45) when enabling the manual workflow's
annual refresh. This ledger cannot account for unrelated use of the API key.

Collection persists canonical records, memberships, citation observations, usage and
transactional page cursors in `.cache/corpus/atlas.sqlite`. Rerunning resumes work.
`--recent-days 90` collects an overlapping publication window; `--reconcile` restarts
partitions to revisit older changes. Neither mode is OpenAlex paid change synchronization.
Use `--topic` repeatedly to choose areas and share budget fairly between backfills.

The separate **Develop research corpus** workflow can be dispatched on a feature
branch. It preserves SQLite state in a development prerelease asset and produces a
downloadable snapshot artifact. It cannot deploy the production site. Feature pushes
run tests, lint, type checking and a build with read-only repository permissions.
Its optional `refresh_trends` input refreshes the full annual batch before collecting
papers and shares the same project daily budget. The existing production weekly
refresh schedule and workflow are unchanged by this preview.

Snapshot delivery uses `research-manifest.json` → content-addressed files with SHA-256
checksums. The browser verifies bytes before rendering. Historical snapshot links work
when the referenced snapshot remains available. Local promotion/rollback is verified:

```bash
python3 -m src.corpus.promote SNAPSHOT_HASH --target frontend/public/research
```

The development-only `/benchmark` route uses clearly labeled synthetic point fixtures.
It is not a research dataset and does not establish million-point production performance.
See [implementation ledger](docs/V2_PROGRESS.md), [metric contracts](docs/METRIC_CONTRACTS.md)
and the [assessment](docs/assessment-2026-11-07/README.md).

[Research Atlas](https://rnepal2.github.io/research-atlas/) is a static research intelligence site built from OpenAlex data.

## Development

```bash
cd frontend
npm ci
npm run dev
```

## Refresh Data

```bash
python3 -m pip install -r requirements.txt
OPENALEX_API_KEY="..." ./src/refresh_data.sh --max-works 1000 --require-complete-config
```

The weekly GitHub Actions workflow refreshes all configured topics, validates the artifacts, builds the site, and publishes directly to `gh-pages`. Raw OpenAlex responses and API caches are not committed.

To rebuild from existing local data:

```bash
./src/refresh_data.sh --fast
```

## Build

```bash
GITHUB_PAGES=true npm --prefix frontend run build
```

GitHub Pages serves the root of the `gh-pages` branch. Code deployments preserve the newest published data snapshot.
