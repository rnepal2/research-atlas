import { Building2, Globe2, Rows3, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DensityMap } from '../components/DensityMap'
import { IntelligenceNetwork } from '../components/IntelligenceNetwork'
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
  ScrollArea,
  Tabs,
  TabsList,
  TabsTrigger,
} from '../components/ui'
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
  const geographicCountries = selected.countries.filter((country) => country.country !== 'Unknown')

  function updateTopic(topic: TopicProfile) {
    setSelected(topic)
    navigate(`/topic/${topic.slug}/network`)
  }

  return (
    <div className="grid min-w-0 gap-3">
      <section className="flex min-w-0 items-start justify-between gap-[18px] max-[760px]:flex-col max-[760px]:items-stretch">
        <div className="min-w-0">
          <h1 className="m-0 font-display text-[clamp(1.7rem,2.08vw,1.9rem)] leading-[1.2] font-[740] tracking-[0]">Collaboration Intelligence</h1>
          <p className="mt-2 mb-0 max-w-[820px] text-[0.91rem] leading-[1.55] text-muted-foreground [overflow-wrap:anywhere]">
            Switch between researcher networks, institution collaboration, geographic density, and institution-subtopic matrices.
          </p>
        </div>
        <Tabs value={mode} onValueChange={setMode} className="shrink-0 max-[760px]:w-full">
          <TabsList className="flex-nowrap border border-border bg-muted max-[760px]:w-full">
            <TabsTrigger value="researchers" className="px-2.5 text-[0.76rem]">
              Researchers
            </TabsTrigger>
            <TabsTrigger value="institutions" className="px-2.5 text-[0.76rem]">
              Institutions
            </TabsTrigger>
            <TabsTrigger value="geo" className="px-2.5 text-[0.76rem]">
              Geo Density
            </TabsTrigger>
            <TabsTrigger value="matrix" className="px-2.5 text-[0.76rem]">
              Matrix
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      <Card className="border-border-strong bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_9%,transparent),transparent_60%),var(--card)]">
        <CardContent>
          <TopicSelector atlas={atlas} selected={selected} onChange={updateTopic} />
        </CardContent>
      </Card>

      <section className="grid grid-cols-4 gap-2.5 max-[1160px]:grid-cols-2 max-[760px]:grid-cols-1">
        <Card className="bg-[linear-gradient(145deg,var(--card-soft),transparent_58%),var(--card)]">
          <CardContent className="min-h-[108px]">
            <div className="flex items-center justify-between gap-2.5 text-[0.73rem] font-semibold text-muted-foreground [&_svg]:size-[18px] [&_svg]:text-[color-mix(in_srgb,var(--foreground)_62%,transparent)]">
              <span>{mode === 'institutions' ? 'Institution nodes' : 'Researcher nodes'}</span>
              <Users aria-hidden="true" />
            </div>
            <div className="my-2.5 mb-1 font-ui text-[clamp(1.38rem,2vw,1.92rem)] leading-none font-[720]">{formatNumber(activeNetwork.nodes.length)}</div>
            <div className="text-[0.74rem] text-muted-foreground">{formatNumber(activeNetwork.edges.length)} collaboration edges</div>
          </CardContent>
        </Card>
        <Card className="bg-[linear-gradient(145deg,var(--card-soft),transparent_58%),var(--card)]">
          <CardContent className="min-h-[108px]">
            <div className="flex items-center justify-between gap-2.5 text-[0.73rem] font-semibold text-muted-foreground [&_svg]:size-[18px] [&_svg]:text-[color-mix(in_srgb,var(--foreground)_62%,transparent)]">
              <span>Communities</span>
              <Building2 aria-hidden="true" />
            </div>
            <div className="my-2.5 mb-1 font-ui text-[clamp(1.38rem,2vw,1.92rem)] leading-none font-[720]">{formatNumber(activeCommunities.length)}</div>
            <div className="text-[0.74rem] text-muted-foreground">Cluster summaries in active mode</div>
          </CardContent>
        </Card>
        <Card className="bg-[linear-gradient(145deg,var(--card-soft),transparent_58%),var(--card)]">
          <CardContent className="min-h-[108px]">
            <div className="flex items-center justify-between gap-2.5 text-[0.73rem] font-semibold text-muted-foreground [&_svg]:size-[18px] [&_svg]:text-[color-mix(in_srgb,var(--foreground)_62%,transparent)]">
              <span>Countries</span>
              <Globe2 aria-hidden="true" />
            </div>
            <div className="my-2.5 mb-1 font-ui text-[clamp(1.38rem,2vw,1.92rem)] leading-none font-[720]">{formatNumber(geographicCountries.length)}</div>
            <div className="text-[0.74rem] text-muted-foreground">Authorship-country density</div>
          </CardContent>
        </Card>
        <Card className="bg-[linear-gradient(145deg,var(--card-soft),transparent_58%),var(--card)]">
          <CardContent className="min-h-[108px]">
            <div className="flex items-center justify-between gap-2.5 text-[0.73rem] font-semibold text-muted-foreground [&_svg]:size-[18px] [&_svg]:text-[color-mix(in_srgb,var(--foreground)_62%,transparent)]">
              <span>Matrix cells</span>
              <Rows3 aria-hidden="true" />
            </div>
            <div className="my-2.5 mb-1 font-ui text-[clamp(1.38rem,2vw,1.92rem)] leading-none font-[720]">{formatNumber(selected.subtopicMatrix.rows.length * selected.subtopicMatrix.columns.length)}</div>
            <div className="text-[0.74rem] text-muted-foreground">Institution x subtopic activity</div>
          </CardContent>
        </Card>
      </section>

      {mode === 'researchers' && (
        <section className="grid grid-cols-[minmax(0,1fr)_318px] gap-2.5 max-[1160px]:grid-cols-1">
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
        <section className="grid grid-cols-[minmax(0,1fr)_318px] gap-2.5 max-[1160px]:grid-cols-1">
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
            <Badge variant="secondary">{geographicCountries.length} countries</Badge>
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
    <Card className="self-start">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Top-ranked entities for the selected view.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <ScrollArea className="h-[332px]">
          <div className="grid gap-0">
            {rows.map(([label, value]) => (
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(96px,0.85fr)] items-start gap-3 border-b border-border py-[9px] last:border-b-0" key={label}>
                <strong className="text-[0.8rem] leading-[1.3]">{label}</strong>
                <span className="text-[0.72rem] leading-[1.35] text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
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
            <AccordionTrigger className="min-h-[42px] py-0 text-[0.82rem] hover:no-underline">How to read this view</AccordionTrigger>
            <AccordionContent>
              <p className="m-0 text-[0.78rem] leading-[1.5] text-muted-foreground">
                Nodes are sized by activity or score, colors group topic communities, and edges represent repeated collaboration.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="caveat" className="border-b border-border">
            <AccordionTrigger className="min-h-[42px] py-0 text-[0.82rem] hover:no-underline">Interpretation caveat</AccordionTrigger>
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
