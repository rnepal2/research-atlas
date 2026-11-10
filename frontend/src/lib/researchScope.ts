import type { TopicSummary } from '../data/types'

export interface ResearchScope {
  field: string
  topic: string
  track?: 'methods' | 'applications'
}
type Topic = Pick<TopicSummary, 'slug' | 'field' | 'label'> & { workArea?: string; role?: string }

export function researchRole(topic: Topic) {
  return (
    topic.role ||
    (topic.field === 'Computer Science' || topic.workArea === 'AI Methods'
      ? 'methods'
      : 'applications')
  )
}

/** Atlas topics are curated collections; field names retain their source meaning. */
export function normalizeScope(
  topics: Topic[],
  field = 'all',
  topic = 'all',
  track = 'all',
): ResearchScope {
  const lens: Pick<ResearchScope, 'track'> =
    track === 'methods' || track === 'applications' ? { track } : {}
  const available = topics.filter((row) => !lens.track || researchRole(row) === lens.track)
  const match = available.find((row) => row.slug === topic)
  const validField = field === 'all' || available.some((row) => row.field === field) ? field : 'all'
  return match
    ? { field: match.field, topic: match.slug, ...lens }
    : { field: validField, topic: 'all', ...lens }
}

export function readScope(topics: Topic[], search = location.search) {
  const params = new URLSearchParams(search)
  return normalizeScope(
    topics,
    params.get('field') || 'all',
    params.get('topic') || 'all',
    params.get('track') || 'all',
  )
}

export function topicSlugs(topics: Topic[], scope: ResearchScope) {
  return new Set(
    topics
      .filter(
        (t) =>
          (scope.field === 'all' || t.field === scope.field) &&
          (!scope.track || researchRole(t) === scope.track) &&
          (scope.topic === 'all' || t.slug === scope.topic),
      )
      .map((t) => t.slug),
  )
}

export function inScope(point: { topics: string[] }, slugs: Set<string>) {
  return point.topics.some((slug) => slugs.has(slug))
}

export function scopePath(path: string, scope: ResearchScope, extras: Record<string, string> = {}) {
  const params = new URLSearchParams({
    field: scope.field,
    topic: scope.topic,
    ...(scope.track ? { track: scope.track } : {}),
    ...extras,
  })
  return `${path}?${params}`
}

/** Carry only shared scope, never page-specific camera, selection or search state. */
export function carryScope(path: string, search: string) {
  if (!['/', '/trending', '/connections'].includes(path)) return path
  const source = new URLSearchParams(search),
    params = new URLSearchParams()
  for (const key of ['field', 'topic', 'track', 'snapshot'])
    if (source.has(key)) params.set(key, source.get(key)!)
  return params.size ? `${path}?${params}` : path
}

export function sharedScopeSearch(search: string) {
  return carryScope('/', search).replace(/^\/\??/, '')
}

export const featuredCollections = [
  {
    title: 'AI & computing',
    description: 'The methods and systems advancing the field.',
    slugs: [
      'large-language-models',
      'ai-agents',
      'graph-neural-networks',
      'reinforcement-learning',
      'computer-vision',
    ],
  },
  {
    title: 'Physics',
    description: 'AI in inference, simulation and physical discovery.',
    slugs: [
      'particle-physics',
      'cosmology',
      'gravitational-waves',
      'condensed-matter-physics',
      'fusion-plasma',
    ],
  },
  {
    title: 'Health & life sciences',
    description: 'Computational methods in biological and clinical research.',
    slugs: [
      'medical-ai',
      'protein-design',
      'precision-oncology',
      'single-cell-rna-sequencing',
      'spatial-transcriptomics',
    ],
  },
  {
    title: 'Chemistry & materials',
    description: 'AI in molecular, materials and energy research.',
    slugs: [
      'catalysis',
      'materials-informatics',
      'battery-materials',
      'solid-state-batteries',
      'two-dimensional-materials',
    ],
  },
]
