import { Suspense } from 'react'
import type { AtlasData } from '../data/types'
import { findTopic } from '../lib/router'
import { AtlasPage, MethodologyPage, NetworksPage, NotFoundPage, ResearchersPage, TrendingPage } from './lazyPages'

interface RenderRouteParams {
  atlas: AtlasData
  path: string
  theme: 'dark' | 'light'
  onThemeChange: () => void
}

export function renderRoute({ atlas, path, theme, onThemeChange }: RenderRouteParams) {
  const topicMatch = path.match(/^\/topic\/([^/]+)(?:\/([^/]+))?$/)
  const matchedTopic = topicMatch ? findTopic(atlas, topicMatch[1]) : undefined
  const fallback = (
    <div className="min-h-[320px] rounded-card border border-border bg-card p-4 text-[0.82rem] font-bold text-muted-foreground">
      Loading research view...
    </div>
  )
  let page

  if (path === '/' || (topicMatch && matchedTopic && !topicMatch[2])) {
    page = <AtlasPage atlas={atlas} initialTopicSlug={matchedTopic?.slug} theme={theme} onThemeChange={onThemeChange} />
  } else if (path === '/trending') {
    page = <TrendingPage atlas={atlas} />
  } else if (path === '/researchers' || (topicMatch && matchedTopic && topicMatch[2] === 'rising-researchers')) {
    page = <ResearchersPage atlas={atlas} initialTopicSlug={matchedTopic?.slug} />
  } else if (path === '/networks' || (topicMatch && matchedTopic && topicMatch[2] === 'network')) {
    page = <NetworksPage atlas={atlas} initialTopicSlug={matchedTopic?.slug} />
  } else if (path === '/about' || path === '/methodology') {
    page = <MethodologyPage atlas={atlas} />
  } else {
    page = <NotFoundPage atlas={atlas} />
  }
  return <Suspense fallback={fallback}>{page}</Suspense>
}
