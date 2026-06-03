import { useEffect, useState } from 'react'
import type { AtlasData } from './types'

const dataUrl = `${import.meta.env.BASE_URL}data/atlas.json`

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
        const response = await fetch(dataUrl)
        if (!response.ok) {
          throw new Error(`Could not load ${dataUrl}: ${response.status}`)
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

