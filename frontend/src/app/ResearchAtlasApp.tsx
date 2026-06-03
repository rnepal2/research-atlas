import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { DataState } from '../components/DataState'
import { Badge } from '../components/ui'
import { useAtlasData } from '../data/useAtlasData'
import { formatDate, formatNumber } from '../lib/format'
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

  const route = useMemo(() => (data ? renderRoute({ atlas: data, path }) : null), [data, path])
  const pageActions = useMemo(() => {
    if (!data) {
      return null
    }
    return (
      <Badge variant="outline" className="snapshot-badge">
        Updated {formatDate(data.generatedAt)} / {formatNumber(data.topics.length)} topics
      </Badge>
    )
  }, [data])

  return (
    <DataState loading={loading} error={error}>
      {data && (
        <AppShell
          atlas={data}
          navItems={navItems}
          activePath={path}
          theme={theme}
          onThemeChange={toggleTheme}
          pageActions={pageActions}
        >
          {route}
        </AppShell>
      )}
    </DataState>
  )
}
