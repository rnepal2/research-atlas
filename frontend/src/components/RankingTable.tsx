import type { AuthorProfile, InstitutionProfile } from '../data/types'
import { formatCompact, formatScore } from '../lib/format'
import { ScrollArea, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui'

interface RankingTableProps {
  type: 'authors' | 'institutions'
  rows: AuthorProfile[] | InstitutionProfile[]
  limit?: number
}

const tableClass =
  'min-w-[760px] border-collapse [&_strong]:font-[650] [&_strong]:text-foreground'
const headClass =
  'sticky top-0 z-[2] h-auto border-b border-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card-solid)_96%,transparent),color-mix(in_srgb,var(--card-solid)_90%,transparent))] px-2 py-[9px] text-left text-[0.66rem] font-bold tracking-[0] text-muted-foreground uppercase backdrop-blur-[14px]'
const cellClass =
  'border-b border-border px-2 py-[9px] text-[0.79rem] leading-[1.35] whitespace-normal text-[color-mix(in_srgb,var(--foreground)_82%,var(--muted-foreground))]'
const rowClass = 'transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_5%,transparent)]'

const scorePillClass =
  'inline-flex h-[26px] min-w-11 items-center justify-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] px-[7px] text-[0.74rem] font-bold text-primary'

export function RankingTable({ type, rows, limit = 8 }: RankingTableProps) {
  const visible = rows.slice(0, limit)
  if (type === 'authors') {
    const authors = visible as AuthorProfile[]
    return (
      <ScrollArea className="h-[302px] w-full">
        <Table className={tableClass}>
          <TableHeader>
            <TableRow>
              <TableHead className={headClass}>Researcher</TableHead>
              <TableHead className={headClass}>Institution</TableHead>
              <TableHead className={headClass}>Recent</TableHead>
              <TableHead className={headClass}>Citations</TableHead>
              <TableHead className={headClass}>Bridge</TableHead>
              <TableHead className={headClass}>Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {authors.map((author) => (
              <TableRow className={rowClass} key={author.openalexId}>
                <TableCell className={cellClass}>
                  <strong>{author.name}</strong>
                </TableCell>
                <TableCell className={cellClass}>{author.institution}</TableCell>
                <TableCell className={cellClass}>{author.recentWorks}</TableCell>
                <TableCell className={cellClass}>{formatCompact(author.citations)}</TableCell>
                <TableCell className={cellClass}>{formatScore(author.bridgeScore)}</TableCell>
                <TableCell className={cellClass}>
                  <span className={scorePillClass}>{formatScore(author.risingScore)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    )
  }

  const institutions = visible as InstitutionProfile[]
  return (
    <ScrollArea className="h-[302px] w-full">
      <Table className={tableClass}>
        <TableHeader>
          <TableRow>
            <TableHead className={headClass}>Institution</TableHead>
            <TableHead className={headClass}>Country</TableHead>
            <TableHead className={headClass}>Works</TableHead>
            <TableHead className={headClass}>Recent</TableHead>
            <TableHead className={headClass}>Authors</TableHead>
            <TableHead className={headClass}>Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {institutions.map((institution) => (
            <TableRow className={rowClass} key={institution.openalexId}>
              <TableCell className={cellClass}>
                <strong>{institution.name}</strong>
              </TableCell>
              <TableCell className={cellClass}>{institution.country || 'Unknown'}</TableCell>
              <TableCell className={cellClass}>{institution.works}</TableCell>
              <TableCell className={cellClass}>{institution.recentWorks}</TableCell>
              <TableCell className={cellClass}>{institution.activeAuthors}</TableCell>
              <TableCell className={cellClass}>
                <span className={scorePillClass}>{formatScore(institution.strengthScore)}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
