import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

interface PageHeaderProps {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
  actionsClassName?: string
}

export function PageHeader({ title, description, eyebrow, actions, actionsClassName }: PageHeaderProps) {
  return (
    <section className="flex min-w-0 items-center justify-between gap-5 border-b border-border/70 pb-4 max-[760px]:flex-col max-[760px]:items-stretch max-[760px]:gap-3 max-[760px]:pb-3.5">
      <div className="min-w-0">
        {eyebrow && <span className="mb-1.5 block text-[0.65rem] font-bold uppercase text-muted-foreground">{eyebrow}</span>}
        <h1 className="m-0 font-display text-[clamp(1.48rem,1.8vw,1.68rem)] leading-[1.18] font-[700] tracking-[0]">{title}</h1>
        <p className="mt-1.5 mb-0 max-w-[740px] text-[0.83rem] leading-[1.5] text-muted-foreground [overflow-wrap:anywhere]">{description}</p>
      </div>
      {actions && <div className={cx('shrink-0', actionsClassName)}>{actions}</div>}
    </section>
  )
}
