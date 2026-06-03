# Research Atlas Frontend

React + Vite static frontend for Research Atlas.

```bash
npm install
npm run dev
```

The app reads `public/data/atlas.json`, which is synced from `../data/processed/atlas.json` before local dev and production builds.

Useful commands:

```bash
npm run data:sync
npm run lint
npm run build
GITHUB_PAGES=true npm run build
```
