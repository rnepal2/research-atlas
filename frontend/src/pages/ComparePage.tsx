import { useEffect, useState } from 'react'
import type { AtlasData, TopicProfile } from '../data/types'
import { useTopicDetail } from '../data/useTopicDetail'
import { PageHeader } from '../components/PageHeader'
import { TrendChart } from '../components/TrendChart'
import { Button, SelectField } from '../components/ui'
import { exportPapers, downloadText } from '../lib/exportResearch'
import { useResearch } from '../data/research'

function Comparison({
  atlas,
  slug,
  topic,
  maxValue,
}: {
  atlas: AtlasData
  slug: string
  topic: TopicProfile | null
  maxValue: number
}) {
  const summary = atlas.topics.find((t) => t.slug === slug)
  if (!summary) return null
  const year = new Date(atlas.generatedAt).getFullYear()
  return (
    <article className="compare-topic">
      <span className="eyebrow">{summary.workArea}</span>
      <h2>{summary.label}</h2>
      <p>{summary.description}</p>
      <div className="comparison-stats">
        <div>
          <strong>{summary.metrics.worksLast3Years.toLocaleString()}</strong>
          <span>
            Query-matched works · {year - 3}–{year - 1}
          </span>
        </div>
        <div>
          <strong>{Math.round(summary.metrics.growthRate * 100).toLocaleString()}%</strong>
          <span>
            Change vs {year - 6}–{year - 4}
          </span>
        </div>
        <div>
          <strong>{summary.quality.worksCollected.toLocaleString()}</strong>
          <span>Eligible sampled works · entity evidence</span>
        </div>
      </div>
      {topic ? (
        <TrendChart rows={topic.yearlyMetrics} maxValue={maxValue} />
      ) : (
        <p role="status">Loading annual trend…</p>
      )}
      <h3>Interpretation</h3>
      <p>
        The publication series counts API query matches. Its eligibility can differ from the smaller sample
        used for researchers and institutions. Large percentage changes from small baselines need particular
        care.
      </p>
      <p className="source-note">
        Source: {summary.quality.yearlyCountSource} · OpenAlex · Snapshot {atlas.generatedAt.slice(0, 10)}
      </p>
    </article>
  )
}

export function ComparePage({ atlas }: { atlas: AtlasData }) {
  const [left, setLeft] = useState(
    () => new URLSearchParams(window.location.search).get('left') || 'ai-agents',
  )
  const [right, setRight] = useState(
    () => new URLSearchParams(window.location.search).get('right') || 'retrieval-augmented-generation',
  )
  const first = useTopicDetail(
    left,
    atlas.topics.find((t) => t.slug === left),
  )
  const second = useTopicDetail(
    right,
    atlas.topics.find((t) => t.slug === right),
  )
  const maxValue = Math.max(
    1,
    ...[...(first.topic?.yearlyMetrics || []), ...(second.topic?.yearlyMetrics || [])].map(
      (row) => row.works,
    ),
  )
  useEffect(() => {
    window.history.replaceState({}, '', `${window.location.pathname}?${new URLSearchParams({ left, right })}`)
  }, [left, right])
  const { landscape, manifest } = useResearch()
  const options = atlas.topics.map((t) => ({ value: t.slug, label: t.label }))
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="RESEARCH ATLAS / COMPARE"
        title="Put change in context."
        description="Compare research areas over the same completed years. Publication totals and sampled entity evidence are shown separately."
      />
      <div className="compare-filters">
        <SelectField label="First research area" value={left} onValueChange={setLeft} options={options} />
        <SelectField label="Second research area" value={right} onValueChange={setRight} options={options} />
      </div>
      <div className="compare-grid">
        <Comparison atlas={atlas} slug={left} topic={first.topic} maxValue={maxValue} />
        <Comparison atlas={atlas} slug={right} topic={second.topic} maxValue={maxValue} />
      </div>
      <div className="method-strip">
        <p>
          {landscape
            ? `${landscape.points.filter((p) => p.topics.includes(left) && p.topics.includes(right)).length} unique papers in the focused landscape match both selected areas. Topic totals must not be summed without deduplication.`
            : 'Overlapping topics can contain the same paper. Totals are not additive.'}
        </p>
        <Button
          variant="outline"
          onClick={() =>
            downloadText(
              'research-comparison.json',
              JSON.stringify(
                {
                  snapshot: atlas.generatedAt,
                  topics: atlas.topics
                    .filter((t) => [left, right].includes(t.slug))
                    .map((t) => ({ slug: t.slug, metrics: t.metrics, quality: t.quality })),
                },
                null,
                2,
              ),
              'application/json',
            )
          }
        >
          Export evidence
        </Button>
        {landscape && manifest && (
          <Button
            variant="ghost"
            onClick={() =>
              exportPapers(
                landscape.points.filter((p) => p.topics.includes(left) && p.topics.includes(right)),
                manifest.snapshot,
                'csv',
              )
            }
          >
            Export shared papers
          </Button>
        )}
      </div>
    </div>
  )
}
