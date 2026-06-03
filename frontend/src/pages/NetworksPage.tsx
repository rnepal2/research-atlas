import { Building2, Globe2, Rows3, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DensityMap } from '../components/DensityMap'
import { IntelligenceNetwork } from '../components/IntelligenceNetwork'
import { SubtopicMatrix } from '../components/SubtopicMatrix'
import { TopicSelector } from '../components/TopicSelector'
import { Accordion, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, ScrollArea, Tabs } from '../components/ui'
import type { AtlasData, NetworkCommunitySummary, TopicProfile } from '../data/types'
import { formatNumber } from '../lib/format'
import { navigate } from '../lib/router'

interface NetworksPageProps {
  atlas: AtlasData
  initialTopicSlug?: string
}

export function NetworksPage({ atlas, initialTopicSlug }: NetworksPageProps) {
  const initialTopic = useMemo(() => atlas.topics.find((topic) => topic.slug === initialTopicSlug) || atlas.topics[0], [atlas.topics, initialTopicSlug])
  const [selected, setSelected] = useState<TopicProfile>(initialTopic)
  const [mode, setMode] = useState('researchers')
  const activeNetwork = mode === 'institutions' ? selected.institutionNetwork : selected.network
  const activeCommunities = mode === 'institutions' ? selected.networkCommunities.institutions : selected.networkCommunities.authors

  function updateTopic(topic: TopicProfile) {
    setSelected(topic)
    navigate(`/topic/${topic.slug}/network`)
  }

  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <h1 className="page-title">Collaboration Intelligence</h1>
          <p className="page-intro">
            Switch between researcher networks, institution collaboration, geographic density, and institution-subtopic matrices.
          </p>
        </div>
        <Tabs
          value={mode}
          onChange={setMode}
          options={[
            { value: 'researchers', label: 'Researchers' },
            { value: 'institutions', label: 'Institutions' },
            { value: 'geo', label: 'Geo density' },
            { value: 'matrix', label: 'Matrix' },
          ]}
        />
      </section>

      <Card className="selector-card">
        <CardContent>
          <TopicSelector atlas={atlas} selected={selected} onChange={updateTopic} />
        </CardContent>
      </Card>

      <section className="metric-grid">
        <Card className="metric-card">
          <CardContent>
            <div className="metric-label">
              <span>{mode === 'institutions' ? 'Institution nodes' : 'Researcher nodes'}</span>
              <Users aria-hidden="true" />
            </div>
            <div className="metric-value">{formatNumber(activeNetwork.nodes.length)}</div>
            <div className="metric-note">{formatNumber(activeNetwork.edges.length)} collaboration edges</div>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent>
            <div className="metric-label">
              <span>Communities</span>
              <Building2 aria-hidden="true" />
            </div>
            <div className="metric-value">{formatNumber(activeCommunities.length)}</div>
            <div className="metric-note">Cluster summaries in active mode</div>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent>
            <div className="metric-label">
              <span>Countries</span>
              <Globe2 aria-hidden="true" />
            </div>
            <div className="metric-value">{formatNumber(selected.countries.length)}</div>
            <div className="metric-note">Authorship-country density</div>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent>
            <div className="metric-label">
              <span>Matrix cells</span>
              <Rows3 aria-hidden="true" />
            </div>
            <div className="metric-value">{formatNumber(selected.subtopicMatrix.rows.length * selected.subtopicMatrix.columns.length)}</div>
            <div className="metric-note">Institution x subtopic activity</div>
          </CardContent>
        </Card>
      </section>

      {mode === 'researchers' && (
        <section className="network-layout">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Researcher coauthorship communities</CardTitle>
                <CardDescription>Cluster hulls use OpenAlex topic labels; node size follows rising visibility.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <IntelligenceNetwork network={selected.network} mode="author" />
            </CardContent>
          </Card>
          <NetworkInspector
            communities={activeCommunities}
            title="Bridge researchers"
            rows={selected.authors.slice(0, 10).map((author) => [author.name, `${formatNumber(author.risingScore)} visibility / ${author.recentWorks} recent`])}
          />
        </section>
      )}

      {mode === 'institutions' && (
        <section className="network-layout">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Institution collaboration network</CardTitle>
                <CardDescription>Edges connect institutions appearing together on works in the selected topic artifact.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <IntelligenceNetwork network={selected.institutionNetwork} mode="institution" />
            </CardContent>
          </Card>
          <NetworkInspector
            communities={activeCommunities}
            title="Institution hubs"
            rows={selected.institutions.slice(0, 10).map((item) => [item.name, `${item.country || 'Unknown'} / ${item.works} works`])}
          />
        </section>
      )}

      {mode === 'geo' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Research density map</CardTitle>
              <CardDescription>Country bubbles scale by works represented in the selected topic artifact.</CardDescription>
            </div>
            <Badge variant="secondary">{selected.countries.length} countries</Badge>
          </CardHeader>
          <CardContent>
            <DensityMap rows={selected.countries} />
          </CardContent>
        </Card>
      )}

      {mode === 'matrix' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Institution x subtopic matrix</CardTitle>
              <CardDescription>Compact expertise map for the top institutions and subtopics in the selected topic.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <SubtopicMatrix matrix={selected.subtopicMatrix} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function NetworkInspector({ title, rows, communities }: { title: string; rows: string[][]; communities: NetworkCommunitySummary[] }) {
  const topCommunity = communities[0]
  return (
    <Card className="inspector">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Top-ranked entities for the selected view.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="inspector-scroll">
          <div className="mini-list">
            {rows.map(([label, value]) => (
              <div className="mini-row" key={label}>
                <strong>{label}</strong>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
        {topCommunity && (
          <div className="community-summary">
            <span className="section-kicker">Dominant community</span>
            <strong>{topCommunity.label}</strong>
            <p>
              {formatNumber(topCommunity.nodeCount)} nodes, {formatNumber(topCommunity.edgeCount)} internal edges, average score {formatNumber(topCommunity.avgScore)}.
            </p>
            <div className="community-chip-row">
              {topCommunity.topNodes.slice(0, 3).map((node) => (
                <span className="community-chip" key={node.label}>
                  {node.label}
                </span>
              ))}
            </div>
          </div>
        )}
        <Accordion
          className="inspector-accordion"
          items={[
            {
              value: 'read',
              title: 'How to read this view',
              content: <p className="accordion-copy">Nodes are sized by activity or score, colors group topic communities, and edges represent repeated collaboration.</p>,
            },
            {
              value: 'caveat',
              title: 'Interpretation caveat',
              content: <p className="accordion-copy">This is a compact top-node sketch, not a full graph of every OpenAlex author or institution.</p>,
            },
          ]}
        />
      </CardContent>
    </Card>
  )
}
