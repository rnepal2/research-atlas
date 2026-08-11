import { ExternalLink } from 'lucide-react'
import type { PaperProfile } from '../data/types'
import { formatCompact } from '../lib/format'
import { DataRegion } from './ui'

interface PaperListProps {
  papers: PaperProfile[]
  limit?: number
}

export function PaperList({ papers, limit = 6 }: PaperListProps) {
  return (
    <DataRegion density="panel">
      <div className="grid gap-0">
        {papers.slice(0, limit).map((paper) => (
          <article className="grid gap-[7px] border-b border-border py-[11px] last:border-b-0" key={paper.openalexId}>
            <h3 className="m-0 text-[0.86rem] leading-[1.35]">
              {paper.url ? (
                <a className="inline [&_svg]:ml-1 [&_svg]:inline [&_svg]:size-[13px] [&_svg]:align-[-2px]" href={paper.url} target="_blank" rel="noreferrer">
                  {paper.title} <ExternalLink aria-hidden="true" />
                </a>
              ) : (
                paper.title
              )}
            </h3>
            <div className="flex flex-wrap gap-x-3 gap-y-2 text-[0.72rem] text-muted-foreground">
              <span>{paper.year}</span>
              <span>{paper.source}</span>
              <span>{formatCompact(paper.citations)} citations</span>
              <span>{paper.authors.slice(0, 3).join(', ')}</span>
            </div>
          </article>
        ))}
      </div>
    </DataRegion>
  )
}
