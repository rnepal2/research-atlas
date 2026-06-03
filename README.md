# Research Atlas

Static OpenAlex research atlas built with React, Vite, and a Python data pipeline.

## Run Locally

```bash
python3 -m pip install -r requirements.txt
cd frontend
npm install
npm run dev
```

The app reads `frontend/public/data/atlas.json`, which is synced from `data/processed/atlas.json` before dev and build commands.

## Refresh Data

```bash
export OPENALEX_API_KEY="your-key"
python3 scripts/refresh_data.py --max-works 600
```

For a local rebuild from existing raw files:

```bash
python3 scripts/refresh_data.py --skip-collect
```

Only `data/processed/atlas.json` is committed. Raw OpenAlex files, API cache files, build output, and the synced frontend data copy are ignored.

## Build

```bash
cd frontend
npm run build
```

For GitHub Pages:

```bash
cd frontend
GITHUB_PAGES=true npm run build
```

Before the deploy workflow can publish, enable GitHub Pages for the repository and set the source to **GitHub Actions** in repository settings. The default workflow token cannot enable Pages on a new repository by itself.
