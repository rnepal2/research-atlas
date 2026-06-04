import { Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
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
  const rows = useMemo(() => {
    const source = topicSlug === 'all' ? atlas.leaderboards.authors : atlas.topics.find((topic) => topic.slug === topicSlug)?.authors || []
    const normalized = query.trim().toLowerCase()
    return source
      .filter((author) => `${author.name} ${author.institution} ${author.topics.join(' ')}`.toLowerCase().includes(normalized))
      .slice(0, 50)
  }, [atlas, topicSlug, query])

  return (
    <div className="grid min-w-0 gap-3">
      <section className="flex min-w-0 items-start justify-between gap-[18px] max-[760px]:flex-col max-[760px]:items-stretch">
        <div className="min-w-0">
          <h1 className="m-0 font-display text-[clamp(1.7rem,2.08vw,1.9rem)] leading-[1.2] font-[740] tracking-[0]">Researcher Visibility</h1>
          <p className="mt-2 mb-0 max-w-[820px] text-[0.91rem] leading-[1.55] text-muted-foreground [overflow-wrap:anywhere]">
            A discovery surface for researchers gaining visibility across selected OpenAlex topics. This is not a quality ranking.
          </p>
        </div>
      </section>

      <section className="flex min-w-0 items-end justify-between gap-4 max-[760px]:flex-col max-[760px]:items-stretch">
        <SelectField
          className="min-w-[260px] flex-[0_1_360px] max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:flex-none"
          label="Topic scope"
          value={topicSlug}
          onValueChange={setTopicSlug}
          options={[
            { value: 'all', label: 'All curated topics' },
            ...atlas.topics.map((topic) => ({
              value: topic.slug,
              label: topic.label,
              meta: topic.domain,
            })),
          ]}
        />
        <label className="grid min-w-[280px] flex-[0_1_430px] gap-[7px] max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:flex-none">
          <span className="min-h-0 text-[0.67rem] font-bold uppercase tracking-[0] text-muted-foreground">Search</span>
          <span className="relative min-w-0">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Researcher, institution, topic" />
          </span>
        </label>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Researchers with increasing visibility</CardTitle>
            <CardDescription>Recent works, citation velocity, bridge signal, topic focus, and topic coverage.</CardDescription>
          </div>
          <Users aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[620px] w-full">
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
                    <TableRow className={rowClass} key={`${author.openalexId}-${author.topics.join('-')}`}>
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
    </div>
  )
}
