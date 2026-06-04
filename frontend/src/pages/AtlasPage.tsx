import { Activity, BookOpen, Building2, Database, Moon, ShieldCheck, Sun, Users } from 'lucide-react'
import { useMemo } from 'react'
import { DensityMap } from '../components/DensityMap'
import { FrontierCards } from '../components/FrontierCards'
import { GlobalSearch } from '../components/GlobalSearch'
import { PaperList } from '../components/PaperList'
import { RankingTable } from '../components/RankingTable'
import { TopicSelector } from '../components/TopicSelector'
import { TrendChart } from '../components/TrendChart'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui'
import { useTopicDetail } from '../data/useTopicDetail'
import type { AtlasData, TopicProfile, TopicSummary } from '../data/types'
import { formatCompact, formatNumber, formatPercent, formatScore } from '../lib/format'
import { navigate } from '../lib/router'

interface AtlasPageProps {
  atlas: AtlasData
  initialTopicSlug?: string
  theme: 'dark' | 'light'
  onThemeChange: () => void
}

function Metric({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof BookOpen }) {
  return (
    <Card className="bg-[linear-gradient(145deg,var(--card-soft),transparent_58%),var(--card)]">
      <CardContent className="min-h-[108px]">
        <div className="flex items-center justify-between gap-2.5 text-[0.73rem] font-semibold text-muted-foreground [&_svg]:size-[18px] [&_svg]:text-[color-mix(in_srgb,var(--foreground)_62%,transparent)]">
          <span>{label}</span>
          <Icon aria-hidden="true" />
        </div>
        <div className="my-2.5 mb-1 font-ui text-[clamp(1.38rem,2vw,1.92rem)] leading-none font-[720]">{value}</div>
        <div className="text-[0.74rem] text-muted-foreground">{note}</div>
      </CardContent>
    </Card>
  )
}

function topicSkeleton(topic: TopicSummary): TopicProfile {
  const papers = topic.topPapers || []
  return {
    ...topic,
    openalexTopicIds: [],
    keywordQueries: [],
    insightSections: [],
    yearlyMetrics: [],
    subtopics: topic.topSubtopics || [],
    subtopicSeries: [],
    authors: topic.topAuthors || [],
    institutions: topic.topInstitutions || [],
    countries: topic.topCountries || [],
    papers,
    paperCollections: {
      recentImpact: papers,
      mostCited: papers,
      newest: papers,
      reviews: papers,
      bridgePapers: papers,
    },
    network: { nodes: [], edges: [] },
    institutionNetwork: { nodes: [], edges: [] },
    networkCommunities: { authors: [], institutions: [] },
    subtopicMatrix: { columns: [], rows: [] },
    frontierCards: [],
  }
}

export function AtlasPage({ atlas, initialTopicSlug, theme, onThemeChange }: AtlasPageProps) {
  const initialTopic = useMemo(
    () => atlas.topics.find((topic) => topic.slug === initialTopicSlug) || atlas.trending.map((item) => atlas.topics.find((topic) => topic.slug === item.slug)).find(Boolean) || atlas.topics[0],
    [atlas, initialTopicSlug],
  ) as TopicSummary
  const { topic, loading: topicLoading, error: topicError } = useTopicDetail(initialTopic?.slug, initialTopic)
  const selected = topic || topicSkeleton(initialTopic)
  const paperCollections = [
    ['recentImpact', 'Recent Impact', selected.paperCollections?.recentImpact || selected.papers],
    ['mostCited', 'Most Cited', selected.paperCollections?.mostCited || selected.papers],
    ['newest', 'Newest', selected.paperCollections?.newest || selected.papers],
    ['reviews', 'Reviews', selected.paperCollections?.reviews || selected.papers],
    ['bridgePapers', 'Bridge Papers', selected.paperCollections?.bridgePapers || selected.papers],
  ] as const

  function updateTopic(topic: TopicSummary) {
    navigate(`/topic/${topic.slug}`)
  }

  return (
    <div className="grid min-w-0 gap-3">
      <section className="flex min-w-0 items-start justify-between gap-[18px] max-[760px]:flex-col max-[760px]:items-stretch">
        <div className="min-w-0">
          <h1 className="m-0 font-display text-[clamp(1.7rem,2.08vw,1.9rem)] leading-[1.2] font-[740] tracking-[0]">Research Atlas</h1>
          <p className="mt-2 mb-0 max-w-[820px] text-[0.91rem] leading-[1.55] text-muted-foreground [overflow-wrap:anywhere]">
            Explore OpenAlex domains, fields, subfields, and topic profiles through static intelligence artifacts:
            momentum, expertise, geography, papers, and collaboration structure.
          </p>
        </div>
        <div className="flex min-w-[min(620px,48vw)] flex-[0_1_620px] items-start justify-end gap-2.5 max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:flex-none max-[760px]:flex-col">
          <GlobalSearch atlas={atlas} />
          <div className="inline-flex shrink-0 items-center gap-2.5 max-[760px]:w-full max-[760px]:justify-start">
            <a
              className="inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-card border border-border bg-card px-[11px] text-[0.78rem] font-bold text-muted-foreground max-[760px]:w-[38px] max-[760px]:justify-center max-[760px]:px-0 [&_svg]:size-4"
              href={atlas.source.url}
              target="_blank"
              rel="noreferrer"
            >
              <Database aria-hidden="true" />
              <span className="max-[760px]:hidden">Go to OpenAlex</span>
            </a>
            <Button variant="outline" size="icon" onClick={onThemeChange} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </Button>
          </div>
        </div>
      </section>

      <Card className="border-border-strong bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_9%,transparent),transparent_60%),var(--card)]">
        <CardHeader>
          <div>
            <CardTitle>Topics navigator</CardTitle>
            <CardDescription>
              Select by domain, field, and topic profile. New topics can be added by extending the YAML config.
            </CardDescription>
          </div>
          <Badge variant="default">{selected.workArea}</Badge>
        </CardHeader>
        <CardContent>
          <TopicSelector atlas={atlas} selected={selected} onChange={updateTopic} />
          {(topicLoading || topicError) && (
            <div className="mt-3 rounded-card border border-border bg-card-soft p-3 text-[0.78rem] text-muted-foreground">
              {topicLoading ? `Loading ${selected.label} detail artifact...` : topicError}
            </div>
          )}
          <div className="mt-3 grid grid-cols-4 gap-2.5 max-[1160px]:grid-cols-2 max-[760px]:grid-cols-1">
            <div className="grid gap-1 rounded-card border border-border bg-card-soft p-2.5">
              <span className="text-[0.66rem] font-bold uppercase text-muted-foreground">Snapshot quality</span>
              <strong className="text-[1.25rem] leading-none text-foreground">{formatScore(selected.quality?.dataCompletenessScore ?? 0)}</strong>
            </div>
            <div className="grid gap-1 rounded-card border border-border bg-card-soft p-2.5">
              <span className="text-[0.66rem] font-bold uppercase text-muted-foreground">Works collected</span>
              <strong className="text-[1.25rem] leading-none text-foreground">{formatNumber(selected.quality?.worksCollected ?? selected.metrics.worksLast5Years)}</strong>
            </div>
            <div className="grid gap-1 rounded-card border border-border bg-card-soft p-2.5">
              <span className="text-[0.66rem] font-bold uppercase text-muted-foreground">Country resolution</span>
              <strong className="text-[1.25rem] leading-none text-foreground">{formatPercent(selected.quality?.countryResolutionRate ?? 0)}</strong>
            </div>
            <div className="grid gap-1 rounded-card border border-border bg-card-soft p-2.5">
              <span className="text-[0.66rem] font-bold uppercase text-muted-foreground">Latest year</span>
              <strong className="text-[1.25rem] leading-none text-foreground">{selected.quality?.latestPublicationYear || 'n/a'}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-4 gap-2.5 max-[1160px]:grid-cols-2 max-[760px]:grid-cols-1">
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

      <section className="grid grid-cols-[minmax(0,1.34fr)_minmax(400px,0.86fr)] gap-2.5 max-[1160px]:grid-cols-1">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{selected.label} activity trend</CardTitle>
              <CardDescription>
                {selected.domain} / {selected.field} / {selected.subfield}
              </CardDescription>
            </div>
            <Badge variant="secondary">{formatNumber(selected.papers.length)} selected papers</Badge>
          </CardHeader>
          <CardContent className="pt-2">
            <TrendChart rows={selected.yearlyMetrics} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Geographic density</CardTitle>
              <CardDescription>Country-level institutional activity from work authorships.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <DensityMap rows={selected.countries} />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-2.5 max-[1160px]:grid-cols-1">
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

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Topic intelligence signals</CardTitle>
            <CardDescription>Rule-based explanations generated from the OpenAlex snapshot.</CardDescription>
          </div>
          <ShieldCheck aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <FrontierCards cards={selected.insights?.length ? selected.insights : selected.frontierCards} columns={3} />
        </CardContent>
      </Card>

      {selected.insightSections?.length ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Analyst brief</CardTitle>
              <CardDescription>Structured evidence across momentum, people, institutions, geography, papers, networks, and quality.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue={selected.insightSections[0]?.key} className="border-t border-border">
              {selected.insightSections.map((section) => (
                <AccordionItem value={section.key} key={section.key} className="border-b border-border">
                  <AccordionTrigger className="min-h-[46px] py-0 text-[0.84rem] hover:no-underline">{section.title}</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-3 gap-2.5 pt-1 max-[1160px]:grid-cols-1">
                      {section.items.map((item) => (
                        <div className="grid gap-1.5 rounded-card border border-border bg-card-soft p-3" key={`${section.key}-${item.label}`}>
                          <span className="text-[0.66rem] font-bold uppercase text-muted-foreground">{item.label}</span>
                          <strong className="line-clamp-2 text-[0.94rem] leading-tight text-foreground">{item.value}</strong>
                          <p className="m-0 text-[0.74rem] leading-[1.45] text-muted-foreground">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Paper Lens</CardTitle>
            <CardDescription>Recent impact, most cited, newest, review, and bridge-paper collections.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recentImpact">
            <TabsList className="mb-3 flex-wrap">
              {paperCollections.map(([key, label]) => (
                <TabsTrigger className="text-[0.76rem]" value={key} key={key}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {paperCollections.map(([key, , papers]) => (
              <TabsContent value={key} key={key}>
                <PaperList papers={papers} limit={8} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
