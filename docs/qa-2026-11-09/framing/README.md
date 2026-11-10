# AI framing and selected-scope trends — November 9, 2026

Feature branch only. Ready within the reviewed scope, with the responsive verification
limit below. No production promotion or change to the weekly production workflow.

## Source and calculation checks

- Snapshot `5b9852ac6e1c43c2` contains 100 topic annual profiles and 26 nonempty
  field/research-focus unions, observed November 10 UTC (November 9 locally).
  Every other evidence-file checksum is identical to `680a6307e8ea7f9a`: the
  16,063 paper records, authorships, institutions, memberships and map coordinates
  were preserved. Both snapshots remain available.
- Source unions use nested POST query objects, following the official
  [OpenAlex API contract](https://help.openalex.org/api/oql/). Each topic branch
  retains its title/abstract query and any native topic-assignment constraint;
  application branches also require the declared method predicate. Common method
  conditions are factored distributively rather than repeated for every topic.
- Every response's annual groups reconcile to its source total, with exactly ten
  output years; missing or truncated results fail instead of becoming zero.
  Union counts must lie between the largest constituent and their sum in every
  year. All 100 profiles and 26 unions validated before atomic batch replacement.
- Independently recomputed 2023–2025 totals: all-covered union 618,038 versus
  804,359 summed topics; Physics union 13,046 versus 14,651 summed topics. The UI
  displays the union. AI methods union is 568,463 and applications union 71,487;
  they overlap, so those two counts must not be added.
- Independently counted map memberships: 9,710 Advancing AI papers and 6,519
  AI in science papers, with overlap. These collected counts are not the source
  annual-query populations. Coverage remains partial.
- Regression coverage includes nested query logic, conditional native-topic
  constraints, incomplete/truncated responses, complete-batch budget gating,
  source-union accounting, atomic failure preservation, unchanged evidence during
  context attachment, idempotent attachment, exact selected-scope resolution,
  incompatible lens/topic normalization and shared navigation.

## Observed browser checks

Current production-format local build in in-app Chromium, measured 1600×900 CSS.

- Overview's two-part introduction, shared research-focus tabs and map explanation
  render above the landscape without a separate marketing hero. All research
  restores 16,063 papers; Advancing AI shows 9,710 and AI in science shows 6,519.
  The map, evidence panel and footer fit the current desktop viewport, with no
  document horizontal overflow. Both light and charcoal versions were observed.
- Four compact starting-point collections render with five topics each, including
  Chemistry & materials. Keyboard focus on Materials discovery is visibly outlined.
  Browse all covered topics restores the full map and scrolls back to it.
- Default Trends displays the all-covered annual series (618,038 matches in
  2023–2025, +181.5% versus 2020–2022), without a comparison selector or indexed tab.
  Physics / All topics displays 13,046 and +134.7%; Particle Physics switches to
  its own 4,800 and +136.8%, without a representative-topic fallback.
- Add comparison reveals its selector. Comparing Particle Physics with the covered
  Chemistry total (280, +161.7%) renders two series and enables indexed growth
  with the common 2017 baseline. Removing comparison returns to one count series.
- The downloaded selected-series CSV contains only Particle Physics, all ten exact
  annual counts, its observation timestamp and the selected snapshot. Its
  2023–2025 values 1,037 + 1,297 + 2,466 reconcile to 4,800. The test download was
  moved from Downloads to [selected-trend.csv](selected-trend.csv).
- Navigation to People & collaboration preserves AI in science / Physics /
  Particle Physics, with the same snapshot. Research focus is visible and editable.
  The scoped directory contains 3,020 researchers and renders its graph and
  supporting evidence. Snapshot switching from the earlier release retains
  historical context until View latest release is explicitly chosen.

Screenshots: [Overview](01-overview.png), [Physics field total](02-physics-total.png),
[optional comparison](03-optional-comparison.png), [starting points](04-starting-points.png).

## Verification limits

The browser viewport override returned successfully but did not change the measured
1600×900 viewport, including in a second task-owned tab. Consequently this pass
does **not** claim a new mobile/laptop rendered check. Existing responsive behavior
was retained, and narrow-layout CSS was updated, but needs direct device verification.
The temporary override was reset. This was not a full accessibility audit or external
user test. Provider metadata, lexical relevance, completeness and deployment/adoption
limits from the metric contracts still apply. A method mention is not proof of a
central contribution, real-world deployment, scientific quality or clinical benefit.

Local Python emits its existing urllib3/LibreSSL compatibility warning; CI uses
Python 3.12. Backend and frontend test/build results are recorded in the feature
verification run, not inferred from screenshots.
