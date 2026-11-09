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

The November 8 development snapshot was `ee0e9de2d0f9442f`: 10,012 unique work IDs,
9,844 abstracts, and 118 of 1,000 declared extraction boundaries started. None
is exhausted yet. Organizational/placeholder author records are excluded from
the people directory without reallocating their citation credit. All 100 annual
context profiles were rebuilt with inspectable queries; curated queries now use
title/abstract AND-of-term semantics, rather than exact long phrases.

The Folio milestone has shared 40px default controls, quiet underline tabs,
mobile menu navigation, visible list pagination, and a graph-first exploration
layout. The earlier accepted `45617efbce24ba11` snapshot remains available for
historical links. Browser evidence and unverified checks are recorded in
`docs/qa-2026-11-08/README.md` and `docs/qa-2026-11-09/README.md`.

## November 9 first-version candidate (superseded layout)

- Five primary destinations: Overview, Explore, Trends, People & collaboration,
  Methods & data. People and generic Networks links resolve to the same workspace;
  explicit topic-network routes retain their original source context.
- Explore has a larger canvas, smaller point glyphs, restrained density shading,
  camera-based theme focus, hover evidence, and a collection-coverage timeline.
  Its publication-trend dialog uses annual aggregates, not sampled year counts.
- The collaboration workspace combines a paginated directory, selected profile,
  bounded elastic ego network and the exact papers behind each shared-work link.
  A connection list provides an alternative to canvas input. Graph geometry is
  not an impact measure; only the 32 strongest observed neighbors are drawn.
- Overview research-area cards retain descriptions, two clearly scoped counts
  and both actions, with side-by-side metrics and compact text links. At the
  measured 1600px CSS viewport the methods grid fell from 1,702px to 911px tall.
- Same-path navigation resets stale page state; static-host query redirects
  preserve paper/snapshot links. Missing requested entities are not silently
  replaced by another researcher.
- Paper authorships independently reconcile directory memberships, fractional
  author credit, institutional citation totals and affiliated-author sets before
  accepting a research snapshot.

This is a testable first-version candidate on the feature branch, not a production
promotion, complete backfill or final visual acceptance.

## November 9 consolidated investigation workspace

- Four primary destinations: Overview, Trends, People & collaboration, Methods &
  data. Overview now contains the interactive landscape and evidence panel rather
  than a long card catalog. Fifteen compact starting points (five per collection)
  sit below it, with a route back to all covered topics. Old `/explore` links retain
  their paper, camera, filters and snapshot while resolving to Overview.
- Shared Field → Topic controls use the configured topic hierarchy. Field filters
  form a deduplicated union of curated topic memberships, not a filter on every
  paper's native OpenAlex primary field. Cross-disciplinary papers can belong to
  multiple fields. Scope and snapshot carry across the three investigation pages.
- Trends owns the permanent annual chart, optional two-topic comparison, counts
  and indexed modes, 5/10-year ranges, exact annual values, inspectable source query,
  CSV export and an eight-row paginated topic table. Completed three-year growth
  excludes YTD, and missing/zero baselines do not produce invented growth.
- The sidebar starts as an accessible icon rail; it can expand. A quiet top-right
  Data Refresh dateline follows the selected snapshot's build date. Mobile has
  explicit menu navigation. Light and charcoal palettes update the map together.
- People & collaboration recomputes scoped impact from the filtered paper evidence,
  retains unresolved authorship credit and paginates both directory and supporting
  papers. Directory page size responds to available panel height. Historical
  snapshots lacking a fractional denominator show unavailable scoped author impact.
- Historical-snapshot selection is captured before asynchronous loading, preventing
  URL synchronization from silently replacing a requested saved snapshot. A saved
  snapshot notice offers an explicit switch to the latest release.

The accepted snapshot is now `680a6307e8ea7f9a`: **16,063 distinct OpenAlex work IDs**,
15,386 abstracts, including a 4,783-paper union of Physics and Astronomy collections.
Edition `ai-and-computing-v4` adds explicit scientific-ML terminology (neural operators,
physics-informed models, neural quantum states and neural inference among others).
Method filters report title/abstract mentions, not verified central contributions.
Quantum computing or simulation-based inference alone is not an AI inclusion signal.
The 100 annual trend profiles use the same declared edition query definitions,
source work types and method anchoring as acquisition, with exact request provenance.

Coverage remains partial: **90/1,000 current query-plan boundaries started; 13
exhausted**. Counts from previous query fingerprints are not counted as current
boundary completion. Earlier accepted snapshots, including the same-day 10,376-work
`646c9396d3a367a2` preview, remain available. Distinct IDs are not deduplicated studies.
The development workflow optionally refreshes annual queries as a complete atomic
batch, using its existing budget/checkpoint model. Production weekly refresh and
deployment workflows are unchanged.

Validation: 28 Python tests, seven frontend tests, corpus validation, complete
100-profile static validation, lint/type checking and a GitHub Pages-base build.
Desktop/mobile interaction evidence, independent scoped-impact calculations and
remaining limitations are in [consolidation QA](qa-2026-11-09/consolidation/README.md).

## Delivered

- Correct full-set institution counts and authorship-specific institution attribution, regression fixtures, inverse-strength bridge distances.
- Main-only production publication; explicit deferred refresh outcome prevents stale republishing; feature verification and downloadable preview artifact.
- SQLite canonical records, topic membership, daily citation observations, durable cursor checkpoints, daily usage ledger, bounded collection and reconciliation modes.
- Optional local `.env` loading with no browser credential exposure. Bearer authentication avoids keys in request/error URLs.
- Development-only acquisition workflow with durable release-asset checkpoints; independent of the production refresh workflow.
- Immutable content-addressed research snapshots; checksum-verified browser loads; lazy paper-detail shards; structural/data integrity validator.
- Offline TF-IDF → SVD → t-SNE paper landscape, seeded thematic grouping and explicit similarity/coverage caveats. Computing topics use curated eligibility; scientific applications additionally require explicit AI methods in the title or abstract.
- Overview with the landscape, dedicated Trends and combined collaboration routes; legacy Explore, comparisons and existing topic links retained. Linked paper selection, paper list, field/topic/method/year/theme/type/title filters, reading list, CSV/BibTeX exports, view sharing and camera state.
- Graph-first network layout, topic context carried across navigation, visible researcher labels, quieter insight cards, responsive workspace and reduced-motion styling.

## Release gates still requiring evidence

- The bounded backfill is partial. Do not call the AI corpus complete until every partition is exhausted and reconciliation passes.
- Precision/recall audit against a human-labeled 100–200-paper set is not complete. Explicit method anchoring improves application precision but can exclude relevant work.
- Historical citation velocity requires future observations; no historical observations are invented.
- Million-point rendering, multiresolution viewport tiling, polygon lasso selection, a renderer comparison benchmark and topology-derived communities are not delivered in the initial explorer. Rectangular region selection is implemented. Synthetic 50k/100k point fixtures rendered in the in-app browser; reported frame cadence is not a comprehensive GPU or device benchmark.
- Browser task tests, responsive/keyboard checks and external user sessions must be reported individually; a passing build is not user testing.
- No merge to main, production promotion, paid service or external notification is implied.

This ledger deliberately separates shipped code from the ambitions in the assessment. It is not a declaration that every V2 acceptance gate has passed.
