import { ExternalLink, Search, Users } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  DataRegion,
  Field,
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

import { dataTableStyles } from '../components/ui/data-table-styles'

const { head: headClass, cell: cellClass, row: rowClass, scorePill: scorePillClass } = dataTableStyles
const tableClass = 'min-w-[640px] table-fixed border-collapse [&_strong]:font-[650] [&_strong]:text-foreground'

export function ResearchersPage({ atlas, initialTopicSlug }: ResearchersPageProps) {
  const [topicSlug, setTopicSlug] = useState(initialTopicSlug || 'all')
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('All countries')
  const [institution, setInstitution] = useState('All institutions')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const searchLabelId = useId()
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

      <section className="grid min-w-0 grid-cols-[minmax(220px,1.2fr)_minmax(150px,0.7fr)_minmax(190px,0.9fr)_minmax(240px,1.1fr)] items-end gap-3 max-[900px]:grid-cols-2 max-[760px]:grid-cols-1">
        <SelectField
          className="min-w-0"
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
          className="min-w-0"
          label="Country"
          value={country}
          onValueChange={setCountry}
          options={countries.map((item) => ({ value: item, label: item }))}
        />
        <SelectField
          className="min-w-0"
          label="Institution"
          value={institution}
          onValueChange={setInstitution}
          options={institutions.map((item) => ({ value: item, label: item }))}
        />
        <Field className="min-w-0" label="Search" labelId={searchLabelId}>
          <span className="relative min-w-0">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-[color-mix(in_srgb,var(--foreground)_58%,var(--muted-foreground))]" />
            <Input
              className="pl-10 pr-3 text-[0.88rem] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_color-mix(in_srgb,var(--foreground)_8%,transparent)] placeholder:text-[color-mix(in_srgb,var(--muted-foreground)_84%,transparent)]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Researcher, institution, topic"
              aria-labelledby={searchLabelId}
            />
          </span>
        </Field>
      </section>

      {(topicSlug !== 'all' && (topicLoading || topicError)) && (
        <Card>
          <CardContent>
            <p className="m-0 text-[0.78rem] text-muted-foreground">{topicLoading ? `Loading ${scopedTopic?.label || 'topic'} researcher artifact...` : topicError}</p>
          </CardContent>
        </Card>
      )}

      <section className="grid grid-cols-[minmax(0,1fr)_292px] gap-2.5 max-[1160px]:grid-cols-1">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Researchers With Increasing Visibility</CardTitle>
              <CardDescription>Recent work, citation velocity, bridge signal, focus, and topic coverage.</CardDescription>
            </div>
            <Users aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <DataRegion density="page">
              <Table className={tableClass}>
                <TableHeader>
                  <TableRow>
                    <TableHead className={`${headClass} w-[22%]`}>Researcher</TableHead>
                    <TableHead className={`${headClass} w-[22%]`}>Institution</TableHead>
                    <TableHead className={`${headClass} w-[30%]`}>Topics</TableHead>
                    <TableHead className={headClass}>Recent</TableHead>
                    <TableHead className={headClass}>Citations</TableHead>
                    <TableHead className={`${headClass} max-[1380px]:hidden`}>Bridge</TableHead>
                    <TableHead className={headClass}>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((author) => {
                    const topicsSeen = 'topicsSeen' in author && Array.isArray(author.topicsSeen) ? author.topicsSeen : author.topics
                    return (
                      <TableRow
                        aria-selected={selected?.openalexId === author.openalexId}
                        className={`${rowClass} cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary`}
                        key={`${author.openalexId}-${author.topics.join('-')}`}
                        onClick={() => setSelectedId(author.openalexId)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelectedId(author.openalexId)
                          }
                        }}
                        tabIndex={0}
                      >
                        <TableCell className={cellClass}>
                          <strong>{author.name}</strong>
                          <br />
                          <span className="text-muted-foreground">{author.country || 'Unknown country'}</span>
                        </TableCell>
                        <TableCell className={cellClass}>{author.institution}</TableCell>
                        <TableCell className={cellClass}>{topicsSeen.slice(0, 3).join(', ')}</TableCell>
                        <TableCell className={cellClass}>{author.recentWorks}</TableCell>
                        <TableCell className={cellClass}>{formatCompact(author.citations)}</TableCell>
                        <TableCell className={`${cellClass} max-[1380px]:hidden`}>{formatScore(author.bridgeScore)}</TableCell>
                        <TableCell className={cellClass}>
                          <span className={scorePillClass}>{formatScore(author.risingScore)}</span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </DataRegion>
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
