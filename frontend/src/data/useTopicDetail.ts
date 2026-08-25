import { useEffect, useState } from 'react'
import type { TopicProfile, TopicSummary } from './types'

const cache = new Map<string, TopicProfile>()
const dataSnapshotVersion = Date.now().toString(36)

interface TopicDetailState {
  slug?: string
  topic: TopicProfile | null
  loading: boolean
  error: string | null
}

function isFullTopic(topic: TopicSummary | TopicProfile | undefined): topic is TopicProfile {
  return Boolean(topic && Array.isArray((topic as TopicProfile).yearlyMetrics))
}

export function useTopicDetail(slug: string | undefined, fallback?: TopicSummary | TopicProfile) {
  const [state, setState] = useState<TopicDetailState>(() => {
    if (isFullTopic(fallback)) {
      cache.set(fallback.slug, fallback)
      return { slug: fallback.slug, topic: fallback, loading: false, error: null }
    }
    if (slug && cache.has(slug)) {
      return { slug, topic: cache.get(slug) || null, loading: false, error: null }
    }
    return { slug, topic: null, loading: Boolean(slug), error: null }
  })

  useEffect(() => {
    if (!slug) {
      return
    }
    let cancelled = false
    const requestedSlug = slug
    async function loadTopic() {
      if (cache.has(requestedSlug)) {
        if (!cancelled) {
          setState({ slug: requestedSlug, topic: cache.get(requestedSlug) || null, loading: false, error: null })
        }
        return
      }
      if (isFullTopic(fallback)) {
        cache.set(requestedSlug, fallback)
        if (!cancelled) {
          setState({ slug: requestedSlug, topic: fallback, loading: false, error: null })
        }
        return
      }
      setState({ slug: requestedSlug, topic: null, loading: true, error: null })
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/topics/${requestedSlug}.json?v=${dataSnapshotVersion}`, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`Could not load topic ${requestedSlug}: ${response.status}`)
        }
        const topic = (await response.json()) as TopicProfile
        cache.set(requestedSlug, topic)
        if (!cancelled) {
          setState({ slug: requestedSlug, topic, loading: false, error: null })
        }
      } catch (error) {
        if (!cancelled) {
          setState({ slug: requestedSlug, topic: null, loading: false, error: error instanceof Error ? error.message : 'Unknown topic loading error' })
        }
      }
    }
    loadTopic()
    return () => {
      cancelled = true
    }
  }, [fallback, slug])

  const cached = slug ? cache.get(slug) : undefined
  const fallbackTopic = isFullTopic(fallback) && fallback.slug === slug ? fallback : undefined
  const stateMatches = state.slug === slug
  const activeTopic = stateMatches && state.topic?.slug === slug ? state.topic : cached || fallbackTopic || null

  return {
    topic: activeTopic,
    loading: (stateMatches && state.loading) || Boolean(slug && !activeTopic && !(stateMatches && state.error)),
    error: stateMatches ? state.error : null,
  }
}
