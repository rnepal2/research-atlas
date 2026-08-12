import type { AtlasData, TopicSummary } from '../data/types'
import { getDefaultTopic } from '../data/topicSelection'
import { SelectField } from './ui'

interface TopicSelectorProps {
  atlas: AtlasData
  selected: TopicSummary
  onChange: (topic: TopicSummary) => void
}

export function TopicSelector({ atlas, selected, onChange }: TopicSelectorProps) {
  const domains = [...new Set(atlas.topics.map((topic) => topic.domain))].sort()
  const fields = [...new Set(atlas.topics.filter((topic) => topic.domain === selected.domain).map((topic) => topic.field))].sort()
  const topics = atlas.topics
    .filter((topic) => topic.domain === selected.domain && topic.field === selected.field)
    .sort((left, right) => left.label.localeCompare(right.label))

  function selectFirst(match: (topic: TopicSummary) => boolean) {
    const next = atlas.topics.find(match)
    if (next) {
      onChange(next)
    }
  }

  return (
    <div className="grid grid-cols-[minmax(180px,0.85fr)_minmax(220px,1fr)_minmax(280px,1.25fr)] gap-3.5 max-[1160px]:grid-cols-2 max-[520px]:grid-cols-1">
      <SelectField
        label="Domain"
        value={selected.domain}
        onValueChange={(value) => {
          const next = getDefaultTopic(atlas, { domain: value })
          if (next) onChange(next)
        }}
        options={domains.map((domain) => ({ value: domain, label: domain }))}
      />
      <SelectField
        label="Field"
        value={selected.field}
        onValueChange={(value) => {
          const next = getDefaultTopic(atlas, { domain: selected.domain, field: value })
          if (next) onChange(next)
        }}
        options={fields.map((field) => ({ value: field, label: field }))}
      />
      <SelectField
        className="max-[1160px]:col-span-2 max-[520px]:col-span-1"
        label="Topic profile"
        value={selected.slug}
        onValueChange={(value) => selectFirst((topic) => topic.slug === value)}
        options={topics.map((topic) => ({
          value: topic.slug,
          label: topic.label,
          meta: topic.subfield,
        }))}
      />
    </div>
  )
}
