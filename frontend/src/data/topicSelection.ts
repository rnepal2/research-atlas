import type { AtlasData, TopicSummary } from './types'

interface TopicScope {
  domain?: string
  field?: string
}

const domainDefaultSlugs: Record<string, string> = {
  'Health Sciences': 'car-t-cell-therapy',
}

/**
 * Returns the consistently preferred profile for a selection scope. Explicit
 * domain defaults take precedence, then the trending leaderboard controls the
 * preference, with metric-based sorting as a stable fallback.
 */
export function getDefaultTopic(atlas: AtlasData, scope: TopicScope = {}): TopicSummary | undefined {
  const candidates = atlas.topics.filter(
    (topic) => (!scope.domain || topic.domain === scope.domain) && (!scope.field || topic.field === scope.field),
  )
  const configuredDefault = scope.domain ? domainDefaultSlugs[scope.domain] : undefined
  const configuredTopic = candidates.find((topic) => topic.slug === configuredDefault)
  if (configuredTopic) {
    return configuredTopic
  }
  const trendingRank = new Map(atlas.trending.map((topic, index) => [topic.slug, index]))

  return [...candidates].sort((left, right) => {
    const leftRank = trendingRank.get(left.slug)
    const rightRank = trendingRank.get(right.slug)
    if (leftRank !== undefined || rightRank !== undefined) {
      if (leftRank === undefined) return 1
      if (rightRank === undefined) return -1
      if (leftRank !== rightRank) return leftRank - rightRank
    }
    return right.metrics.trendScore - left.metrics.trendScore || right.metrics.worksLast3Years - left.metrics.worksLast3Years || left.label.localeCompare(right.label)
  })[0]
}
