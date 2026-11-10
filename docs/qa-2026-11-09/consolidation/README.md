# Consolidated investigation workspace — November 9, 2026

Branch: `feature/research-atlas-v2-plan`. Supersedes the earlier November 9 layout
checks where Explore was separate and topic trends were a dialog. No production
promotion or change to the production weekly-refresh workflow.

## Data and automated checks

- Accepted snapshot `680a6307e8ea7f9a`: 16,063 distinct OpenAlex work IDs and
  15,386 abstracts. Current edition-plan coverage: 90/1,000 boundaries started,
  13 exhausted. A changed query fingerprint creates a new boundary; older progress
  is not presented as completion of the new scope. Coverage is explicitly partial.
- Physics and Astronomy's deduplicated topic-membership union contains 4,783 works;
  45 have declared neural-operator terminology. These counts were independently
  recomputed from the accepted landscape and matched the displayed filters.
- Source example: W3118310857, “Fourier Neural Operator for Parametric Partial
  Differential Equations,” appears in AI for Science with a neural-operator tag,
  source DOI, abstract and recorded authorships. A scientific-ML method tag is
  terminology evidence, not verification of the work's central contribution.
- Independent scoped-impact calculation for Francisco Villaescusa-Navarro
  (A5002061021): 32 Physics papers, sum(citations / credited authorships) =
  207.4933316683. The UI shows 32 papers and rounded impact 207. Unresolved or
  excluded author credit is retained in the denominator.
- All 28 Python regression tests and seven frontend unit tests pass. Corpus
  checksum/coordinate/relationship/method/annual-query validation, the complete
  100-profile legacy static validator, frontend lint/type checking and the GitHub
  Pages-base production build pass. No live-provider requests are made by these
  regression tests.
- New regression cases cover query/work-type compatibility, atomic annual batches,
  missing counts versus verified zero, complete-batch budget preflight, exact
  same-day query reuse, scientific-ML inclusion, field/topic normalization, YTD and
  zero-baseline growth handling, and scoped author/institution citation accounting.

## Browser checks observed

Production-format local build in in-app Chromium. Dimensions are measured CSS
viewports; screenshot pixels differ because of the browser's existing zoom.

- **Overview, 1280×720:** landscape, source footer (bottom 694px), shared filters
  and evidence panel fit the main view. The all-fields count is 16,063. The sidebar
  starts collapsed; expanding/collapsing works. Data Refresh is at top right.
  Light/charcoal switching updates both map points and legend colors.
- **Featured collections:** five compact rows each for AI & computing, Physics,
  Health & life sciences. Selecting Particle Physics focuses the map on its 836
  collected works and sets the dependent Field/Topic controls. Browse all covered
  topics returns to the full collection; View trends carries selected scope.
- **Snapshot continuity:** a saved `ee0e9de2d0f9442f` Agents link retains that snapshot,
  old-date dateline and historical notice. View latest explicitly switches to
  `680a6307e8ea7f9a` while retaining Agents. Navigation links update their snapshot.
  `/explore?paper=W3118310857&snapshot=680a6307e8ea7f9a` resolves to Overview and
  opens that exact paper. The asynchronous selection race was reproduced and fixed.
- **Trends, 1280×720:** Physics scope defaults to Particle Physics, with 4,800 query
  matches in 2023–2025 and +136.8% versus 2020–2022. Comparison with Graph Neural
  Networks shows 16,194 and +116.4%. Indexed mode renders two series with a labeled
  common 2017 baseline and dashed YTD segments. The main plot fits the viewport.
  These are declared API query totals, not the collected-map counts.
- **People & collaboration, 1280×720:** Physics scope carries from Trends, with
  16,354 researcher records. The selected profile above shows 32 papers, impact
  207, and 32 of 104 observed coauthors. Final directory page shows three complete
  rows in a 284px result panel, with scrollHeight equal to clientHeight. Pagination
  and the footer (bottom 688px) remain visible. Supporting papers paginate 12 per
  page (32 papers / three pages); the Institutions tab loads scoped evidence.
- **Mobile, 390×844:** Overview has a 420px map; Field and Topic remain side by
  side. Trends' SVG viewBox width 366 matches its 366px rendered width, preserving
  legible labels. Indexed mode, exact annual-count disclosure and mobile menu
  work. Both pages have document scroll width 390px, with no horizontal page
  overflow. The wide topic table scrolls inside its own container.

## Screenshots

1. [Overview](01-overview.png)
2. [Compact starting-point collections](02-featured-collections.png)
3. [Physics annual trends](03-physics-trends.png)
4. [Indexed cross-topic comparison](04-indexed-comparison.png)
5. [Physics collaboration workspace](05-physics-collaboration.png)
6. [Mobile Overview](06-mobile-overview.png)
7. [Mobile indexed chart and exact annual values](07-mobile-trends.png)
8. [Charcoal Overview](08-charcoal-overview.png)

Evidence is representative, not a full interaction matrix. Browser logs include
two older missing-chunk errors from rebuilding the local preview while an earlier
bundle was open; the reloaded final build's Overview, Trends and People routes
rendered successfully. This does not establish production cache behavior.

## Limits

No full-corpus completeness, manually validated relevance precision/recall, current
appointment verification, measured citation velocity, million-point production
performance, external user testing or full accessibility conformance is claimed.
Method queries can miss papers or include ambiguous terminology; provider records
may contain errors and preprint/publication duplication. The macOS numerical
warnings during projection are not treated as proof of a diagnosed upstream cause;
final finite-value and relationship checks pass. The local system Python also emits
a LibreSSL/urllib3 compatibility warning; CI uses Python 3.12.

Temporary browser viewport overrides are reset after QA. The existing local preview
remains available. The production site and scheduled refresh remain on main until
an explicit promotion decision.
