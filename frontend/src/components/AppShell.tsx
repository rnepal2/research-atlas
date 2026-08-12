import type React from 'react'
import { ChevronsLeft, ChevronsRight, Command } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { NavItem } from '../app/navigation'
import type { AtlasData } from '../data/types'
import { cx } from '../lib/cx'
import { formatDate } from '../lib/format'
import { hrefFor, isActivePath, navigate } from '../lib/router'
import { Button, Separator } from './ui'

interface AppShellProps {
  atlas: AtlasData
  navItems: NavItem[]
  activePath: string
  children: React.ReactNode
}

export function AppShell({ atlas, navItems, activePath, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const mainRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [activePath])

  return (
    <div
      className={cx(
        'grid min-h-screen w-full items-start overflow-hidden transition-[grid-template-columns] duration-200 max-[1160px]:h-auto max-[1160px]:grid-cols-1 max-[1160px]:overflow-x-hidden max-[1160px]:overflow-y-visible',
        collapsed ? 'grid-cols-[64px_minmax(0,1fr)]' : 'grid-cols-[264px_minmax(0,1fr)]',
      )}
    >
      <aside
        className={cx(
          'sticky top-0 flex h-dvh max-h-dvh min-h-screen flex-col gap-[18px] overflow-hidden border-r border-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--sidebar-bg)_96%,transparent),color-mix(in_srgb,var(--sidebar-bg-end)_96%,transparent)),var(--sidebar-bg)] py-[22px] backdrop-blur-2xl max-[1160px]:static max-[1160px]:h-auto max-[1160px]:max-h-none max-[1160px]:min-h-0 max-[1160px]:w-full max-[1160px]:overflow-visible max-[1160px]:overflow-x-hidden max-[1160px]:border-r-0 max-[1160px]:border-b max-[1160px]:px-3 max-[1160px]:py-2.5',
          collapsed ? 'px-2.5' : 'px-3.5',
        )}
        aria-label="Research Atlas navigation"
      >
        <div className={cx('flex items-start justify-between gap-2 max-[1160px]:hidden', collapsed && 'grid justify-items-center')}>
          <a
            className={cx('flex min-w-0 items-center gap-3 py-1 pr-0 pb-[18px] pl-1.5', collapsed && 'pb-1 pl-0')}
            href={hrefFor('/')}
            onClick={(event) => {
              event.preventDefault()
              navigate('/')
            }}
            title="Research Atlas"
          >
            <span className="grid size-10 place-items-center rounded-card border border-border bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_18%,transparent),rgba(255,255,255,0.02)),var(--secondary)] text-primary [&_svg]:size-5">
              <Command aria-hidden="true" />
            </span>
            <span className={cx('min-w-0', collapsed && 'hidden')}>
              <span className="block whitespace-nowrap font-display text-[0.98rem] leading-[1.15] font-bold">Research Atlas</span>
              <span className="mt-[3px] block text-[0.72rem] text-muted-foreground">Research discovery atlas</span>
            </span>
          </a>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronsRight aria-hidden="true" /> : <ChevronsLeft aria-hidden="true" />}
          </Button>
        </div>

        <nav className="grid min-h-0 gap-[5px] max-[1160px]:flex max-[1160px]:max-w-[100vw] max-[1160px]:overflow-x-auto max-[1160px]:pb-0.5 max-[760px]:grid max-[760px]:grid-cols-5 max-[760px]:gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActivePath(activePath, item.path)
            return (
              <a
                key={item.path}
                className={cx(
                  'flex min-h-[38px] items-center gap-2.5 rounded-card px-[11px] py-2 text-[0.82rem] font-[640] text-muted-foreground transition-[background,color,transform] duration-150 hover:translate-x-0.5 hover:bg-secondary hover:text-foreground max-[1160px]:shrink-0 max-[760px]:min-h-[46px] max-[760px]:flex-col max-[760px]:justify-center max-[760px]:gap-1 max-[760px]:px-2 max-[760px]:text-center max-[760px]:text-[0.68rem]',
                  collapsed && 'justify-center px-0 max-[1160px]:justify-start max-[1160px]:px-[11px]',
                  active && 'bg-secondary text-foreground shadow-[inset_2px_0_0_var(--primary)]',
                  active && collapsed && 'shadow-[inset_0_-2px_0_var(--primary)] max-[1160px]:shadow-[inset_2px_0_0_var(--primary)]',
                )}
                href={hrefFor(item.path)}
                title={item.label}
                onClick={(event) => {
                  event.preventDefault()
                  navigate(item.path)
                }}
              >
                <Icon aria-hidden="true" className="size-[18px] max-[760px]:size-4" />
                <span className={cx('max-[760px]:whitespace-nowrap', collapsed && 'hidden max-[1160px]:inline')}>{item.label}</span>
              </a>
            )
          })}
        </nav>

        <div className={cx('mt-auto grid shrink-0 gap-3 max-[1160px]:hidden', collapsed ? '-mx-2.5' : '-mx-3.5')}>
          <Separator />
          <div className={cx('grid gap-1 px-5 py-1', collapsed && 'hidden')}>
            <span className="text-[0.7rem] font-[650] text-muted-foreground">Data Refresh</span>
            <span className="text-[0.72rem] text-muted-foreground">{formatDate(atlas.generatedAt)}</span>
          </div>
        </div>
      </aside>

      <main ref={mainRef} className="h-dvh min-w-0 max-w-[100vw] overflow-y-auto overscroll-contain px-5 pt-[26px] pb-8 max-[1160px]:h-auto max-[1160px]:max-w-full max-[1160px]:overflow-visible max-[1160px]:px-4 max-[1160px]:pt-[22px] max-[1160px]:pb-7 max-[760px]:px-3 max-[760px]:pt-[18px] max-[760px]:pb-6">
        {children}
      </main>
    </div>
  )
}
