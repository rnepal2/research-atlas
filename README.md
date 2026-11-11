# Research Atlas

[Research Atlas](https://rnepal2.github.io/research-atlas/) explores AI research and its applications in medicine, biology, physics, chemistry, and materials science using [OpenAlex](https://openalex.org/) data. It brings together publication trends, a paper landscape, and sampled people and collaboration networks.

Publication trends are query-matched OpenAlex aggregates. The paper landscape and entity views use a bounded, partially collected corpus; they are not exhaustive rankings or a census of the selected fields. See [metric definitions](docs/METRIC_CONTRACTS.md) for interpretation.

## Run locally

```bash
cd frontend
npm ci
npm run dev
```

The checked-in snapshot needs no API key. To collect data locally, set `OPENALEX_API_KEY` in an ignored root `.env` file; never expose it through a `VITE_` variable.

## Validate

```bash
python3 -m pip install -r requirements.txt
python3 -m unittest discover -s tests
python3 -m src.corpus.validate
npm --prefix frontend test
npm --prefix frontend run lint
GITHUB_PAGES=true npm --prefix frontend run build
```

## Data and deployment

Merges to `main` build and publish the site to GitHub Pages. The [Monday refresh workflow](.github/workflows/refresh-data.yml) runs on `main`, updates the configured OpenAlex topic profiles, and publishes only a fresh, validated result. A deferred or failed refresh leaves the published data unchanged. Deployments preserve a newer published topic-profile snapshot.

The focused paper corpus has a separate, resumable backfill on `develop`. It is not part of the weekly production refresh or a claim of complete coverage. Its scope, budget, and publication gates are in the [acquisition guide](docs/focused-corpus.md). Raw records, API caches, and credentials are not committed.
