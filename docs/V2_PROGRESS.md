# V2 engineering ledger

Feature branch: `feature/research-atlas-v2-plan`. Production is not promoted by any of this work.

## November 8 direction

The purpose is now **AI research, in context**: computational methods, and their
applications within the scientific domains already configured. `edition.yaml`
defines the boundary: 23 AI/computer-science areas and 77 application contexts.
An application work must contain explicit AI methods in its title or abstract;
general medical/physics records are not automatically presented as AI research.
The Folio visual system uses warm paper, ink, copper and serif editorial headings,
with a charcoal alternative. There is no green-glow visual identity.

Source reconciliation refreshed 37,234 legacy work IDs; 1,985 unresolved/merged IDs
were excluded. Annual aggregate queries were refreshed for all 100 profiles.
The resulting landscape is still partial, not complete across these boundaries.

The accepted development snapshot is `45617efbce24ba11`: 7,743 unique papers,
7,587 abstracts, and 100 of 1,000 declared extraction boundaries started. None
is exhausted yet. Organizational/placeholder author records are excluded from
the people directory without reallocating their citation credit. All 100 annual
context profiles were rebuilt with inspectable queries; curated queries now use
title/abstract AND-of-term semantics, rather than exact long phrases.

The Folio milestone has shared 40px default controls, quiet underline tabs,
mobile menu navigation, visible list pagination, and a graph-first exploration
layout. Browser evidence and unverified checks are recorded in
`docs/qa-2026-11-08/README.md`.

The next first-version design pass follows the user's November 8 steering:
reduce destination/page fragmentation; make trends supporting context; connect
people and collaboration to the same paper evidence; improve map framing,
visual hierarchy, focus transitions and interaction feedback. The current Folio
milestone is a foundation, not final visual acceptance.

## Delivered

- Correct full-set institution counts and authorship-specific institution attribution, regression fixtures, inverse-strength bridge distances.
- Main-only production publication; explicit deferred refresh outcome prevents stale republishing; feature verification and downloadable preview artifact.
- SQLite canonical records, topic membership, daily citation observations, durable cursor checkpoints, daily usage ledger, bounded collection and reconciliation modes.
- Optional local `.env` loading with no browser credential exposure. Bearer authentication avoids keys in request/error URLs.
- Development-only acquisition workflow with durable release-asset checkpoints; independent of the production refresh workflow.
- Immutable content-addressed research snapshots; checksum-verified browser loads; lazy paper-detail shards; structural/data integrity validator.
- Offline TF-IDF → SVD → t-SNE paper landscape, seeded thematic grouping and explicit similarity/coverage caveats. Computing topics use curated eligibility; scientific applications additionally require explicit AI methods in the title or abstract.
- Overview, Explore and Compare routes; existing topic routes retained. Linked paper selection, paper list, year/theme/type/title filters, reading list, CSV/BibTeX exports, view sharing and camera state.
- Graph-first network layout, topic context carried across navigation, visible researcher labels, quieter insight cards, responsive workspace and reduced-motion styling.

## Release gates still requiring evidence

- The bounded backfill is partial. Do not call the AI corpus complete until every partition is exhausted and reconciliation passes.
- Precision/recall audit against a human-labeled 100–200-paper set is not complete. Explicit method anchoring improves application precision but can exclude relevant work.
- Historical citation velocity requires future observations; no historical observations are invented.
- Million-point rendering, multiresolution viewport tiling, polygon lasso selection, a renderer comparison benchmark and topology-derived communities are not delivered in the initial explorer. Rectangular region selection is implemented. Synthetic 50k/100k point fixtures rendered in the in-app browser; reported frame cadence is not a comprehensive GPU or device benchmark.
- Browser task tests, responsive/keyboard checks and external user sessions must be reported individually; a passing build is not user testing.
- No merge to main, production promotion, paid service or external notification is implied.

This ledger deliberately separates shipped code from the ambitions in the assessment. It is not a declaration that every V2 acceptance gate has passed.
