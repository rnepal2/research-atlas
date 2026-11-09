import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Download } from 'lucide-react'
import type { AtlasData } from '../data/types'
import { useResearch, researchFile } from '../data/research'
import { ResearchScopeControls } from '../components/ResearchScopeControls'
import { ResearchTrendChart } from '../components/ResearchTrendChart'
import { Button, Pagination, SelectField } from '../components/ui'
import { PageHeader } from '../components/PageHeader'
import { completedPeriod } from '../lib/researchTrends'
import type { ResearchTrends } from '../lib/researchTrends'
import { readScope, scopePath, topicSlugs } from '../lib/researchScope'
import { navigate, replaceViewUrl } from '../lib/router'
import { downloadText } from '../lib/exportResearch'
import { SnapshotNotice } from '../components/SnapshotNotice'

const growthLabel = (value: number | null) =>
  value === null
    ? 'No prior baseline'
    : `${value > 0 ? '+' : ''}${(value * 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`

export function TrendingPage({ atlas }: { atlas: AtlasData }) {
  const { manifest, notice, error } = useResearch()
  const [scope, setScope] = useState(() => readScope(atlas.topics))
  const [context, setContext] = useState<ResearchTrends | null>(null)
  const [failure, setFailure] = useState('')
  const [plot, setPlot] = useState(
    () => new URLSearchParams(location.search).get('plot') || 'large-language-models',
  )
  const [compare, setCompare] = useState(() => new URLSearchParams(location.search).get('compare') || 'none')
  const [sort, setSort] = useState('volume'),
    [page, setPage] = useState(1)
  useEffect(() => {
    if (!manifest) return
    if (!manifest.files['trends.json']) return
    const controller = new AbortController()
    researchFile<ResearchTrends>(manifest, 'trends.json', controller.signal)
      .then(setContext)
      .catch((error) => {
        if (!controller.signal.aborted) setFailure(String(error))
      })
    return () => controller.abort()
  }, [manifest])
  const allowed = useMemo(() => topicSlugs(atlas.topics, scope), [atlas, scope])
  const rows = useMemo(
    () =>
      (context?.topics || [])
        .filter((r) => allowed.has(r.slug))
        .map((r) => ({ ...r, ...completedPeriod(r.years, context!.throughYear) }))
        .sort((a, b) =>
          sort === 'growth'
            ? (b.growth ?? -Infinity) - (a.growth ?? -Infinity) || a.slug.localeCompare(b.slug)
            : (b.recent ?? -1) - (a.recent ?? -1) || a.slug.localeCompare(b.slug),
        ),
    [context, allowed, sort],
  )
  const defaultPlot =
    scope.field === 'Physics and Astronomy'
      ? 'particle-physics'
      : scope.field === 'Medicine'
        ? 'medical-ai'
        : 'large-language-models'
  const active =
    rows.find((r) => r.slug === plot) ||
    rows.find((r) => r.slug === defaultPlot) ||
    [...rows].sort((a, b) => a.slug.localeCompare(b.slug))[0]
  const second = context?.topics.find((r) => r.slug === compare && r.slug !== active?.slug)
  useEffect(() => {
    if (!manifest) return
    const params = new URLSearchParams({ field: scope.field, topic: scope.topic, plot: active?.slug || plot })
    if (second) params.set('compare', second.slug)
    if (manifest) params.set('snapshot', manifest.snapshot)
    replaceViewUrl(params)
  }, [scope, active?.slug, plot, second, manifest])
  const year = context?.throughYear
  const series = active
    ? [active, ...(second ? [{ ...second, ...completedPeriod(second.years, context!.throughYear) }] : [])]
    : []
  const pageCount = Math.max(1, Math.ceil(rows.length / 8)),
    currentPage = Math.min(page, pageCount)
  return (
    <div className="trends-page">
      <PageHeader
        title="How research is changing."
        description="Follow AI and computing methods—and their applications across the sciences."
        actions={
          <Button
            variant="outline"
            onClick={() => navigate(scopePath('/', scope, manifest ? { snapshot: manifest.snapshot } : {}))}
          >
            Investigate the papers <ArrowRight size={15} />
          </Button>
        }
      />
      <ResearchScopeControls
        atlas={atlas}
        topicLabels={context?.topics}
        scope={scope}
        onChange={(value) => {
          setScope(value)
          setPage(1)
        }}
      />
      <SnapshotNotice message={notice} />
      {(error || failure) && <p role="alert">{error || failure}</p>}
      {manifest && !manifest.files['trends.json'] ? (
        <div className="research-empty">
          <h2>Annual context is unavailable for this saved snapshot.</h2>
          <p>We do not substitute broader field totals for AI-related activity.</p>
          <Button onClick={() => navigate(scopePath('/trending', scope))}>Use the latest release</Button>
        </div>
      ) : !context ? (
        <p role="status">Loading verified annual query context…</p>
      ) : active ? (
        <>
          <section className="trend-analysis" aria-label="Annual research publication analysis">
            <header>
              <div>
                <span className="eyebrow">ANNUAL PUBLICATION CONTEXT</span>
                <h2>{active.label}</h2>
              </div>
              <SelectField
                label="Compare with"
                value={second?.slug || 'none'}
                onValueChange={setCompare}
                options={[
                  { value: 'none', label: 'No comparison' },
                  ...context.topics
                    .filter((r) => r.slug !== active.slug)
                    .map((r) => ({ value: r.slug, label: r.label, meta: r.field })),
                ]}
              />
            </header>
            <div className="trend-analysis-main">
              <div className="trend-period-summary">
                {series.map((r) => (
                  <div key={r.slug}>
                    {series.length > 1 && <span className="period-series-name">{r.label}</span>}
                    <div className="period-volume">
                      <strong>{r.recent?.toLocaleString() ?? 'Unavailable'}</strong>
                      <span>
                        query matches · {year! - 3}–{year! - 1}
                      </span>
                    </div>
                    <div className="period-growth">
                      <strong>{growthLabel(r.growth)}</strong>
                      <span>
                        vs {year! - 6}–{year! - 4}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <ResearchTrendChart
                key={active.slug + '/' + second?.slug}
                series={series.map((r) => ({ label: r.label, rows: r.years }))}
                throughYear={year!}
              />
            </div>
            <p className="source-note">
              {active.role === 'applications'
                ? 'AI/ML-method query matches within this application topic.'
                : 'Matches to the declared computational-method query.'}{' '}
              Not a field census, verified adoption rate or measure of research quality. Current-year data is
              excluded from completed-period growth.
            </p>
            <details className="aggregate-query">
              <summary>Source and query definition</summary>
              <p>{context.definition}</p>
              {series.map((r) => (
                <div key={r.slug}>
                  <strong>{r.label}</strong>
                  <p>Observed {r.observedAt.slice(0, 10)} (UTC)</p>
                  <code>{r.query['search.title_and_abstract']}</code>
                  <p>{r.query.filter}</p>
                </div>
              ))}
            </details>
          </section>
          <section className="trend-ranking" aria-label="Research topic publication ranking">
            <header>
              <div>
                <h2>Topics in this view</h2>
                <p>
                  Declared query matches over the same completed periods. Topic collections overlap; their
                  counts are not additive.
                </p>
              </div>
              <SelectField
                label="Order topics by"
                value={sort}
                onValueChange={(value) => {
                  setSort(value)
                  setPage(1)
                }}
                options={[
                  { value: 'volume', label: 'Publication volume' },
                  { value: 'growth', label: 'Publication growth' },
                ]}
              />
            </header>
            <div className="trend-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Field</th>
                    <th>
                      {year! - 3}–{year! - 1}
                    </th>
                    <th>Change vs prior 3 years</th>
                    <th>
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice((currentPage - 1) * 8, currentPage * 8).map((r) => (
                    <tr key={r.slug} className={active.slug === r.slug ? 'is-plotted' : ''}>
                      <td>
                        <strong>{r.label}</strong>
                        <span>
                          {r.role === 'applications'
                            ? 'AI-related application query'
                            : 'Computational-method query'}
                        </span>
                      </td>
                      <td>{r.field}</td>
                      <td>{r.recent?.toLocaleString() ?? 'Unavailable'}</td>
                      <td>{growthLabel(r.growth)}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setPlot(r.slug)
                            document.querySelector('.trend-analysis')?.scrollIntoView({ block: 'start' })
                          }}
                        >
                          Show trend <ArrowRight size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              pageSize={8}
              totalItems={rows.length}
              onPageChange={setPage}
              itemLabel="topics"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                downloadText(
                  'research-query-trends.csv',
                  [
                    'topic,year,query_matches,observed_at,snapshot',
                    ...rows.flatMap((r) =>
                      r.years.map((y) =>
                        [JSON.stringify(r.label), y.year, y.works, r.observedAt, manifest?.snapshot].join(
                          ',',
                        ),
                      ),
                    ),
                  ].join('\n'),
                  'text/csv',
                )
              }
            >
              <Download size={14} />
              Export annual counts
            </Button>
          </section>
        </>
      ) : (
        <p>No annual queries match this field and topic.</p>
      )}
    </div>
  )
}
