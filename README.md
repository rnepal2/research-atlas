# Research Atlas

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
