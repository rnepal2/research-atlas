import { Activity, ArrowUpRight, Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { formatNumber, formatPercent, formatScore } from '../lib/format'
import { navigate } from '../lib/router'

interface TrendingPageProps {
  atlas: AtlasData
}

const tableClass =
  'min-w-[1040px] border-collapse [&_strong]:font-[650] [&_strong]:text-foreground'
const headClass =
  'sticky top-0 z-[2] h-auto border-b border-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card-solid)_96%,transparent),color-mix(in_srgb,var(--card-solid)_90%,transparent))] px-2 py-[9px] text-left text-[0.66rem] font-bold tracking-[0] text-muted-foreground uppercase backdrop-blur-[14px]'
const cellClass =
  'border-b border-border px-2 py-[9px] text-[0.79rem] leading-[1.35] whitespace-normal text-[color-mix(in_srgb,var(--foreground)_82%,var(--muted-foreground))]'
const rowClass = 'transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_5%,transparent)]'

const scorePillClass =
  'inline-flex h-[26px] min-w-11 items-center justify-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] px-[7px] text-[0.74rem] font-bold text-primary [&_svg]:size-4'

export function TrendingPage({ atlas }: TrendingPageProps) {
  const [domain, setDomain] = useState('All domains')
  const [field, setField] = useState('All fields')
  const [workArea, setWorkArea] = useState('All work areas')
  const domains = ['All domains', ...new Set(atlas.trending.map((topic) => topic.domain))]
  const fields = ['All fields', ...new Set(atlas.trending.filter((topic) => domain === 'All domains' || topic.domain === domain).map((topic) => topic.field).filter(Boolean))]
  const workAreas = [
    'All work areas',
    ...new Set(
      atlas.trending
        .filter((topic) => domain === 'All domains' || topic.domain === domain)
        .filter((topic) => field === 'All fields' || topic.field === field)
        .map((topic) => topic.workArea)
        .filter(Boolean),
    ),
  ]
  const rows = useMemo(
    () =>
      atlas.trending
        .filter((topic) => domain === 'All domains' || topic.domain === domain)
        .filter((topic) => field === 'All fields' || topic.field === field)
        .filter((topic) => workArea === 'All work areas' || topic.workArea === workArea),
    [atlas.trending, domain, field, workArea],
  )
  return (
    <div className="grid min-w-0 gap-3">
      <section className="flex min-w-0 items-start justify-between gap-[18px] max-[760px]:flex-col max-[760px]:items-stretch">
        <div className="min-w-0">
          <h1 className="m-0 font-display text-[clamp(1.7rem,2.08vw,1.9rem)] leading-[1.2] font-[740] tracking-[0]">Trending Intelligence</h1>
          <p className="mt-2 mb-0 max-w-[820px] text-[0.91rem] leading-[1.55] text-muted-foreground [overflow-wrap:anywhere]">
            Topic momentum normalized away from raw field size, with filters by OpenAlex domain and direct paths into the Atlas view.
          </p>
        </div>
        <div className="grid min-w-[min(620px,52vw)] grid-cols-3 gap-2 max-[1160px]:min-w-0 max-[1160px]:grid-cols-1 max-[760px]:w-full">
          <SelectField
            label="Domain"
            value={domain}
            onValueChange={(value) => {
              setDomain(value)
              setField('All fields')
              setWorkArea('All work areas')
            }}
            options={domains.map((item) => ({ value: item, label: item }))}
          />
          <SelectField
            label="Field"
            value={field}
            onValueChange={(value) => {
              setField(value)
              setWorkArea('All work areas')
            }}
            options={fields.map((item) => ({ value: item, label: item }))}
          />
          <SelectField
            label="Work area"
            value={workArea}
            onValueChange={setWorkArea}
            options={workAreas.map((item) => ({ value: item, label: item }))}
          />
        </div>
      </section>

      <section className="grid grid-cols-4 gap-2.5 max-[1160px]:grid-cols-2 max-[760px]:grid-cols-1">
        {rows.slice(0, 4).map((topic, index) => (
          <Card
            className="group relative min-h-[152px] overflow-hidden bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_7%,transparent),transparent_56%),var(--card)] hover:border-[color-mix(in_srgb,var(--primary)_34%,var(--border))]"
            key={topic.slug}
          >
            <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,var(--primary),transparent)] opacity-80" />
            <CardContent className="grid min-h-[152px] content-between gap-4">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={index === 0 ? 'default' : 'outline'}>#{String(index + 1).padStart(2, '0')}</Badge>
                <span className="truncate text-[0.68rem] font-bold uppercase text-muted-foreground">{topic.domain}</span>
              </div>
              <div className="grid gap-2">
                <h3 className="m-0 line-clamp-2 min-h-[2.35em] text-[0.98rem] leading-[1.22] font-[720]">{topic.label}</h3>
                <p className="m-0 line-clamp-1 text-[0.75rem] text-muted-foreground">{topic.workArea}</p>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="grid gap-0.5">
                  <span className="text-[0.64rem] font-bold uppercase text-muted-foreground">Trend score</span>
                  <strong className="text-[1.38rem] leading-none font-[760] text-primary">{formatScore(topic.trendScore)}</strong>
                </div>
                <div className="grid justify-items-end gap-1">
                  <Badge variant="secondary">{formatNumber(topic.worksLast3Years)} works</Badge>
                  <span className="text-[0.66rem] font-bold text-muted-foreground">{topic.qualityLabel}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Momentum ranked topics</CardTitle>
            <CardDescription>Growth, author/institution expansion, and cross-topic spread in the static snapshot.</CardDescription>
          </div>
          <Filter aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[560px] w-full">
            <Table className={tableClass}>
              <TableHeader>
                <TableRow>
                  <TableHead className={headClass}>Rank</TableHead>
                  <TableHead className={headClass}>Topic</TableHead>
                  <TableHead className={headClass}>OpenAlex path</TableHead>
                  <TableHead className={headClass}>Why it ranks</TableHead>
                  <TableHead className={headClass}>Signal drivers</TableHead>
                  <TableHead className={headClass}>Evidence</TableHead>
                  <TableHead className={headClass}>Recent works</TableHead>
                  <TableHead className={headClass}>Growth</TableHead>
                  <TableHead className={headClass}>Trend</TableHead>
                  <TableHead className={headClass} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((topic, index) => (
                  <TableRow className={rowClass} key={topic.slug}>
                    <TableCell className={cellClass}>
                      <strong>{index + 1}</strong>
                    </TableCell>
                    <TableCell className={cellClass}>
                      <strong>{topic.label}</strong>
                      <br />
                      <span className="text-muted-foreground">{topic.workArea}</span>
                    </TableCell>
                    <TableCell className={cellClass}>
                      {topic.domain}
                      <br />
                      <span className="text-muted-foreground">{topic.field}</span>
                    </TableCell>
                    <TableCell className={cellClass}>
                      <strong>{topic.topSubtopic}</strong>
                      <br />
                      <span className="text-muted-foreground">{topic.whyTrending || 'Momentum is normalized against prior activity.'}</span>
                    </TableCell>
                    <TableCell className={cellClass}>
                      <div className="flex max-w-[300px] flex-wrap gap-1.5">
                        {(topic.signalDrivers?.length ? topic.signalDrivers : [topic.topSubtopic]).slice(0, 4).map((driver) => (
                          <span className="max-w-[145px] truncate whitespace-nowrap rounded-full border border-border bg-card-soft px-2 py-1 text-[0.67rem] font-bold text-muted-foreground" title={driver} key={`${topic.slug}-${driver}`}>
                            {driver}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className={cellClass}>
                      {topic.topInstitution || 'Institution not resolved'}
                      <br />
                      <span className="text-muted-foreground">
                        {topic.topCountry || 'Unknown'} / {formatPercent(topic.newAuthorShare || 0)} new authors
                      </span>
                      {topic.qualityLabel && <span className="mt-1 block text-[0.68rem] font-bold text-primary">{topic.qualityLabel}</span>}
                    </TableCell>
                    <TableCell className={cellClass}>{formatNumber(topic.worksLast3Years)}</TableCell>
                    <TableCell className={cellClass}>{formatPercent(topic.growthRate)}</TableCell>
                    <TableCell className={cellClass}>
                      <span className={scorePillClass}>
                        <Activity aria-hidden="true" />
                        {formatScore(topic.trendScore)}
                      </span>
                    </TableCell>
                    <TableCell className={cellClass}>
                      <Button variant="outline" size="sm" type="button" onClick={() => navigate(`/topic/${topic.slug}`)}>
                        Open
                        <ArrowUpRight aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
