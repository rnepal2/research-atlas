import { useEffect, useState } from 'react'

export interface ResearchPoint {
  id: string
  title: string
  year: number
  citations: number
  type: string
  cluster: number
  x: number
  y: number
  topics: string[]
  shard: string
  oa: boolean
  retracted: boolean
}
export interface ResearchPaper extends ResearchPoint {
  observedAt?: string
  matchedQueries?: string[]
  abstract: string
  source: string
  url: string
  inclusion: string
  references: string[]
  referencesAvailable: boolean
  authors: { id: string; name: string; institutions: { id: string; display_name: string }[] }[]
}
export interface ResearchLandscape {
  schemaVersion: number
  method: string
  points: ResearchPoint[]
  clusters: { id: number; label: string; count: number; x: number; y: number }[]
  topics: { slug: string; label: string; count: number; role?: 'methods' | 'applications'; domain?: string }[]
}
export interface ResearchManifest {
  snapshot: string
  processedAt: string
  uniqueWorks: number
  base: string
  coverage: string
  files: Record<string, { sha256: string; bytes: number }>
}

const base = `${import.meta.env.BASE_URL}research/`
export async function researchFile<T>(
  manifest: ResearchManifest,
  file: string,
  signal?: AbortSignal,
): Promise<T> {
  const expected = manifest.files[file]
  if (!expected) throw new Error('This evidence file is absent from the snapshot.')
  const response = await fetch(`${base}${manifest.base}${file}`, { signal })
  if (!response.ok) throw new Error('Could not load research evidence. Please retry.')
  const buffer = await response.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  const actual = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  if (actual !== expected.sha256)
    throw new Error('Snapshot integrity check failed. Reload to fetch a consistent release.')
  return JSON.parse(new TextDecoder().decode(buffer)) as T
}

export function useResearch() {
  const [state, setState] = useState<{
    manifest?: ResearchManifest
    landscape?: ResearchLandscape
    error?: string
  }>({})
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch(`${base}research-manifest.json`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok)
          throw new Error(
            'The research landscape has not been built. Run the corpus build described in the project README.',
          )
        const manifest = (await response.json()) as ResearchManifest
        let chosen = manifest
        const requested = new URLSearchParams(window.location.search).get('snapshot')
        if (requested && /^[a-f0-9]{16}$/.test(requested) && requested !== manifest.snapshot) {
          const historical = await fetch(`${base}snapshots/${requested}/manifest.json`, {
            signal: controller.signal,
          })
          if (historical.ok) chosen = (await historical.json()) as ResearchManifest
        }
        const landscape = await researchFile<ResearchLandscape>(chosen, 'landscape.json', controller.signal)
        setState({ manifest: chosen, landscape })
      } catch (error) {
        if (!controller.signal.aborted)
          setState({ error: error instanceof Error ? error.message : 'Research data could not be loaded.' })
      }
    }
    void load()
    return () => controller.abort()
  }, [])
  return state
}
