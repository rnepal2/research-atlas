# First-version candidate verification — November 9, 2026

Branch: `feature/research-atlas-v2-plan`. No production promotion.

## Data checks

- Accepted snapshot `ee0e9de2d0f9442f`: 10,012 distinct OpenAlex work IDs,
  9,844 abstracts; reference fields captured for all 10,012 records, including
  legitimately empty lists. Distinct work IDs are not a claim of deduplicated studies.
- An additional bounded 100-page acquisition targeted historical LLM and agent
  boundaries. Coverage remains partial: 118/1,000 boundaries started, zero exhausted.
  The 2026 sample still dominates (7,209 records); sampled annual counts are not
  used as publication growth.
- Checksums, coordinates, points/details, topic/theme counts and coverage passed.
  Independent paper-authorship reconciliation also verifies all author/institution
  work sets, author fractional impact, institutional full-counted citations and
  authors' own publication affiliations. Excluded/unknown author credit is not
  redistributed. The previous accepted snapshot is retained for historical links.
- 22 Python regression tests, four frontend unit tests, the complete 100-profile
  static validator, frontend lint/type checking, and the GitHub Pages-base build pass.
  The unit tests cover bounded acquisition, source protection, attribution, shared
  paper intersections and static-host route recovery; they are not browser tests.

## Observed browser checks

Production-format local build, in-app Chromium. Dimensions below are the measured
CSS viewport; the browser's existing zoom means screenshot pixel dimensions differ.

- Overview at 1600×900: first-row cards reduced from 456px to 228px; the methods
  grid from 1,702px to 911px (46% shorter). Descriptions, both counts and both
  links remain. Source-assigned totals say “Topic works”; curated totals say
  “Query matches”; completed-year dates are explicit. No shortened rounded counts.
- Overview at 390×844: single-column cards, readable side-by-side counts, 44px
  minimum action height, no document horizontal overflow (390px scroll width).
- Explore at 1280×720: plot height 391px; footer bottom 688px. Light and charcoal
  palettes rendered; density is explicitly described as local paper density.
- Mobile Explore at 390×844: 420px map, paper-list navigation, selected-paper
  evidence, save/remove reading-list action and author-profile navigation worked.
  The selection scrolls source evidence into view. Document width remained 390px.
- Source example: “Language Models are Few-Shot Learners” opened W3030163527,
  then its DOI, observed-date evidence and recorded authorships loaded. Benjamin
  Mann linked to A5084254760 in the same snapshot, with one collected paper,
  fractional impact and 26 observed coauthors. These are provider records, not
  independent verification of identities or affiliations.
- Collaboration at 1280×720: 285px graph; directory pagination and source footer
  fit inside the viewport (footer bottom 688px). Light/charcoal graphs rendered.
  The connection list exposed exact shared-paper evidence. Earlier checks in this
  pass also followed Chelsea Finn's graph node and an eight-shared-paper link.
- A GitHub Pages `?p=/explore?...` redirect restored the route and filters rather
  than showing Not Found. Same-path primary navigation reset stale filters.
- Topic trend dialog displayed AI Agents' annual context (59,221 query matches
  for 2023–2025), distinguished YTD and restored focus after Escape. Its screenshot
  is in the November 8 evidence folder because that check preceded this report.

Screenshots in this folder are representative evidence, not an exhaustive test
matrix. Temporary viewport overrides are reset after verification. Test-only saved
papers are removed; the local preview remains available to the user.

## Not yet established

The [release gates](../V2_PROGRESS.md#release-gates-still-requiring-evidence) still
apply: complete backfill, human-labeled relevance validation, citation history,
million-point/multiresolution benchmarking, independent user sessions and a full
accessibility audit are not claimed. Lexical AI inclusion and provider metadata
can be wrong. The platform numerical-warning caveat from the November 8 report
also applies to this projection; final finite-value and attribution checks pass.
