# Research Atlas

## V2 development preview

The `feature/research-atlas-v2-plan` branch contains the **AI research, in context** preview:
Overview, a text-similarity paper landscape, source evidence, People & Institutions,
aligned topic comparisons, local reading lists and CSV/BibTeX exports. Existing topic
routes remain available. `data/config/edition.yaml` defines the computational-methods
track and AI applications inside the existing scientific domains. Research coverage
is partial and explicitly labeled. The Folio theme is an editorial paper-and-ink design.

```bash
python3 -m pip install -r requirements-research.txt
python3 -m unittest discover -s tests -v
python3 -m src.corpus.validate
npm --prefix frontend ci
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

Collection persists canonical records, memberships, citation observations, usage and
transactional page cursors in `.cache/corpus/atlas.sqlite`. Rerunning resumes work.
`--recent-days 90` collects an overlapping publication window; `--reconcile` restarts
partitions to revisit older changes. Neither mode is OpenAlex paid change synchronization.
Use `--topic` repeatedly to choose areas and share budget fairly between backfills.

The separate **Develop research corpus** workflow can be dispatched on a feature
branch. It preserves SQLite state in a development prerelease asset and produces a
downloadable snapshot artifact. It cannot deploy the production site. Feature pushes
run tests, lint, type checking and a build with read-only repository permissions.

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
