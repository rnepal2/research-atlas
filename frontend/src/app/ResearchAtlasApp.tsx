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
