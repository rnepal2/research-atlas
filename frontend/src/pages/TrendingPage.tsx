import { Activity, ArrowUpRight, Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Pagination,
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

import { dataTableStyles } from '../components/ui/data-table-styles'

const tableClass = 'min-w-[1040px] border-collapse [&_strong]:font-[650] [&_strong]:text-foreground'
const { head: headClass, cell: cellClass, row: rowClass } = dataTableStyles

const scorePillClass =
  'inline-flex h-[26px] min-w-11 items-center justify-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] px-[7px] text-[0.74rem] font-bold text-primary [&_svg]:size-4'

export function TrendingPage({ atlas }: TrendingPageProps) {
  const [domain, setDomain] = useState('All domains')
  const [field, setField] = useState('All fields')
  const [workArea, setWorkArea] = useState('All work areas')
  const [page, setPage] = useState(1)
  const pageSize = 6
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
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * pageSize
  const visibleRows = rows.slice(pageStart, pageStart + pageSize)

  return (
    <div className="grid min-w-0 gap-3">
      <PageHeader
        title="Research Momentum"
        description="Compare topics by recent growth, participation, and research breadth, adjusted for differences in field size."
        actionsClassName="min-w-[min(620px,52vw)] max-[1160px]:min-w-0 max-[760px]:w-full"
        actions={
          <div className="grid grid-cols-3 gap-2 max-[1160px]:grid-cols-1">
          <SelectField
            label="Domain"
            value={domain}
            onValueChange={(value) => {
              setDomain(value)
              setField('All fields')
              setWorkArea('All work areas')
              setPage(1)
            }}
            options={domains.map((item) => ({ value: item, label: item }))}
          />
          <SelectField
            label="Field"
            value={field}
            onValueChange={(value) => {
              setField(value)
              setWorkArea('All work areas')
              setPage(1)
            }}
            options={fields.map((item) => ({ value: item, label: item }))}
          />
          <SelectField
            label="Work area"
            value={workArea}
            onValueChange={(value) => {
              setWorkArea(value)
              setPage(1)
            }}
            options={workAreas.map((item) => ({ value: item, label: item }))}
          />
        </div>
        }
      />

      <section className="grid grid-cols-4 gap-2 max-[1160px]:grid-cols-2 max-[760px]:grid-cols-1">
        {rows.slice(0, 4).map((topic, index) => (
          <Card
            className="group relative min-h-[138px] overflow-hidden bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_4%,transparent),transparent_56%),var(--card)] hover:-translate-y-px hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
            key={topic.slug}
          >
            <CardContent className="grid min-h-[138px] content-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={index === 0 ? 'default' : 'outline'}>#{String(index + 1).padStart(2, '0')}</Badge>
                <span className="truncate text-[0.68rem] font-bold uppercase text-muted-foreground">{topic.domain}</span>
              </div>
              <div className="grid gap-2">
                <h3 className="m-0 line-clamp-2 min-h-[2.3em] text-[0.92rem] leading-[1.2] font-[680]">{topic.label}</h3>
                <p className="m-0 line-clamp-1 text-[0.71rem] text-muted-foreground">{topic.workArea}</p>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="grid gap-0.5">
                  <span className="text-[0.64rem] font-bold uppercase text-muted-foreground">Momentum score</span>
                  <strong className="text-[1.26rem] leading-none font-[720] text-primary">{formatScore(topic.trendScore)}</strong>
                </div>
                <div className="grid justify-items-end gap-1">
                  <Badge variant="secondary">{formatNumber(topic.worksLast3Years)} works</Badge>
                  <span className="text-[0.66rem] font-bold text-muted-foreground">{topic.qualityLabel?.replace('snapshot', 'coverage') || 'Coverage available'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Topics by Momentum</CardTitle>
            <CardDescription>Ranked using recent growth, participation, and breadth in the current data release.</CardDescription>
          </div>
          <Filter aria-hidden="true" />
        </CardHeader>
        <CardContent className="grid gap-3">
            <Table className={tableClass}>
              <TableHeader>
                <TableRow>
                  <TableHead className={headClass}>Rank</TableHead>
                  <TableHead className={headClass}>Topic</TableHead>
                  <TableHead className={headClass}>Research area</TableHead>
                  <TableHead className={headClass}>What is changing</TableHead>
                  <TableHead className={headClass}>Contributing factors</TableHead>
                  <TableHead className={headClass}>Context</TableHead>
                  <TableHead className={headClass}>Recent works</TableHead>
                  <TableHead className={headClass}>Growth</TableHead>
                  <TableHead className={headClass}>Momentum</TableHead>
                  <TableHead className={headClass} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((topic, index) => (
                  <TableRow className={rowClass} key={topic.slug}>
                    <TableCell className={cellClass}>
                      <strong>{pageStart + index + 1}</strong>
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
                      <span className="text-muted-foreground">
                        {formatNumber(topic.worksLast3Years)} recent works; {formatPercent(topic.growthRate)} growth versus the prior period.
                      </span>
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
                      {topic.qualityLabel && <span className="mt-1 block text-[0.68rem] font-bold text-muted-foreground">{topic.qualityLabel.replace('snapshot', 'coverage')}</span>}
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
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            pageSize={pageSize}
            totalItems={rows.length}
            itemLabel="topics"
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
