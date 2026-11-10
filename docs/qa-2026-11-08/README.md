# Development verification — November 8, 2026

Branch: `feature/research-atlas-v2-plan`. This is a development preview, not a
production promotion or a claim that every V2 release gate has passed.

## Source and artifact checks

- Rehydrated 37,234 legacy IDs against current OpenAlex records; 1,985 unresolved
  or merged IDs were omitted from the reconciled raw files. Raw records and the
  credential remain ignored, not committed.
- A bounded additional 100-page acquisition covered the current-year query
  boundaries across all 100 configured areas. Daily project reservations are
  separate from unrelated use of the same API key.
- Accepted paper snapshot: `45617efbce24ba11`, 7,743 unique work IDs. SHA-256,
  finite coordinates, detail/point equality, theme/topic counts and coverage
  relationships passed validation. Source observations and inclusion rules are
  carried in the paper details.
- Coverage is partial: 100 of 1,000 topic/year boundaries started, zero exhausted;
  7,587 papers have abstracts. Captured references may legitimately be empty.
- All 100 annual context profiles were fetched as a staged batch and rebuilt.
  Curated queries use AND within term sets, OR across sets, scoped to title and
  abstract. The earlier exact-long-phrase query produced only 727 NLP matches
  across 2023–2025; the declared title/abstract query returns 24,588. Neither is
  claimed to be a census of NLP. A separate full-text test query was not accepted
  for the final release.
- Missing aggregate payloads cannot silently become ten years of zero counts.
  Invalid cursor responses cannot mark a partition exhausted. Failed context
  batches preserve every accepted annual source file.
- The people directory excludes organizational/placeholder names such as
  `Assignee Research`. Individual fractional impact uses all credited authorships
  in its denominator, retaining unknown/group credit rather than reallocating it.
- Twenty source/attribution/acquisition/release regression tests pass. The complete
  100-profile static validator passes; frontend lint, type checking and build pass.

## Browser checks

In-app Chromium: desktop Explore at 1280×720; People at 1236×972; mobile Overview
and Explore at 390×844. Mobile document scroll width was 375px, within the 390px
viewport; no horizontal document overflow was observed. Temporary viewport
overrides were reset.

Observed transitions: scientific-applications filter; Healthcare selection;
matching theme counts; paginated paper list; source-backed paper evidence;
save paper → isolated reading list; camera zoom → paper labels; fit map;
rectangular region selection (2,831 records in the tested region); mobile menu
open → Explore navigation; people-directory load with individual researcher
first; pagination footer visible within its workspace. These are representative
task checks, not a full screen-reader or usability study.

Screenshots document the Folio milestone. Synthetic 50k/100k fixtures rendered in
the earlier performance check with approximately 8.4/8.3ms p95 frame cadence on
this desktop browser. That is not a rigorous interaction/GPU benchmark, a mobile
performance result or evidence of million-point readiness.

## Important limits

- No human-labeled precision/recall set, independent field census, external user
  session, full keyboard audit, 200% zoom audit or systematic WCAG contrast audit
  has been completed.
- macOS NumPy 2.0.2 / Accelerate emitted matmul floating-point warnings during
  offline projection. Text/latent/coordinate finite checks and the final artifact
  validator passed. Similar platform warnings are documented in the primary
  [NumPy issue](https://github.com/numpy/numpy/issues/28687); that is a plausible
  platform explanation, not proof that this specific warning has the same cause.
  Warnings have not been suppressed.
- Eligibility is lexical and topic-dependent; an AI mention does not establish
  that AI is a paper's central contribution. Query exhaustion and semantic recall
  are separate questions. Coverage must remain labeled partial.
- Publication-query behavior follows the official
  [OpenAlex search documentation](https://help.openalex.org/api/searching/).
  Source metadata can be wrong. Affiliation evidence is publication-specific and
  is not presented as a verified current appointment.
- Main and production remain isolated; the weekly production refresh schedule
  has not been changed by this feature preview.
