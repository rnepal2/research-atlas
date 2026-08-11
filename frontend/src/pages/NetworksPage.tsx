import { Building2, Globe2, Rows3, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DensityMap } from '../components/DensityMap'
import { IntelligenceNetwork } from '../components/IntelligenceNetwork'
import { MetricCard } from '../components/MetricCard'
import { PageHeader } from '../components/PageHeader'
import { SubtopicMatrix } from '../components/SubtopicMatrix'
import { TopicSelector } from '../components/TopicSelector'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataRegion,
  Tabs,
  TabsList,
  TabsTrigger,
} from '../components/ui'
import { useTopicDetail } from '../data/useTopicDetail'
import type { AtlasData, NetworkCommunitySummary, TopicSummary } from '../data/types'
import { formatNumber } from '../lib/format'
import { navigate } from '../lib/router'

interface NetworksPageProps {
  atlas: AtlasData
  initialTopicSlug?: string
}

export function NetworksPage({ atlas, initialTopicSlug }: NetworksPageProps) {
  const initialTopic = useMemo(() => atlas.topics.find((topic) => topic.slug === initialTopicSlug) || atlas.topics[0], [atlas.topics, initialTopicSlug])
  const { topic: selected, loading: topicLoading, error: topicError } = useTopicDetail(initialTopic?.slug, initialTopic)
  const [mode, setMode] = useState('researchers')
  const activeNetwork = selected ? (mode === 'institutions' ? selected.institutionNetwork : selected.network) : { nodes: [], edges: [] }
  const activeCommunities = selected ? (mode === 'institutions' ? selected.networkCommunities.institutions : selected.networkCommunities.authors) : []
  const geographicCountries = selected ? selected.countries.filter((country) => country.country !== 'Unknown') : []

  function updateTopic(topic: TopicSummary) {
    navigate(`/topic/${topic.slug}/network`)
  }

  return (
    <div className="grid min-w-0 gap-3">
      <PageHeader
        title="Collaboration Intelligence"
        description="Explore researcher and institution networks, geographic activity, and subtopic expertise."
        actionsClassName="max-[760px]:w-full"
        actions={
          <Tabs value={mode} onValueChange={setMode} className="max-[760px]:w-full">
          <TabsList className="flex-nowrap max-[760px]:w-full">
            <TabsTrigger value="researchers">
              <Users aria-hidden="true" />
              Researchers
            </TabsTrigger>
            <TabsTrigger value="institutions">
              <Building2 aria-hidden="true" />
              Institutions
            </TabsTrigger>
            <TabsTrigger value="geo">
              <Globe2 aria-hidden="true" />
              Geo Density
            </TabsTrigger>
            <TabsTrigger value="matrix">
              <Rows3 aria-hidden="true" />
              Matrix
            </TabsTrigger>
          </TabsList>
        </Tabs>
        }
      />

      <Card className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_9%,transparent),transparent_60%),var(--card)] ring-border-strong">
        <CardContent>
          <TopicSelector atlas={atlas} selected={selected || initialTopic} onChange={updateTopic} />
          {(topicLoading || topicError) && (
            <div className="mt-3 rounded-card border border-border bg-card-soft p-3 text-[0.78rem] text-muted-foreground">
              {topicLoading ? `Loading ${initialTopic.label} network artifact...` : topicError}
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid grid-cols-4 gap-2 max-[1160px]:grid-cols-2 max-[480px]:grid-cols-1">
        <MetricCard
          label={mode === 'institutions' ? 'Institution nodes' : 'Researcher nodes'}
          value={formatNumber(activeNetwork.nodes.length)}
          note={`${formatNumber(activeNetwork.edges.length)} collaboration edges`}
          icon={Users}
          compact
        />
        <MetricCard compact label="Communities" value={formatNumber(activeCommunities.length)} note="Clusters in the active view" icon={Building2} />
        <MetricCard compact label="Countries" value={formatNumber(geographicCountries.length)} note="Authorship-country activity" icon={Globe2} />
        <MetricCard
          label="Matrix cells"
          value={formatNumber(selected ? selected.subtopicMatrix.rows.length * selected.subtopicMatrix.columns.length : 0)}
          note="Institution x subtopic activity"
          icon={Rows3}
          compact
        />
      </section>

      {selected && mode === 'researchers' && (
        <section className="grid h-[clamp(25rem,calc(100dvh-19rem),44rem)] grid-cols-[minmax(0,1fr)_300px] gap-2 max-[1160px]:h-auto max-[1160px]:grid-cols-1">
          <Card className="min-h-0">
            <CardHeader>
              <div>
                <CardTitle>Researcher Coauthorship Communities</CardTitle>
                <CardDescription>Cluster hulls use OpenAlex topic labels; node size follows rising visibility.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1">
              <IntelligenceNetwork className="h-full" network={selected.network} mode="author" />
            </CardContent>
          </Card>
          <NetworkInspector
            communities={activeCommunities}
            title="Bridge researchers"
            rows={selected.authors.slice(0, 10).map((author) => [author.name, `${formatNumber(author.risingScore)} visibility / ${author.recentWorks} recent`])}
          />
        </section>
      )}

      {selected && mode === 'institutions' && (
        <section className="grid h-[clamp(25rem,calc(100dvh-19rem),44rem)] grid-cols-[minmax(0,1fr)_300px] gap-2 max-[1160px]:h-auto max-[1160px]:grid-cols-1">
          <Card className="min-h-0">
            <CardHeader>
              <div>
                <CardTitle>Institution Collaboration Network</CardTitle>
                <CardDescription>Edges connect institutions appearing together on works in the selected topic artifact.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1">
              <IntelligenceNetwork className="h-full" network={selected.institutionNetwork} mode="institution" />
            </CardContent>
          </Card>
          <NetworkInspector
            communities={activeCommunities}
            title="Institution hubs"
            rows={selected.institutions.slice(0, 10).map((item) => [item.name, `${item.country || 'Unknown'} / ${item.works} works`])}
          />
        </section>
      )}

      {selected && mode === 'geo' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Research Density Map</CardTitle>
              <CardDescription>Country fill represents work authorships in the selected topic.</CardDescription>
            </div>
            <Badge variant="secondary">{geographicCountries.length} countries</Badge>
          </CardHeader>
          <CardContent>
            <DensityMap rows={selected.countries} />
          </CardContent>
        </Card>
      )}

      {selected && mode === 'matrix' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Institution x Subtopic Matrix</CardTitle>
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
    <Card className="h-full min-h-0 self-start max-[1160px]:h-auto">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Top-ranked entities for the selected view.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pr-2.5">
        <DataRegion density="compact" className="shrink-0">
          <div className="grid gap-0">
            {rows.map(([label, value]) => (
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(96px,0.85fr)] items-start gap-3 border-b border-border py-[9px] last:border-b-0" key={label}>
                <strong className="text-[0.8rem] leading-[1.3]">{label}</strong>
                <span className="text-[0.72rem] leading-[1.35] text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </DataRegion>
        {topCommunity && (
          <div className="grid gap-[7px] rounded-card border border-border bg-card-soft p-3">
            <span className="text-[0.68rem] font-bold uppercase text-muted-foreground">Dominant community</span>
            <strong className="font-display text-base font-[720]">{topCommunity.label}</strong>
            <p className="m-0 text-[0.75rem] leading-[1.4] text-muted-foreground">
              {formatNumber(topCommunity.nodeCount)} nodes, {formatNumber(topCommunity.edgeCount)} internal edges, average score {formatNumber(topCommunity.avgScore)}.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {topCommunity.topNodes.slice(0, 3).map((node) => (
                <span className="min-h-[22px] max-w-full rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] px-[7px] py-[3px] text-[0.68rem] font-bold text-primary" key={node.label}>
                  {node.label}
                </span>
              ))}
            </div>
          </div>
        )}
        <Accordion type="single" collapsible className="mt-0.5 border-t border-border">
          <AccordionItem value="read" className="border-b border-border">
            <AccordionTrigger className="text-[0.82rem] hover:no-underline">How to read this view</AccordionTrigger>
            <AccordionContent>
              <p className="m-0 text-[0.78rem] leading-[1.5] text-muted-foreground">
                Nodes are sized by activity or score, colors group topic communities, and edges represent repeated collaboration.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="caveat" className="border-b border-border">
            <AccordionTrigger className="text-[0.82rem] hover:no-underline">Interpretation caveat</AccordionTrigger>
            <AccordionContent>
              <p className="m-0 text-[0.78rem] leading-[1.5] text-muted-foreground">
                This is a compact top-node sketch, not a full graph of every OpenAlex author or institution.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
