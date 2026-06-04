import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { DataState } from '../components/DataState'
import { useAtlasData } from '../data/useAtlasData'
import { routeFromPath } from '../lib/router'
import { navItems } from './navigation'
import { renderRoute } from './renderRoute'
import { useTheme } from './useTheme'

export function ResearchAtlasApp() {
  const { data, loading, error } = useAtlasData()
  const [path, setPath] = useState(() => routeFromPath(window.location.pathname, window.location.search))
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const handleLocation = () => setPath(routeFromPath(window.location.pathname, window.location.search))
    window.addEventListener('popstate', handleLocation)
    window.addEventListener('atlas:navigate', handleLocation)
    return () => {
      window.removeEventListener('popstate', handleLocation)
      window.removeEventListener('atlas:navigate', handleLocation)
    }
  }, [])

  const route = useMemo(() => (data ? renderRoute({ atlas: data, path, theme, onThemeChange: toggleTheme }) : null), [data, path, theme, toggleTheme])

  useEffect(() => {
    if (!data) {
      return
    }
    const topicMatch = path.match(/^\/topic\/([^/]+)(?:\/([^/]+))?$/)
    const topic = topicMatch ? data.topics.find((item) => item.slug === topicMatch[1]) : undefined
    const routeMeta = (() => {
      if (topic) {
        if (topicMatch?.[2] === 'network') {
          return {
            title: `${topic.label} Collaboration Network | Research Atlas`,
            description: `Researcher, institution, geographic, and subtopic collaboration structure for ${topic.label}.`,
          }
        }
        if (topicMatch?.[2] === 'rising-researchers') {
          return {
            title: `${topic.label} Rising Researchers | Research Atlas`,
            description: `Researchers with increasing visibility in ${topic.label}, based on OpenAlex topic activity.`,
          }
        }
        return {
          title: `${topic.label} Research Atlas`,
          description: `OpenAlex intelligence profile for ${topic.label}: momentum, papers, institutions, researchers, geography, and networks.`,
        }
      }
      if (path === '/trending') {
        return {
          title: 'Trending Intelligence | Research Atlas',
          description: 'Ranked research topics by publication growth, citation velocity, author growth, and institution expansion.',
        }
      }
      if (path === '/researchers') {
        return {
          title: 'Researcher Visibility | Research Atlas',
          description: 'Discover researchers with increasing visibility across curated OpenAlex topic snapshots.',
        }
      }
      if (path === '/networks') {
        return {
          title: 'Collaboration Intelligence | Research Atlas',
          description: 'Explore researcher, institution, geographic, and subtopic collaboration structure.',
        }
      }
      if (path === '/about' || path === '/methodology') {
        return {
          title: 'About Research Atlas',
          description: 'How Research Atlas collects OpenAlex data, computes rankings, and presents research intelligence signals.',
        }
      }
      return {
        title: 'Research Atlas',
        description: 'Explore research momentum, rising researchers, institutions, papers, geography, and collaboration networks from OpenAlex.',
      }
    })()
    document.title = routeMeta.title
    const meta = document.querySelector('meta[name="description"]') || document.head.appendChild(document.createElement('meta'))
    meta.setAttribute('name', 'description')
    meta.setAttribute('content', routeMeta.description)
    for (const [property, content] of [
      ['og:title', routeMeta.title],
      ['og:description', routeMeta.description],
      ['og:type', 'website'],
    ]) {
      const tag = document.querySelector(`meta[property="${property}"]`) || document.head.appendChild(document.createElement('meta'))
      tag.setAttribute('property', property)
      tag.setAttribute('content', content)
    }
  }, [data, path])

  return (
    <DataState loading={loading} error={error}>
      {data && (
        <AppShell
          atlas={data}
          navItems={navItems}
          activePath={path}
        >
          {route}
        </AppShell>
      )}
    </DataState>
  )
}
