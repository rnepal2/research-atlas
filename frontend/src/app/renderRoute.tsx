import type { AtlasData } from '../data/types'
import { findTopic } from '../lib/router'
import { AtlasPage } from '../pages/AtlasPage'
import { MethodologyPage } from '../pages/MethodologyPage'
import { NetworksPage } from '../pages/NetworksPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ResearchersPage } from '../pages/ResearchersPage'
import { TrendingPage } from '../pages/TrendingPage'

interface RenderRouteParams {
  atlas: AtlasData
  path: string
  theme: 'dark' | 'light'
  onThemeChange: () => void
}

export function renderRoute({ atlas, path, theme, onThemeChange }: RenderRouteParams) {
  const topicMatch = path.match(/^\/topic\/([^/]+)(?:\/([^/]+))?$/)
  const matchedTopic = topicMatch ? findTopic(atlas, topicMatch[1]) : undefined

  if (path === '/' || (topicMatch && matchedTopic && !topicMatch[2])) {
    return <AtlasPage atlas={atlas} initialTopicSlug={matchedTopic?.slug} theme={theme} onThemeChange={onThemeChange} />
  }
  if (path === '/trending') {
    return <TrendingPage atlas={atlas} />
  }
  if (path === '/researchers' || (topicMatch && matchedTopic && topicMatch[2] === 'rising-researchers')) {
    return <ResearchersPage atlas={atlas} initialTopicSlug={matchedTopic?.slug} />
  }
  if (path === '/networks' || (topicMatch && matchedTopic && topicMatch[2] === 'network')) {
    return <NetworksPage atlas={atlas} initialTopicSlug={matchedTopic?.slug} />
  }
  if (path === '/about' || path === '/methodology') {
    return <MethodologyPage atlas={atlas} />
  }
  return <NotFoundPage atlas={atlas} />
}
