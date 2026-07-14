import { ExternalLink, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  ScrollArea,
  SelectField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui'
import { useTopicDetail } from '../data/useTopicDetail'
import type { AtlasData } from '../data/types'
import { formatCompact, formatScore } from '../lib/format'

interface ResearchersPageProps {
  atlas: AtlasData
  initialTopicSlug?: string
}

const tableClass =
  'min-w-[760px] border-collapse [&_strong]:font-[650] [&_strong]:text-foreground'
const headClass =
  'sticky top-0 z-[2] h-auto border-b border-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card-solid)_96%,transparent),color-mix(in_srgb,var(--card-solid)_90%,transparent))] px-2 py-[9px] text-left text-[0.66rem] font-bold tracking-[0] text-muted-foreground uppercase backdrop-blur-[14px]'
const cellClass =
  'border-b border-border px-2 py-[9px] text-[0.79rem] leading-[1.35] whitespace-normal text-[color-mix(in_srgb,var(--foreground)_82%,var(--muted-foreground))]'
const rowClass = 'transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_5%,transparent)]'

const scorePillClass =
  'inline-flex h-[26px] min-w-11 items-center justify-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] px-[7px] text-[0.74rem] font-bold text-primary'

export function ResearchersPage({ atlas, initialTopicSlug }: ResearchersPageProps) {
  const [topicSlug, setTopicSlug] = useState(initialTopicSlug || 'all')
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('All countries')
  const [institution, setInstitution] = useState('All institutions')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const scopedTopic = useMemo(() => atlas.topics.find((topic) => topic.slug === topicSlug), [atlas.topics, topicSlug])
  const { topic: topicDetail, loading: topicLoading, error: topicError } = useTopicDetail(topicSlug === 'all' ? undefined : topicSlug, scopedTopic)
  const source = useMemo(
    () => (topicSlug === 'all' ? atlas.leaderboards.authors : topicDetail?.authors || scopedTopic?.topAuthors || []),
    [atlas.leaderboards.authors, scopedTopic?.topAuthors, topicDetail?.authors, topicSlug],
  )
  const countries = useMemo(() => ['All countries', ...new Set(source.map((author) => author.country || 'Unknown').filter(Boolean))].slice(0, 42), [source])
  const institutions = useMemo(() => ['All institutions', ...new Set(source.map((author) => author.institution).filter((name) => name && name !== 'Institution not resolved'))].slice(0, 60), [source])
  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return source
      .filter((author) => `${author.name} ${author.institution} ${author.topics.join(' ')}`.toLowerCase().includes(normalized))
      .filter((author) => country === 'All countries' || (author.country || 'Unknown') === country)
      .filter((author) => institution === 'All institutions' || author.institution === institution)
      .slice(0, 50)
  }, [source, query, country, institution])
  const selected = rows.find((author) => author.openalexId === selectedId) || rows[0]

  return (
    <div className="grid min-w-0 gap-3">
      <PageHeader
        title="Researcher Visibility"
        description="Find researchers gaining visibility across curated topics. Signals describe recent activity, not scientific quality."
      />

      <section className="flex min-w-0 items-end justify-between gap-4 max-[760px]:flex-col max-[760px]:items-stretch">
        <SelectField
          className="min-w-[260px] flex-[0_1_360px] max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:flex-none"
          label="Topic scope"
          value={topicSlug}
          onValueChange={(value) => {
            setTopicSlug(value)
            setCountry('All countries')
            setInstitution('All institutions')
            setSelectedId(null)
          }}
          options={[
            { value: 'all', label: 'All curated topics' },
            ...atlas.topics.map((topic) => ({
              value: topic.slug,
              label: topic.label,
              meta: topic.domain,
            })),
          ]}
        />
        <SelectField
          className="min-w-[180px] flex-[0_1_220px] max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:flex-none"
          label="Country"
          value={country}
          onValueChange={setCountry}
          options={countries.map((item) => ({ value: item, label: item }))}
        />
        <SelectField
          className="min-w-[220px] flex-[0_1_300px] max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:flex-none"
          label="Institution"
          value={institution}
          onValueChange={setInstitution}
          options={institutions.map((item) => ({ value: item, label: item }))}
        />
        <label className="grid min-w-[280px] flex-[0_1_430px] gap-[7px] max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:flex-none">
          <span className="min-h-0 text-[0.67rem] font-bold uppercase tracking-[0] text-muted-foreground">Search</span>
          <span className="relative min-w-0">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-[color-mix(in_srgb,var(--foreground)_58%,var(--muted-foreground))]" />
            <Input
              className="h-9 rounded-card border-border-strong bg-[color-mix(in_srgb,var(--card-solid)_90%,transparent)] pl-10 pr-3 text-[0.88rem] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_color-mix(in_srgb,var(--foreground)_8%,transparent)] placeholder:text-[color-mix(in_srgb,var(--muted-foreground)_84%,transparent)] hover:border-[color-mix(in_srgb,var(--primary)_64%,var(--border))] focus-visible:border-primary focus-visible:ring-primary/25 dark:bg-[color-mix(in_srgb,var(--card-solid)_78%,transparent)]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Researcher, institution, topic"
            />
          </span>
        </label>
      </section>

      {(topicSlug !== 'all' && (topicLoading || topicError)) && (
        <Card>
          <CardContent>
            <p className="m-0 text-[0.78rem] text-muted-foreground">{topicLoading ? `Loading ${scopedTopic?.label || 'topic'} researcher artifact...` : topicError}</p>
          </CardContent>
        </Card>
      )}

      <section className="grid grid-cols-[minmax(0,1fr)_320px] gap-2.5 max-[1160px]:grid-cols-1">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Researchers With Increasing Visibility</CardTitle>
              <CardDescription>Recent work, citation velocity, bridge signal, focus, and topic coverage.</CardDescription>
            </div>
            <Users aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[560px] w-full">
              <Table className={tableClass}>
                <TableHeader>
                  <TableRow>
                    <TableHead className={headClass}>Researcher</TableHead>
                    <TableHead className={headClass}>Institution</TableHead>
                    <TableHead className={headClass}>Topics</TableHead>
                    <TableHead className={headClass}>Recent</TableHead>
                    <TableHead className={headClass}>Citations</TableHead>
                    <TableHead className={headClass}>Bridge</TableHead>
                    <TableHead className={headClass}>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((author) => {
                    const topicsSeen = 'topicsSeen' in author && Array.isArray(author.topicsSeen) ? author.topicsSeen : author.topics
                    return (
                      <TableRow className={`${rowClass} cursor-pointer`} key={`${author.openalexId}-${author.topics.join('-')}`} onClick={() => setSelectedId(author.openalexId)}>
                        <TableCell className={cellClass}>
                          <strong>{author.name}</strong>
                          <br />
                          <span className="text-muted-foreground">{author.country || 'Unknown country'}</span>
                        </TableCell>
                        <TableCell className={cellClass}>{author.institution}</TableCell>
                        <TableCell className={cellClass}>{topicsSeen.slice(0, 3).join(', ')}</TableCell>
                        <TableCell className={cellClass}>{author.recentWorks}</TableCell>
                        <TableCell className={cellClass}>{formatCompact(author.citations)}</TableCell>
                        <TableCell className={cellClass}>{formatScore(author.bridgeScore)}</TableCell>
                        <TableCell className={cellClass}>
                          <span className={scorePillClass}>{formatScore(author.risingScore)}</span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
        {selected && (
          <Card className="self-start">
            <CardHeader>
              <div>
                <CardTitle>Visibility Evidence</CardTitle>
                <CardDescription>{selected.name}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-1.5">
                <strong className="text-[0.95rem] leading-tight">{selected.institution}</strong>
                <span className="text-[0.76rem] text-muted-foreground">{selected.country || 'Unknown country'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="rounded-card border border-border bg-card-soft p-2 text-[0.72rem] text-muted-foreground">
                  <strong className="block text-[1.18rem] text-foreground">{selected.recentWorks}</strong>
                  recent works
                </span>
                <span className="rounded-card border border-border bg-card-soft p-2 text-[0.72rem] text-muted-foreground">
                  <strong className="block text-[1.18rem] text-foreground">{formatScore(selected.risingScore)}</strong>
                  visibility
                </span>
                <span className="rounded-card border border-border bg-card-soft p-2 text-[0.72rem] text-muted-foreground">
                  <strong className="block text-[1.18rem] text-foreground">{formatScore(selected.focus * 100)}</strong>
                  topic focus
                </span>
                <span className="rounded-card border border-border bg-card-soft p-2 text-[0.72rem] text-muted-foreground">
                  <strong className="block text-[1.18rem] text-foreground">{selected.collaborationBreadth || 0}</strong>
                  institutions
                </span>
              </div>
              <div className="grid gap-1.5">
                <span className="text-[0.68rem] font-bold uppercase text-muted-foreground">Score drivers</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selected.scoreDrivers?.length ? selected.scoreDrivers : selected.topics).slice(0, 5).map((item) => (
                    <span className="rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] px-2 py-1 text-[0.7rem] font-bold text-primary" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              {selected.recentWork && <p className="m-0 text-[0.77rem] leading-[1.45] text-muted-foreground">Recent work: {selected.recentWork}</p>}
              {selected.url && (
                <a className="inline-flex items-center gap-1.5 text-[0.76rem] font-bold text-primary" href={selected.url} target="_blank" rel="noreferrer">
                  OpenAlex profile
                  <ExternalLink aria-hidden="true" size={13} />
                </a>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
