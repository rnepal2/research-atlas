# V2 engineering ledger

Feature branch: `feature/research-atlas-v2-plan`. Production is not promoted by any of this work.

## Delivered

- Correct full-set institution counts and authorship-specific institution attribution, regression fixtures, inverse-strength bridge distances.
- Main-only production publication; explicit deferred refresh outcome prevents stale republishing; feature verification and downloadable preview artifact.
- SQLite canonical records, topic membership, daily citation observations, durable cursor checkpoints, daily usage ledger, bounded collection and reconciliation modes.
- Optional local `.env` loading with no browser credential exposure. Bearer authentication avoids keys in request/error URLs.
- Development-only acquisition workflow with durable release-asset checkpoints; independent of the production refresh workflow.
- Immutable content-addressed research snapshots; checksum-verified browser loads; lazy paper-detail shards; structural/data integrity validator.
- Offline TF-IDF → SVD → t-SNE paper landscape, seeded thematic grouping, explicit similarity/coverage caveats and precision-focused AI title gate.
- Overview, Explore and Compare routes; existing topic routes retained. Linked paper selection, paper list, year/theme/type/title filters, reading list, CSV/BibTeX exports, view sharing and camera state.
- Graph-first network layout, topic context carried across navigation, visible researcher labels, quieter insight cards, responsive workspace and reduced-motion styling.

## Release gates still requiring evidence

- The bounded backfill is partial. Do not call the AI corpus complete until every partition is exhausted and reconciliation passes.
- Precision/recall audit against a human-labeled 100–200-paper set is not complete. Title anchoring improves precision but can exclude relevant work.
- Historical citation velocity requires future observations; no historical observations are invented.
- Million-point rendering, multiresolution viewport tiling, lasso selection, a renderer comparison benchmark and topology-derived communities are not delivered in the initial explorer.
- Browser task tests, responsive/keyboard checks and external user sessions must be reported individually; a passing build is not user testing.
- No merge to main, production promotion, paid service or external notification is implied.

This ledger deliberately separates shipped code from the ambitions in the assessment. It is not a declaration that every V2 acceptance gate has passed.
