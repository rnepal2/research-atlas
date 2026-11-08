import { Building2, Globe2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DensityMap } from '../components/DensityMap'
import { IntelligenceNetwork } from '../components/IntelligenceNetwork'
import { PageHeader } from '../components/PageHeader'
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
  SelectField,
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
        title="Collaboration Networks"
        description="Explore how researchers and institutions connect, and where activity is concentrated geographically."
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
              Geography
            </TabsTrigger>
          </TabsList>
        </Tabs>
        }
      />

      <div className="network-scope">
          <SelectField label="Research area" value={initialTopic.slug} options={atlas.topics.map(t=>({value:t.slug,label:t.label}))} onValueChange={slug=>updateTopic(atlas.topics.find(t=>t.slug===slug)!)}/>
          {(topicLoading || topicError) && (
            <div className="mt-3 rounded-card border border-border bg-card-soft p-3 text-[0.78rem] text-muted-foreground">
              {topicLoading ? `Loading the ${initialTopic.label} network...` : topicError}
            </div>
          )}
      </div>

      <section className="network-statline">
        <span><strong>{activeNetwork.nodes.length}</strong> nodes</span>
        <span><strong>{activeNetwork.edges.length}</strong> sampled collaboration edges</span>
        <span><strong>{activeCommunities.length}</strong> {mode === 'institutions' ? 'country groups' : 'topic groups'}</span>
        <span><strong>{geographicCountries.length}</strong> countries</span>
      </section>

      {selected && mode === 'researchers' && (
        <section className="network-stage">
          <Card className="min-h-0">
            <CardHeader>
              <div>
                <CardTitle>Researcher coauthorship</CardTitle>
                <CardDescription>Colors group topic assignments, not detected communities. Size reflects an experimental activity score.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1">
              <IntelligenceNetwork className="h-full" network={selected.network} mode="author" />
            </CardContent>
          </Card>
          <NetworkInspector
            communities={activeCommunities}
            title="Leading researchers"
            rows={selected.authors.slice(0, 10).map((author) => [author.name, `${formatNumber(author.risingScore)} score / ${author.recentWorks} recent works`])}
          />
        </section>
      )}

      {selected && mode === 'institutions' && (
        <section className="network-stage">
          <Card className="min-h-0">
            <CardHeader>
              <div>
                <CardTitle>Institution Collaboration Network</CardTitle>
                <CardDescription>Edges connect institutions that appear together on works in the selected topic.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1">
              <IntelligenceNetwork className="h-full" network={selected.institutionNetwork} mode="institution" />
            </CardContent>
          </Card>
          <NetworkInspector
            communities={activeCommunities}
            title="Leading institutions"
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
          <CardDescription>Highest-ranked entities in the selected view.</CardDescription>
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
            <span className="text-[0.68rem] font-bold uppercase text-muted-foreground">Largest displayed group</span>
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
                This is a focused view of the strongest connections, not a complete record of every author or institution.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
