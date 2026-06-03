import { ExternalLink } from 'lucide-react'
import type { FrontierCard } from '../data/types'

interface FrontierCardsProps {
  cards: FrontierCard[]
}

export function FrontierCards({ cards }: FrontierCardsProps) {
  return (
    <div className="frontier-grid">
      {cards.map((card) => (
        <article className="frontier-card" key={`${card.label}-${card.title}`}>
          <span className="frontier-label">{card.label}</span>
          <h3>{card.title}</h3>
          <span className="frontier-value">{card.value}</span>
          <p className="muted">{card.description}</p>
          {card.url && (
            <a className="frontier-link" href={card.url} target="_blank" rel="noreferrer">
              Open paper
              <ExternalLink aria-hidden="true" />
            </a>
          )}
        </article>
      ))}
    </div>
  )
}
