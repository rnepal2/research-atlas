import { ExternalLink } from 'lucide-react'
import type { PaperProfile } from '../data/types'
import { formatCompact } from '../lib/format'
import { ScrollArea } from './ui'

interface PaperListProps {
  papers: PaperProfile[]
  limit?: number
}

export function PaperList({ papers, limit = 6 }: PaperListProps) {
  return (
    <ScrollArea className="paper-scroll">
      <div className="paper-list">
        {papers.slice(0, limit).map((paper) => (
          <article className="paper-card" key={paper.openalexId}>
            <h3>
              {paper.url ? (
                <a href={paper.url} target="_blank" rel="noreferrer">
                  {paper.title} <ExternalLink aria-hidden="true" />
                </a>
              ) : (
                paper.title
              )}
            </h3>
            <div className="paper-meta">
              <span>{paper.year}</span>
              <span>{paper.source}</span>
              <span>{formatCompact(paper.citations)} citations</span>
              <span>{paper.authors.slice(0, 3).join(', ')}</span>
            </div>
          </article>
        ))}
      </div>
    </ScrollArea>
  )
}
