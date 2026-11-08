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
