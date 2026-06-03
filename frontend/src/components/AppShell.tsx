import type React from 'react'
import { ChevronsLeft, ChevronsRight, Command, Database, Moon, Search, Sun } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { NavItem } from '../app/navigation'
import type { AtlasData } from '../data/types'
import { formatDate } from '../lib/format'
import { hrefFor, isActivePath, navigate } from '../lib/router'
import { Button, Input, Separator } from './ui'

interface AppShellProps {
  atlas: AtlasData
  navItems: NavItem[]
  activePath: string
  theme: 'dark' | 'light'
  onThemeChange: () => void
  pageActions?: React.ReactNode
  children: React.ReactNode
}

export function AppShell({ atlas, navItems, activePath, theme, onThemeChange, pageActions, children }: AppShellProps) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return []
    }
    return atlas.topics
      .filter((topic) => `${topic.label} ${topic.domain} ${topic.field} ${topic.subfield} ${topic.workArea}`.toLowerCase().includes(normalized))
      .slice(0, 8)
  }, [atlas.topics, query])

  return (
    <div className={`app-shell ${collapsed ? 'is-sidebar-collapsed' : ''}`}>
      <aside className="sidebar" aria-label="Research Atlas navigation">
        <div className="sidebar-head">
          <a
            className="brand"
            href={hrefFor('/')}
            onClick={(event) => {
              event.preventDefault()
              navigate('/')
            }}
            title="Research Atlas"
          >
            <span className="brand-mark">
              <Command aria-hidden="true" />
            </span>
            <span className="brand-copy">
              <span className="brand-title">Research Atlas</span>
              <span className="brand-subtitle">OpenAlex Intelligence</span>
            </span>
          </a>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronsRight aria-hidden="true" /> : <ChevronsLeft aria-hidden="true" />}
          </Button>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActivePath(activePath, item.path)
            return (
              <a
                key={item.path}
                className={`nav-link ${active ? 'is-active' : ''}`}
                href={hrefFor(item.path)}
                title={item.label}
                onClick={(event) => {
                  event.preventDefault()
                  navigate(item.path)
                }}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <Separator />
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">Refresh</span>
            <strong>{formatDate(atlas.generatedAt)}</strong>
            <span>{atlas.artifactStatus}</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <div className="topbar">
          <div className="mobile-brand">
            <span className="brand-title">Research Atlas</span>
            <span className="brand-subtitle">OpenAlex Intelligence</span>
          </div>
          <div className="command-wrap">
            <Search aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search topics, fields, domains"
              aria-label="Search topics, fields, domains"
            />
            {matches.length > 0 && (
              <div className="command-menu">
                {matches.map((topic) => (
                  <button
                    className="command-item"
                    type="button"
                    key={topic.slug}
                    onClick={() => {
                      setQuery('')
                      navigate(`/topic/${topic.slug}`)
                    }}
                  >
                    <span>{topic.label}</span>
                    <small>
                      {topic.domain} / {topic.field}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="topbar-actions">
            {pageActions}
            <a className="source-chip" href={atlas.source.url} target="_blank" rel="noreferrer">
              <Database aria-hidden="true" />
              Go to OpenAlex
            </a>
            <Button variant="outline" size="icon" onClick={onThemeChange} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </Button>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}
