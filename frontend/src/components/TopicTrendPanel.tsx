import { useState } from 'react'
import { Dialog } from 'radix-ui'
import { ChartNoAxesCombined, X } from 'lucide-react'
import type { AtlasData } from '../data/types'
import { useTopicDetail } from '../data/useTopicDetail'
import { TrendChart } from './TrendChart'
import { Button, SelectField } from './ui'
import { navigate } from '../lib/router'

export function TopicTrendPanel({ atlas, defaultTopic }: { atlas: AtlasData; defaultTopic: string }) {
  const [open, setOpen] = useState(false)
  const [slug, setSlug] = useState(defaultTopic === 'all' ? 'large-language-models' : defaultTopic)
  const summary = atlas.topics.find((t) => t.slug === slug) || atlas.topics[0]
  const { topic, loading, error } = useTopicDetail(
    open ? summary.slug : undefined,
    open ? summary : undefined,
  )
  const year = new Date(atlas.generatedAt).getFullYear()
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline">
          <ChartNoAxesCombined size={15} />
          Topic trend
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="context-overlay" />
        <Dialog.Content className="trend-dialog">
          <header>
            <div>
              <span className="eyebrow">PUBLICATION CONTEXT</span>
              <Dialog.Title>How is this area developing?</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <Button size="icon-sm" variant="ghost" aria-label="Close publication trend">
                <X size={18} />
              </Button>
            </Dialog.Close>
          </header>
          <Dialog.Description>
            Annual query-matched counts provide broader topic context—not the size of the AI-filtered paper
            sample or a measure of research quality.
          </Dialog.Description>
          <SelectField
            label="Research area"
            value={summary.slug}
            onValueChange={setSlug}
            options={atlas.topics.map((t) => ({ value: t.slug, label: t.label }))}
          />
          <div className="trend-context-stats">
            <div>
              <strong>{summary.metrics.worksLast3Years.toLocaleString()}</strong>
              <span>
                query matches · {year - 3}–{year - 1}
              </span>
            </div>
            <div>
              <strong>{Math.round(summary.metrics.growthRate * 100).toLocaleString()}%</strong>
              <span>
                change vs {year - 6}–{year - 4}
              </span>
            </div>
          </div>
          {loading && !topic ? (
            <p role="status">Loading annual context…</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : (
            topic && <TrendChart rows={topic.yearlyMetrics} />
          )}
          <p className="source-note">
            The current year is year to date and excluded from completed-year growth. Counts use{' '}
            {summary.quality.yearlyCountSource === 'openalex-topic'
              ? 'OpenAlex topic assignments'
              : 'a curated title-and-abstract query'}
            . Observed {summary.quality.aggregateObservedAt?.slice(0, 10) || atlas.generatedAt.slice(0, 10)}.
            Application-area totals describe the parent topic, not AI adoption.
          </p>
          <Button variant="outline" onClick={() => navigate(`/topic/${summary.slug}`)}>
            Open the topic profile
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
