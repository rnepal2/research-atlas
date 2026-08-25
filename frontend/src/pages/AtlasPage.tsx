import { Activity, BookOpen, Building2, Moon, ShieldCheck, Sun, Users } from 'lucide-react'
import { useMemo } from 'react'
import { DensityMap } from '../components/DensityMap'
import { FrontierCards } from '../components/FrontierCards'
import { GlobalSearch } from '../components/GlobalSearch'
import { MetricCard } from '../components/MetricCard'
import { PageHeader } from '../components/PageHeader'
import { PaperList } from '../components/PaperList'
import { RankingTable } from '../components/RankingTable'
import { TopicSelector } from '../components/TopicSelector'
import { TrendChart } from '../components/TrendChart'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui'
import { useTopicDetail } from '../data/useTopicDetail'
import { getDefaultTopic } from '../data/topicSelection'
import type { AtlasData, TopicProfile, TopicSummary } from '../data/types'
import { formatCompact, formatNumber, formatPercent, formatScore } from '../lib/format'
import { navigate } from '../lib/router'

interface AtlasPageProps {
  atlas: AtlasData
  initialTopicSlug?: string
  theme: 'dark' | 'light'
  onThemeChange: () => void
}

function topicSkeleton(topic: TopicSummary): TopicProfile {
  const papers = topic.topPapers || []
  return {
    ...topic,
    openalexTopicIds: [],
    keywordQueries: [],
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
    () =>
      atlas.topics.find((topic) => topic.slug === initialTopicSlug) ||
      getDefaultTopic(atlas, { domain: 'Health Sciences' }) ||
      atlas.topics[0],
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
      <PageHeader
        title="Research Atlas"
        description="Explore how research topics are changing—across publications, researchers, institutions, geography, and collaboration."
        actionsClassName="min-w-[min(620px,48vw)] flex-[0_1_620px] max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:flex-none"
        actions={
          <div className="flex items-start justify-end gap-2 max-[760px]:w-full max-[760px]:flex-col">
          <GlobalSearch atlas={atlas} />
          <div className="inline-flex shrink-0 items-center gap-2 max-[760px]:w-full max-[760px]:justify-start">
            <Button variant="outline" size="icon" onClick={onThemeChange} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </Button>
          </div>
        </div>
        }
      />

      <Card className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_3%,transparent),transparent_60%),var(--card)]">
        <CardHeader>
          <div>
            <CardTitle>Topic Navigator</CardTitle>
            <CardDescription>Choose a research domain, field, and topic. Indicators below describe the selected topic, not a domain total.</CardDescription>
          </div>
          <Badge variant="secondary">{selected.workArea}</Badge>
        </CardHeader>
        <CardContent>
          <TopicSelector key={selected.slug} atlas={atlas} selected={selected} onChange={updateTopic} />
          {(topicLoading || topicError) && (
            <div className="mt-3 rounded-card border border-border bg-card-soft p-3 text-[0.78rem] text-muted-foreground">
              {topicLoading ? `Loading the ${selected.label} topic profile...` : topicError}
            </div>
          )}
          <div className="mt-3 grid grid-cols-4 gap-2.5 max-[1160px]:grid-cols-2 max-[760px]:grid-cols-1">
            <div className="grid gap-1 rounded-card border border-border bg-card-soft p-2.5">
              <span className="text-[0.66rem] font-bold uppercase text-muted-foreground">Data coverage</span>
              <strong className="text-[1.25rem] leading-none text-foreground">{formatScore(selected.quality?.dataCompletenessScore ?? 0)}</strong>
            </div>
            <div className="grid gap-1 rounded-card border border-border bg-card-soft p-2.5">
              <span className="text-[0.66rem] font-bold uppercase text-muted-foreground">Sampled works</span>
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

      <section className="grid grid-cols-4 gap-2 max-[1160px]:grid-cols-2 max-[760px]:grid-cols-1">
        <MetricCard
          label="Works (2023–2025)"
          value={formatNumber(selected.metrics.worksLast3Years)}
          note={`${formatNumber(selected.metrics.worksLast5Years)} across 2021–2025`}
          icon={BookOpen}
        />
        <MetricCard
          label="Momentum"
          value={formatScore(selected.metrics.trendScore)}
          note={`${formatPercent(selected.metrics.growthRate)} growth vs prior`}
          icon={Activity}
        />
        <MetricCard
          label="Authors in sample"
          value={formatCompact(selected.metrics.activeAuthors)}
          note={`${formatPercent(selected.metrics.newAuthorShare)} new-author share`}
          icon={Users}
        />
        <MetricCard
          label="Institutions in sample"
          value={formatNumber(selected.metrics.activeInstitutions)}
          note={`Concentration ${formatScore(selected.metrics.concentrationScore)}`}
          icon={Building2}
        />
      </section>

      <section className="grid grid-cols-[minmax(0,1.34fr)_minmax(400px,0.86fr)] gap-2 max-[1160px]:grid-cols-1">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{selected.label} Activity Trend</CardTitle>
              <CardDescription>
                Annual matched works for this topic; {new Date().getFullYear()} is year to date.
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
              <CardTitle>Geographic Density</CardTitle>
              <CardDescription>Country fill represents activity found in work authorships.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <DensityMap rows={selected.countries} />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-2 max-[1160px]:grid-cols-1">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Researchers with Recent Topic Activity</CardTitle>
              <CardDescription>At least two recent sampled works; cited-work impact is fractional across coauthors, and new work may not yet be cited.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <RankingTable type="authors" rows={selected.authors} limit={8} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Institution Strengths</CardTitle>
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
            <CardTitle>Topic Insights</CardTitle>
            <CardDescription>Concise explanations of the strongest patterns in the current data.</CardDescription>
          </div>
          <ShieldCheck aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <FrontierCards cards={selected.insights?.length ? selected.insights : selected.frontierCards} columns={3} />
        </CardContent>
      </Card>

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
