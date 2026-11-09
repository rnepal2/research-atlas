import type { AtlasData, TopicSummary } from '../data/types'
import { recoverStaticRoute } from './routePaths'

const base = import.meta.env.BASE_URL.replace(/\/$/, '')

export function routeFromPath(pathname: string, search: string): string {
  const { route, restoredUrl } = recoverStaticRoute(pathname, search, base)
  if (restoredUrl) window.history.replaceState({}, '', restoredUrl)
  return route || '/'
}

export function hrefFor(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (!base) {
    return clean
  }
  return `${base}${clean}`
}

export function navigate(path: string): void {
  const topic = path.match(/^\/topic\/([^/]+)/)?.[1]
  if (topic) sessionStorage.setItem('atlas:topic', topic)
  window.history.pushState({}, '', hrefFor(path))
  window.dispatchEvent(new Event('atlas:navigate'))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function isActivePath(activePath: string, itemPath: string): boolean {
  if (itemPath === '/connections' && (activePath === '/people'||activePath==='/networks')) return true
  if (itemPath === '/networks' && /^\/topic\/[^/]+\/network$/.test(activePath)) return true
  if (itemPath === '/') {
    return activePath === '/'
  }
  return activePath.startsWith(itemPath)
}

export function findTopic(atlas: AtlasData, slug: string): TopicSummary | undefined {
  return atlas.topics.find((topic) => topic.slug === slug)
}
