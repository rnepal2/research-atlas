import type { AtlasData, TopicProfile } from '../data/types'
import { SelectField } from './ui'

interface TopicSelectorProps {
  atlas: AtlasData
  selected: TopicProfile
  onChange: (topic: TopicProfile) => void
}

export function TopicSelector({ atlas, selected, onChange }: TopicSelectorProps) {
  const domains = [...new Set(atlas.topics.map((topic) => topic.domain))].sort()
  const fields = [...new Set(atlas.topics.filter((topic) => topic.domain === selected.domain).map((topic) => topic.field))].sort()
  const topics = atlas.topics
    .filter((topic) => topic.domain === selected.domain && topic.field === selected.field)
    .sort((left, right) => left.label.localeCompare(right.label))

  function selectFirst(match: (topic: TopicProfile) => boolean) {
    const next = atlas.topics.find(match)
    if (next) {
      onChange(next)
    }
  }

  return (
    <div className="selector-grid">
      <SelectField
        label="OpenAlex domain"
        value={selected.domain}
        onValueChange={(value) => selectFirst((topic) => topic.domain === value)}
        options={domains.map((domain) => ({ value: domain, label: domain }))}
      />
      <SelectField
        label="Field"
        value={selected.field}
        onValueChange={(value) => selectFirst((topic) => topic.domain === selected.domain && topic.field === value)}
        options={fields.map((field) => ({ value: field, label: field }))}
      />
      <SelectField
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
