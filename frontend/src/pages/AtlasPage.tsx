import { Activity, BookOpen, Building2, Users } from 'lucide-react'
import { useMemo } from 'react'
import { DensityMap } from '../components/DensityMap'
import { FrontierCards } from '../components/FrontierCards'
import { PaperList } from '../components/PaperList'
import { RankingTable } from '../components/RankingTable'
import { TopicSelector } from '../components/TopicSelector'
import { TrendChart } from '../components/TrendChart'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui'
import type { AtlasData, TopicProfile } from '../data/types'
import { formatCompact, formatNumber, formatPercent, formatScore } from '../lib/format'
import { navigate } from '../lib/router'

interface AtlasPageProps {
  atlas: AtlasData
  initialTopicSlug?: string
}

function Metric({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof BookOpen }) {
  return (
    <Card className="metric-card">
      <CardContent>
        <div className="metric-label">
          <span>{label}</span>
          <Icon aria-hidden="true" />
        </div>
        <div className="metric-value">{value}</div>
        <div className="metric-note">{note}</div>
      </CardContent>
    </Card>
  )
}

export function AtlasPage({ atlas, initialTopicSlug }: AtlasPageProps) {
  const initialTopic = useMemo(
    () => atlas.topics.find((topic) => topic.slug === initialTopicSlug) || atlas.trending.map((item) => atlas.topics.find((topic) => topic.slug === item.slug)).find(Boolean) || atlas.topics[0],
    [atlas, initialTopicSlug],
  ) as TopicProfile
  const selected = initialTopic

  function updateTopic(topic: TopicProfile) {
    navigate(`/topic/${topic.slug}`)
  }

  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <h1 className="page-title">Research Atlas</h1>
          <p className="page-intro">
            Explore OpenAlex domains, fields, subfields, and topic profiles through static intelligence artifacts:
            momentum, expertise, geography, papers, and collaboration structure.
          </p>
        </div>
        <Badge variant="outline">{atlas.topics.length} curated topic profiles</Badge>
      </section>

      <Card className="selector-card">
        <CardHeader>
          <div>
            <CardTitle>OpenAlex topic navigator</CardTitle>
            <CardDescription>
              Select by domain, field, and topic profile. New topics can be added by extending the YAML config.
            </CardDescription>
          </div>
          <Badge variant="default">{selected.workArea}</Badge>
        </CardHeader>
        <CardContent>
          <TopicSelector atlas={atlas} selected={selected} onChange={updateTopic} />
        </CardContent>
      </Card>

      <section className="metric-grid">
        <Metric
          label="Recent works"
          value={formatNumber(selected.metrics.worksLast3Years)}
          note={`${formatNumber(selected.metrics.worksLast5Years)} in five years`}
          icon={BookOpen}
        />
        <Metric
          label="Momentum"
          value={formatScore(selected.metrics.trendScore)}
          note={`${formatPercent(selected.metrics.growthRate)} growth vs prior`}
          icon={Activity}
        />
        <Metric
          label="Active authors"
          value={formatCompact(selected.metrics.activeAuthors)}
          note={`${formatPercent(selected.metrics.newAuthorShare)} new-author share`}
          icon={Users}
        />
        <Metric
          label="Institutions"
          value={formatNumber(selected.metrics.activeInstitutions)}
          note={`Concentration ${formatScore(selected.metrics.concentrationScore)}`}
          icon={Building2}
        />
      </section>

      <section className="atlas-insight-grid atlas-insight-grid-two">
        <Card className="chart-card-primary">
          <CardHeader>
            <div>
              <CardTitle>{selected.label} activity trend</CardTitle>
              <CardDescription>
                {selected.domain} / {selected.field} / {selected.subfield}
              </CardDescription>
            </div>
            <Badge variant="secondary">{formatNumber(selected.papers.length)} selected papers</Badge>
          </CardHeader>
          <CardContent>
            <TrendChart rows={selected.yearlyMetrics} />
          </CardContent>
        </Card>
        <Card className="map-card">
          <CardHeader>
            <div>
              <CardTitle>Geographic density</CardTitle>
              <CardDescription>Country-level institutional activity from work authorships.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DensityMap rows={selected.countries} />
          </CardContent>
        </Card>
      </section>

      <section className="evidence-grid">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Researchers with increasing visibility</CardTitle>
              <CardDescription>Recent activity, citation velocity, topic focus, and bridge signal.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <RankingTable type="authors" rows={selected.authors} limit={8} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Institution strengths</CardTitle>
              <CardDescription>Publication share, citations, rising authors, centrality, and breadth.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <RankingTable type="institutions" rows={selected.institutions} limit={8} />
          </CardContent>
        </Card>
      </section>

      <FrontierCards cards={selected.frontierCards} />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Paper lens</CardTitle>
            <CardDescription>Recent and high-impact works from the selected static artifact.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <PaperList papers={selected.papers} limit={8} />
        </CardContent>
      </Card>
    </div>
  )
}
