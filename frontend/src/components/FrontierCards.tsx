import { ExternalLink } from 'lucide-react'
import type { FrontierCard } from '../data/types'

interface FrontierCardsProps {
  cards: FrontierCard[]
}

export function FrontierCards({ cards }: FrontierCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-2.5 max-[1160px]:grid-cols-2 max-[760px]:grid-cols-1">
      {cards.map((card) => (
        <article
          className="relative flex min-h-[148px] flex-col gap-[9px] overflow-hidden rounded-card border border-border bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_6%,transparent),transparent_58%),var(--card)] p-3.5 shadow-atlas transition-colors duration-150 hover:border-[color-mix(in_srgb,var(--primary)_32%,var(--border))]"
          key={`${card.label}-${card.title}`}
        >
          <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,var(--primary),transparent)] opacity-70" />
          <span className="text-[0.67rem] font-bold uppercase tracking-[0] text-muted-foreground">{card.label}</span>
          <h3 className="m-0 line-clamp-2 min-h-[2.35em] text-[0.94rem] leading-[1.25]">{card.title}</h3>
          <span className="text-[1.08rem] font-bold text-primary">{card.value}</span>
          <p className="m-0 line-clamp-2 text-[0.76rem] leading-[1.45] text-muted-foreground">{card.description}</p>
          {card.url && (
            <a className="mt-auto inline-flex items-center gap-1.5 text-[0.74rem] font-bold text-primary [&_svg]:size-[13px]" href={card.url} target="_blank" rel="noreferrer">
              Open paper
              <ExternalLink aria-hidden="true" />
            </a>
          )}
        </article>
      ))}
    </div>
  )
}
