import type { AuthorProfile, InstitutionProfile } from '../data/types'
import { formatCompact, formatScore } from '../lib/format'
import { ScrollArea } from './ui'

interface RankingTableProps {
  type: 'authors' | 'institutions'
  rows: AuthorProfile[] | InstitutionProfile[]
  limit?: number
}

export function RankingTable({ type, rows, limit = 8 }: RankingTableProps) {
  const visible = rows.slice(0, limit)
  if (type === 'authors') {
    const authors = visible as AuthorProfile[]
    return (
      <ScrollArea className="table-scroll table-scroll-md">
        <table className="ranking-table">
          <thead>
            <tr>
              <th>Researcher</th>
              <th>Institution</th>
              <th>Recent</th>
              <th>Citations</th>
              <th>Bridge</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {authors.map((author) => (
              <tr key={author.openalexId}>
                <td>
                  <strong>{author.name}</strong>
                </td>
                <td>{author.institution}</td>
                <td>{author.recentWorks}</td>
                <td>{formatCompact(author.citations)}</td>
                <td>{formatScore(author.bridgeScore)}</td>
                <td>
                  <span className="score-pill">{formatScore(author.risingScore)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    )
  }

  const institutions = visible as InstitutionProfile[]
  return (
    <ScrollArea className="table-scroll table-scroll-md">
      <table className="ranking-table">
        <thead>
          <tr>
            <th>Institution</th>
            <th>Country</th>
            <th>Works</th>
            <th>Recent</th>
            <th>Authors</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {institutions.map((institution) => (
            <tr key={institution.openalexId}>
              <td>
                <strong>{institution.name}</strong>
              </td>
              <td>{institution.country || 'Unknown'}</td>
              <td>{institution.works}</td>
              <td>{institution.recentWorks}</td>
              <td>{institution.activeAuthors}</td>
              <td>
                <span className="score-pill">{formatScore(institution.strengthScore)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  )
}
