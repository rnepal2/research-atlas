# Metric contracts — schema 2

- Institution works: distinct eligible works carrying the institution ID on an authorship. Full counting; a multi-institution work can count for several institutions.
- Institution authors: distinct credible author IDs whose own authorship includes that institution. External coauthors are excluded.
- Institution totals/concentration: all eligible institution records, before presentation limits. Lists are not population denominators.
- Author cited-work impact: lifetime citations to sampled works, divided among credible coauthors. This is not the author's lifetime citation total.
- Citation-age adjustment: citations divided by publication age is not measured citation velocity. Velocity requires repeat observations.
- Author recent period: current calendar year and two preceding years, including YTD. Topic momentum: three completed years versus three preceding completed years.
- Betweenness: inverse collaboration strength as distance; seeded source-path sampling on the full graph when >180 nodes. Experimental sample-relative bridge signal.
- Group colors: topic assignment for authors and country for institutions until structural communities are explicitly supplied.
- Publication totals: API query-matched aggregate population. Entity statistics: locally eligible sampled works. These populations must not be combined to imply corpus completeness.
- First observed author: new to our sampled comparison period, not new to the field.

The focused paper-corpus directory uses all credited authorships as the fractional
denominator (deduplicating resolved IDs). Organizational and placeholder names are
not listed as people; their credit is not redistributed. Legacy topic-profile
scores retain their explicitly resolved-individual denominator. These are different
populations and are not combined in comparisons.

Curated annual search aggregates use AND between tokens within each query and OR
between queries, scoped to source title and abstract search. Topic-assignment
aggregates remain explicitly labeled as the broader parent-topic context. The exact
request and observation date accompany each schema-2 profile. API stemming can
differ from literal local eligibility; aggregate counts are never used as an eligible
paper-corpus completeness denominator.

Deferred collection is a separate workflow outcome. It never processes or republishes a checked-in snapshot. Production publication requires the main branch and a fresh validated collection.

## Focused edition investigation views

- Field → Topic is the configured collection hierarchy, not each work's native
  primary-field assignment. Field counts are a distinct-work union of its topic
  collections; overlapping topic or field totals must not be added.
- Method filters match declared title/abstract terminology. They do not establish
  how centrally a paper uses a method, its quality, or population adoption rates.
- `trends.json` contains query-matched annual source aggregates for the exact
  edition query definitions and allowed work types. API stemming and provider
  search semantics can differ from local literal relevance checks. Its totals are
  not a completeness denominator for the collected landscape.
- Completed-period change compares three completed calendar years against their
  preceding three. YTD is dashed and excluded. Missing periods or a zero prior
  baseline produce unavailable change. Indexed comparisons use the first common
  positive annual baseline in the selected range; that baseline is labeled.
- Scoped author impact sums each included paper's citations divided by its full
  credited-authorship denominator. Scoped institution impact full-counts the same
  selected evidence. A historical missing denominator yields unavailable author
  impact, not zero or the unfiltered total.
- Data Refresh is the selected snapshot build date. Per-record and per-query
  observation timestamps remain separate; this label is not a claim that every
  provider record was retrieved on that date.
- Annual batches replace accepted raw context only after every profile validates.
  Same-day reuse requires exact unchanged query fingerprints. Builds reject
  incompatible edition/query/year context instead of mixing scopes or inventing
  annual counts from sampled papers. Older immutable snapshots retain their own
  definitions rather than being reinterpreted using today's query plan.
