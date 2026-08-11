import type { AuthorProfile, InstitutionProfile } from '../data/types'
import { formatCompact, formatScore } from '../lib/format'
import { DataRegion, dataTableStyles, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui'

interface RankingTableProps {
  type: 'authors' | 'institutions'
  rows: AuthorProfile[] | InstitutionProfile[]
  limit?: number
}

const { table: tableClass, head: headClass, cell: cellClass, row: rowClass, scorePill: scorePillClass } = dataTableStyles

export function RankingTable({ type, rows, limit = 8 }: RankingTableProps) {
  const visible = rows.slice(0, limit)
  if (type === 'authors') {
    const authors = visible as AuthorProfile[]
    return (
      <DataRegion density="panel">
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
      </DataRegion>
    )
  }

  const institutions = visible as InstitutionProfile[]
  return (
    <DataRegion density="panel">
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
    </DataRegion>
  )
}
