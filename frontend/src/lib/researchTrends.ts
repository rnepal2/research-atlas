export interface AnnualCount {
  year: number
  works: number
}
export interface ResearchTrend {
  slug: string
  label: string
  field: string
  role: string
  observedAt: string
  query: Record<string, unknown>
  years: AnnualCount[]
}
export interface ResearchTrends {
  schemaVersion: number
  throughYear: number
  generatedAt: string
  definition: string
  topics: ResearchTrend[]
  scopes?: {
    id: string
    field: string
    track: string
    topicSlugs: string[]
    observedAt: string
    query: Record<string, unknown>
    years: AnnualCount[]
  }[]
}

/** The selected population is authoritative; no representative-topic fallback. */
export function selectedTrend(
  context: ResearchTrends,
  scope: { field: string; topic: string; track?: string },
): ResearchTrend | undefined {
  if (scope.topic !== 'all') return context.topics.find((row) => row.slug === scope.topic)
  const union = context.scopes?.find(
    (row) => row.field === scope.field && row.track === (scope.track || 'all'),
  )
  if (!union) return undefined
  const roles = new Set(
    context.topics.filter((row) => union.topicSlugs.includes(row.slug)).map((row) => row.role),
  )
  const label =
    scope.field === 'all'
      ? scope.track === 'methods'
        ? 'Advancing AI'
        : scope.track === 'applications'
          ? 'AI in science'
          : 'AI research and scientific applications'
      : roles.size === 1 && roles.has('applications')
        ? `AI-related research in ${scope.field}`
        : `${scope.field}: AI & computing research`
  return { ...union, slug: union.id, label, role: roles.size === 1 ? [...roles][0] : 'all' }
}

export function completedPeriod(rows: AnnualCount[], throughYear: number) {
  const years = new Map(rows.map((r) => [r.year, r.works]))
  const required = Array.from({ length: 6 }, (_, i) => throughYear - 6 + i)
  if (required.some((y) => !years.has(y))) return { recent: null, previous: null, growth: null }
  const previous = required.slice(0, 3).reduce((sum, y) => sum + years.get(y)!, 0)
  const recent = required.slice(3).reduce((sum, y) => sum + years.get(y)!, 0)
  return { recent, previous, growth: previous > 0 ? (recent - previous) / previous : null }
}

/** A shared nonzero baseline is required for an honest indexed comparison. */
export function indexedSeries(series: { label: string; rows: AnnualCount[] }[]) {
  const baseline = series[0]?.rows.find((row) =>
    series.every((s) => s.rows.some((r) => r.year === row.year && r.works > 0)),
  )?.year
  if (baseline === undefined) return null
  return {
    baseline,
    series: series.map((s) => {
      const divisor = s.rows.find((r) => r.year === baseline)!.works
      return {
        ...s,
        rows: s.rows
          .filter((r) => r.year >= baseline)
          .map((r) => ({ ...r, works: (r.works / divisor) * 100 })),
      }
    }),
  }
}
