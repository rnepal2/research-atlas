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
  query: Record<string, string | number>
  years: AnnualCount[]
}
export interface ResearchTrends {
  schemaVersion: number
  throughYear: number
  generatedAt: string
  definition: string
  topics: ResearchTrend[]
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
