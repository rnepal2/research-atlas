import { Activity, ArrowUpRight, Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SelectField, ScrollArea } from '../components/ui'
import type { AtlasData } from '../data/types'
import { formatNumber, formatPercent, formatScore } from '../lib/format'
import { navigate } from '../lib/router'

interface TrendingPageProps {
  atlas: AtlasData
}

export function TrendingPage({ atlas }: TrendingPageProps) {
  const [domain, setDomain] = useState('All domains')
  const domains = ['All domains', ...new Set(atlas.trending.map((topic) => topic.domain))]
  const rows = useMemo(
    () => atlas.trending.filter((topic) => domain === 'All domains' || topic.domain === domain),
    [atlas.trending, domain],
  )

  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <h1 className="page-title">Trending Intelligence</h1>
          <p className="page-intro">
            Topic momentum normalized away from raw field size, with filters by OpenAlex domain and direct paths into the Atlas view.
          </p>
        </div>
        <SelectField
          className="compact-select"
          label="Filter"
          value={domain}
          onValueChange={setDomain}
          options={domains.map((item) => ({ value: item, label: item }))}
        />
      </section>

      <section className="frontier-grid">
        {rows.slice(0, 4).map((topic, index) => (
          <Card className="frontier-card" key={topic.slug}>
            <CardContent>
              <Badge variant={index === 0 ? 'default' : 'secondary'}>Rank {index + 1}</Badge>
              <h3>{topic.label}</h3>
              <span className="frontier-value">{formatScore(topic.trendScore)}</span>
              <p className="muted">
                {topic.domain} / {topic.workArea}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Momentum ranked topics</CardTitle>
            <CardDescription>Growth, author/institution expansion, and cross-topic spread in the static snapshot.</CardDescription>
          </div>
          <Filter aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <ScrollArea className="table-scroll table-scroll-xl">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Topic</th>
                  <th>OpenAlex path</th>
                  <th>Top subtopic</th>
                  <th>Recent works</th>
                  <th>Growth</th>
                  <th>Trend</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((topic, index) => (
                  <tr key={topic.slug}>
                    <td>
                      <strong>{index + 1}</strong>
                    </td>
                    <td>
                      <strong>{topic.label}</strong>
                      <br />
                      <span className="muted">{topic.workArea}</span>
                    </td>
                    <td>
                      {topic.domain}
                      <br />
                      <span className="muted">{topic.field}</span>
                    </td>
                    <td>{topic.topSubtopic}</td>
                    <td>{formatNumber(topic.worksLast3Years)}</td>
                    <td>{formatPercent(topic.growthRate)}</td>
                    <td>
                      <span className="score-pill">
                        <Activity aria-hidden="true" />
                        {formatScore(topic.trendScore)}
                      </span>
                    </td>
                    <td>
                      <Button variant="outline" size="sm" type="button" onClick={() => navigate(`/topic/${topic.slug}`)}>
                        Open
                        <ArrowUpRight aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
