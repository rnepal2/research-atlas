import type { EvidenceEntity } from '../data/research'

export interface ConnectionEvidence extends EvidenceEntity {
  sharedWorks: string[]
}

/** A bounded ego view, with exact work IDs behind every displayed connection. */
export function sharedConnections(hub: EvidenceEntity | undefined, rows: EvidenceEntity[], limit = 32) {
  if (!hub) return { neighbors: [] as ConnectionEvidence[], total: 0 }
  const works = new Set(hub.works)
  const peers: ConnectionEvidence[] = []
  for (const row of rows) {
    if (row.id === hub.id) continue
    let shared: Set<string> | undefined
    for (const identifier of row.works) if (works.has(identifier)) (shared ??= new Set()).add(identifier)
    if (shared?.size) peers.push({ ...row, sharedWorks: [...shared] })
  }
  peers.sort((a, b) => b.sharedWorks.length - a.sharedWorks.length || a.id.localeCompare(b.id))
  return { neighbors: peers.slice(0, limit), total: peers.length }
}
