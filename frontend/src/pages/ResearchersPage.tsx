import { Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, ScrollArea, SelectField } from '../components/ui'
import type { AtlasData } from '../data/types'
import { formatCompact, formatScore } from '../lib/format'

interface ResearchersPageProps {
  atlas: AtlasData
  initialTopicSlug?: string
}

export function ResearchersPage({ atlas, initialTopicSlug }: ResearchersPageProps) {
  const [topicSlug, setTopicSlug] = useState(initialTopicSlug || 'all')
  const [query, setQuery] = useState('')
  const rows = useMemo(() => {
    const source = topicSlug === 'all' ? atlas.leaderboards.authors : atlas.topics.find((topic) => topic.slug === topicSlug)?.authors || []
    const normalized = query.trim().toLowerCase()
    return source
      .filter((author) => `${author.name} ${author.institution} ${author.topics.join(' ')}`.toLowerCase().includes(normalized))
      .slice(0, 50)
  }, [atlas, topicSlug, query])

  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <h1 className="page-title">Researcher Visibility</h1>
          <p className="page-intro">
            A discovery surface for researchers gaining visibility across selected OpenAlex topics. This is not a quality ranking.
          </p>
        </div>
        <Badge variant="outline">{rows.length} visible rows</Badge>
      </section>

      <section className="selector-grid">
        <SelectField
          label="Topic scope"
          value={topicSlug}
          onValueChange={setTopicSlug}
          options={[
            { value: 'all', label: 'All curated topics' },
            ...atlas.topics.map((topic) => ({
              value: topic.slug,
              label: topic.label,
              meta: topic.domain,
            })),
          ]}
        />
        <label className="ui-select-wrap">
          <span>Search</span>
          <span className="command-wrap">
            <Search aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Researcher, institution, topic" />
          </span>
        </label>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Researchers with increasing visibility</CardTitle>
            <CardDescription>Recent works, citation velocity, bridge signal, topic focus, and topic coverage.</CardDescription>
          </div>
          <Users aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <ScrollArea className="table-scroll table-scroll-xl">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Researcher</th>
                  <th>Institution</th>
                  <th>Topics</th>
                  <th>Recent</th>
                  <th>Citations</th>
                  <th>Bridge</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((author) => {
                  const topicsSeen = 'topicsSeen' in author && Array.isArray(author.topicsSeen) ? author.topicsSeen : author.topics
                  return (
                  <tr key={`${author.openalexId}-${author.topics.join('-')}`}>
                    <td>
                      <strong>{author.name}</strong>
                      <br />
                      <span className="muted">{author.country || 'Unknown country'}</span>
                    </td>
                    <td>{author.institution}</td>
                    <td>{topicsSeen.slice(0, 3).join(', ')}</td>
                    <td>{author.recentWorks}</td>
                    <td>{formatCompact(author.citations)}</td>
                    <td>{formatScore(author.bridgeScore)}</td>
                    <td>
                      <span className="score-pill">{formatScore(author.risingScore)}</span>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
