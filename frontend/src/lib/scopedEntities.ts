import type { EvidenceEntity, ResearchPoint } from '../data/research'

/** Recompute from scoped paper evidence; never reuse whole-snapshot impact in a filtered view. */
export function scopeEntities(rows: EvidenceEntity[], papers: ResearchPoint[], kind: string) {
  const lookup = new Map(papers.map((p) => [p.id, p]))
  return rows
    .flatMap((row) => {
      const works = row.works.filter((id) => lookup.has(id))
      if (!works.length) return []
      const evidence = works.map((id) => lookup.get(id)!)
      const available = kind !== 'authors' || evidence.every((p) => p.creditDivisor && p.creditDivisor > 0)
      return [
        {
          ...row,
          works,
          citations: available
            ? evidence.reduce((sum, p) => sum + p.citations / (kind === 'authors' ? p.creditDivisor! : 1), 0)
            : null,
        },
      ]
    })
    .sort((a, b) => b.works.length - a.works.length || a.id.localeCompare(b.id))
}
