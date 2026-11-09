import type { AtlasData } from '../data/types'
import type { ResearchScope } from '../lib/researchScope'
import { normalizeScope } from '../lib/researchScope'
import { SelectField } from './ui'

export function ResearchScopeControls({
  atlas,
  scope,
  onChange,
  topicLabels,
}: {
  atlas: AtlasData
  scope: ResearchScope
  onChange: (scope: ResearchScope) => void
  topicLabels?: { slug: string; label: string }[]
}) {
  return (
    <div className="research-scope-controls">
      <SelectField
        label="Field"
        value={scope.field}
        onValueChange={(field) => onChange(normalizeScope(atlas.topics, field, 'all'))}
        options={[
          { value: 'all', label: 'All covered fields' },
          ...[...new Set(atlas.topics.map((t) => t.field))]
            .sort()
            .map((field) => ({ value: field, label: field })),
        ]}
      />
      <SelectField
        label="Topic"
        value={scope.topic}
        onValueChange={(topic) => onChange(normalizeScope(atlas.topics, scope.field, topic))}
        options={[
          { value: 'all', label: 'All topics' },
          ...atlas.topics
            .filter((t) => scope.field === 'all' || t.field === scope.field)
            .map((t) => ({
              value: t.slug,
              label: topicLabels?.find((row) => row.slug === t.slug)?.label || t.label,
            })),
        ]}
      />
    </div>
  )
}
