import type { AtlasData, TopicSummary } from '../data/types'

const base = import.meta.env.BASE_URL.replace(/\/$/, '')

export function routeFromPath(pathname: string, search: string): string {
  const params = new URLSearchParams(search)
  const redirectedPath = params.get('p')
  if (redirectedPath) {
    const clean = redirectedPath.startsWith('/') ? redirectedPath : `/${redirectedPath}`
    window.history.replaceState({}, '', hrefFor(clean))
    return clean
  }

  let route = pathname
  if (base && base !== '' && route.startsWith(base)) {
    route = route.slice(base.length)
  }
  if (!route.startsWith('/')) {
    route = `/${route}`
  }
  return route === '' ? '/' : route
}

export function hrefFor(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (!base) {
    return clean
  }
  return `${base}${clean}`
}

export function navigate(path: string): void {
  window.history.pushState({}, '', hrefFor(path))
  window.dispatchEvent(new Event('atlas:navigate'))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function isActivePath(activePath: string, itemPath: string): boolean {
  if (itemPath === '/') {
    return activePath === '/'
  }
  return activePath.startsWith(itemPath)
}

export function findTopic(atlas: AtlasData, slug: string): TopicSummary | undefined {
  return atlas.topics.find((topic) => topic.slug === slug)
}
