# Research Atlas

Research Atlas is a static research intelligence site built from OpenAlex data. The heavy work runs offline in Python, then the frontend reads compact JSON artifacts that can be deployed to GitHub Pages.

Current MVP scope:

- 24 curated topic profiles across AI/LLM, medicine, life sciences, physics, and materials
- OpenAlex-aligned domain / field / subfield / topic navigation
- Dark-first UI with light mode toggle
- Static React + Vite frontend
- OpenAlex collection pipeline with API-key support
- Compact processed artifacts for topic intelligence, rising researchers, geographic density, institution matrices, and collaboration networks
- GitHub Pages deployment workflow

## Quick Start

```bash
python3 -m pip install -r requirements.txt
cd frontend
npm install
npm run dev
```

`npm run dev` syncs the committed static artifact from `data/processed/atlas.json` into `frontend/public/data/atlas.json` before Vite starts.

## Refresh Data

Set an OpenAlex API key for useful collection volume:

```bash
export OPENALEX_API_KEY="your-key"
```

Run the full pipeline:

```bash
python3 scripts/refresh_data.py --max-works 600
```

For a fast local rebuild from existing raw files:

```bash
python3 scripts/refresh_data.py --skip-collect
```

The refresh command collects OpenAlex data, processes the compact static artifact, validates it, and syncs the frontend copy. Raw OpenAlex files and API cache files are ignored by git; only `data/processed/atlas.json` is intended for the public repository.

You can also run:

```bash
make data-refresh
make validate-data
```

## Frontend Build

```bash
cd frontend
npm run build
```

For GitHub Pages, the workflow builds with the project base path and deploys `frontend/dist`.

## Repository Layout

```text
docs/                      Product, methodology, and source notes
data/config/topics.yaml    Curated topic seeds and keyword fallbacks
data/processed/atlas.json  Static frontend data artifact
scripts/                   Collection, processing, and data sync scripts
src/analytics/             Reusable Python metric functions
frontend/                  React/Vite static site
```

Generated local-only paths:

```text
data/raw/                   Raw OpenAlex JSONL extracts
.cache/openalex/            API response cache
frontend/public/data/       Synced frontend data copy
frontend/dist/              Vite build output
```

## Positioning

Research Atlas is an open research intelligence atlas for discovering fast-moving topics, rising researchers, institutional expertise, geographic research density, and collaboration networks. It should feel closer to a public intelligence product than a raw OpenAlex dashboard.
