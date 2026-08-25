import { useEffect, useState } from 'react'
import type { AtlasData } from './types'

// The static host can retain data JSON longer than a newly deployed hashed UI
// bundle. One version per page load keeps the UI and its data snapshot aligned.
const dataSnapshotVersion = Date.now().toString(36)
const indexUrl = `${import.meta.env.BASE_URL}data/atlas-index.json?v=${dataSnapshotVersion}`
const fallbackDataUrl = `${import.meta.env.BASE_URL}data/atlas.json?v=${dataSnapshotVersion}`

interface AtlasDataState {
  data: AtlasData | null
  loading: boolean
  error: string | null
}

export function useAtlasData(): AtlasDataState {
  const [state, setState] = useState<AtlasDataState>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Data artifacts are regenerated independently of the hashed app
        // bundle, so never let a browser combine a new UI with a stale index.
        let response = await fetch(indexUrl, { cache: 'no-store' })
        let loadedFrom = indexUrl
        if (!response.ok) {
          response = await fetch(fallbackDataUrl, { cache: 'no-store' })
          loadedFrom = fallbackDataUrl
        }
        if (!response.ok) {
          throw new Error(`Could not load ${loadedFrom}: ${response.status}`)
        }
        const data = (await response.json()) as AtlasData
        if (!cancelled) {
          setState({ data, loading: false, error: null })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown data loading error',
          })
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
