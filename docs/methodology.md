# Methodology

Research Atlas ranks and summarizes research domains using compact static artifacts generated from OpenAlex data. Metrics are intended as discovery aids, not definitive assessments of quality or importance.

## Topic Trend Score

The first version combines bounded normalized components so extreme growth does not saturate every ranking:

- 35% recent work growth
- 25% citation velocity growth
- 20% active author growth
- 10% institution growth
- 10% cross-topic expansion
- baseline size penalty for very large established areas

Growth compares a recent three-year period with the prior three-year period where enough data exists.

## Rising Researcher Score

The rising researcher label means increasing visibility inside a selected topic, not "best researcher."

The first version combines:

- 30% recent topic publications
- 25% citation velocity
- 20% growth versus prior period
- 15% collaboration or bridge signal
- 10% topic focus

Guardrails:

- Require recent topic-relevant work
- Treat ambiguous low-evidence authors cautiously
- Show supporting signals alongside the score
- Avoid normative claims about researcher quality

## Institution Strength Score

The first version combines:

- 35% topic publication share
- 25% topic citation share
- 20% rising author count
- 10% collaboration centrality
- 10% subtopic breadth

## Bridge Researcher Score

Bridge researchers connect otherwise separated clusters. The first version uses graph betweenness where available, plus cross-institution collaboration and subtopic diversity.

## Limitations

- OpenAlex topic assignments are model-generated and can be noisy.
- Newer areas may require keyword supplementation before the topic taxonomy catches up.
- Citation counts favor older papers unless citation velocity is considered.
- Author and institution disambiguation depends on OpenAlex records.
- Static snapshots can become stale between refreshes.
- The MVP sample artifact is for product development; production deployments should regenerate artifacts from OpenAlex.
