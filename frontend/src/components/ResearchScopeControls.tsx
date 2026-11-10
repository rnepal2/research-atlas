import type { AtlasData } from '../data/types'
import type { ResearchScope } from '../lib/researchScope'
import { normalizeScope, researchRole } from '../lib/researchScope'
import { SelectField } from './ui'

export function ResearchScopeControls({
  atlas,
  scope,
  onChange,
  topicLabels,
  includeLens = false,
}: {
  atlas: AtlasData
  scope: ResearchScope
  onChange: (scope: ResearchScope) => void
  topicLabels?: { slug: string; label: string }[]
  includeLens?: boolean
}) {
  return (
    <div className={`research-scope-controls${includeLens ? ' with-lens' : ''}`}>
      {includeLens && (
        <SelectField
          label="Research focus"
          value={scope.track || 'all'}
          onValueChange={(value) =>
            onChange(normalizeScope(atlas.topics, scope.field, scope.topic, value))
          }
          options={[
            { value: 'all', label: 'All covered research' },
            { value: 'methods', label: 'Advancing AI' },
            { value: 'applications', label: 'AI in science' },
          ]}
        />
      )}
      <SelectField
        label="Field"
        value={scope.field}
        onValueChange={(field) => onChange(normalizeScope(atlas.topics, field, 'all', scope.track))}
        options={[
          { value: 'all', label: 'All covered fields' },
          ...[
            ...new Set(
              atlas.topics
                .filter((t) => !scope.track || researchRole(t) === scope.track)
                .map((t) => t.field),
            ),
          ]
            .sort()
            .map((field) => ({ value: field, label: field })),
        ]}
      />
      <SelectField
        label="Topic"
        value={scope.topic}
        onValueChange={(topic) =>
          onChange(normalizeScope(atlas.topics, scope.field, topic, scope.track))
        }
        options={[
          { value: 'all', label: 'All topics' },
          ...atlas.topics
            .filter(
              (t) =>
                (scope.field === 'all' || t.field === scope.field) &&
                (!scope.track || researchRole(t) === scope.track),
            )
            .map((t) => ({
              value: t.slug,
              label: topicLabels?.find((row) => row.slug === t.slug)?.label || t.label,
            })),
        ]}
      />
    </div>
  )
}
