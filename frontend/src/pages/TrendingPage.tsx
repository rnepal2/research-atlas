import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Download, Plus, X } from 'lucide-react'
import type { AtlasData } from '../data/types'
import { useResearch, researchFile } from '../data/research'
import { ResearchScopeControls } from '../components/ResearchScopeControls'
import { ResearchTrendChart } from '../components/ResearchTrendChart'
import { Button, Pagination, SelectField } from '../components/ui'
import { PageHeader } from '../components/PageHeader'
import { completedPeriod, selectedTrend } from '../lib/researchTrends'
import type { ResearchTrends } from '../lib/researchTrends'
import { normalizeScope, readScope, scopePath, topicSlugs } from '../lib/researchScope'
import { navigate, replaceViewUrl } from '../lib/router'
import { downloadText } from '../lib/exportResearch'
import { SnapshotNotice } from '../components/SnapshotNotice'
import { ResearchLens } from '../components/ResearchLens'

const growthLabel = (value: number | null) =>
  value === null
    ? 'No prior baseline'
    : `${value > 0 ? '+' : ''}${(value * 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`

export function TrendingPage({ atlas }: { atlas: AtlasData }) {
  const { manifest, notice, error } = useResearch()
  const [scope, setScope] = useState(() => readScope(atlas.topics))
  const [context, setContext] = useState<ResearchTrends | null>(null)
  const [failure, setFailure] = useState('')
  const [compare, setCompare] = useState(
    () => new URLSearchParams(location.search).get('compare') || 'none',
  )
  const [showComparison, setShowComparison] = useState(() =>
    new URLSearchParams(location.search).has('compare'),
  )
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
  const selected = context ? selectedTrend(context, scope) : undefined
  const active = selected && {
    ...selected,
    ...completedPeriod(selected.years, context!.throughYear),
  }
  const comparisonScope = context?.scopes?.find((r) => r.id === compare)
  const comparison =
    context?.topics.find((r) => r.slug === compare) ||
    (context && comparisonScope
      ? selectedTrend(context, {
          field: comparisonScope.field,
          topic: 'all',
          ...(comparisonScope.track !== 'all' ? { track: comparisonScope.track } : {}),
        })
      : undefined)
  const second = comparison?.slug !== active?.slug ? comparison : undefined
  useEffect(() => {
    if (!manifest) return
    const params = new URLSearchParams({ field: scope.field, topic: scope.topic })
    if (scope.track) params.set('track', scope.track)
    if (second) params.set('compare', second.slug)
    if (manifest) params.set('snapshot', manifest.snapshot)
    replaceViewUrl(params)
  }, [scope, second, manifest])
  const year = context?.throughYear
  const series = active
    ? [
        active,
        ...(second ? [{ ...second, ...completedPeriod(second.years, context!.throughYear) }] : []),
      ]
    : []
  const pageCount = Math.max(1, Math.ceil(rows.length / 8)),
    currentPage = Math.min(page, pageCount)
  return (
    <div className="trends-page">
      <PageHeader
        title="Research over time."
        description="Follow publication trends in AI research and its scientific applications."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              navigate(scopePath('/', scope, manifest ? { snapshot: manifest.snapshot } : {}))
            }
          >
            Investigate the papers <ArrowRight size={15} />
          </Button>
        }
      />
      <ResearchLens
        value={scope.track}
        onChange={(value) => {
          setScope(normalizeScope(atlas.topics, scope.field, scope.topic, value))
          setPage(1)
        }}
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
          <Button onClick={() => navigate(scopePath('/trending', scope))}>
            Use the latest release
          </Button>
        </div>
      ) : !context ? (
        <p role="status">Loading verified annual query context…</p>
      ) : (
        <>
          {active ? (
            <section className="trend-analysis" aria-label="Annual research publication analysis">
              <header>
                <div>
                  <span className="eyebrow">PUBLICATIONS OVER TIME</span>
                  <h2>{active.label}</h2>
                </div>
                {showComparison ? (
                  <div className="trend-comparison-controls">
                    <SelectField
                      label="Compare with"
                      value={second?.slug || 'none'}
                      onValueChange={setCompare}
                      options={[
                        { value: 'none', label: 'No comparison' },
                        ...(context.scopes || [])
                          .filter((r) => r.track === (scope.track || 'all') && r.id !== active.slug)
                          .map((r) => ({
                            value: r.id,
                            label: selectedTrend(context, {
                              field: r.field,
                              topic: 'all',
                              track: scope.track,
                            })!.label,
                            meta: 'Covered field total',
                          })),
                        ...context.topics
                          .filter((r) => r.slug !== active.slug)
                          .map((r) => ({ value: r.slug, label: r.label, meta: r.field })),
                      ]}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove comparison"
                      onClick={() => {
                        setCompare('none')
                        setShowComparison(false)
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setShowComparison(true)}>
                    <Plus size={14} /> Add comparison
                  </Button>
                )}
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
                {scope.topic === 'all'
                  ? 'Distinct OpenAlex works matching the covered topic queries; overlapping matches count once.'
                  : active.role === 'applications'
                    ? 'AI/ML-method query matches within this application topic.'
                    : 'Matches to the declared computational-method query.'}{' '}
                Not a field census, verified adoption rate or measure of research quality.
                Current-year data is excluded from completed-period growth.
              </p>
              <details className="aggregate-query">
                <summary>Source and query definition</summary>
                <p>{context.definition}</p>
                {series.map((r) => (
                  <div key={r.slug}>
                    <strong>{r.label}</strong>
                    <p>Observed {r.observedAt.slice(0, 10)} (UTC)</p>
                    <pre>{JSON.stringify(r.query, null, 2)}</pre>
                  </div>
                ))}
              </details>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  downloadText(
                    'selected-research-trend.csv',
                    [
                      'series,year,query_matches,observed_at,snapshot',
                      ...series.flatMap((r) =>
                        r.years.map((y) =>
                          [
                            JSON.stringify(r.label),
                            y.year,
                            y.works,
                            r.observedAt,
                            manifest?.snapshot,
                          ].join(','),
                        ),
                      ),
                    ].join('\n'),
                    'text/csv',
                  )
                }
              >
                <Download size={14} /> Export this trend
              </Button>
            </section>
          ) : (
            <div className="research-empty">
              <h2>Annual totals are unavailable for this scope.</h2>
              <p>
                This saved snapshot does not include a deduplicated field total. Select a topic to
                view its trend, or use the latest release. We do not add overlapping topic counts.
              </p>
            </div>
          )}
          <section className="trend-ranking" aria-label="Research topic publication ranking">
            <header>
              <div>
                <h2>Topics in this view</h2>
                <p>
                  Declared query matches over the same completed periods. Topic collections overlap;
                  their counts are not additive.
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
                    <tr key={r.slug} className={active?.slug === r.slug ? 'is-plotted' : ''}>
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
                            setScope(normalizeScope(atlas.topics, scope.field, r.slug, scope.track))
                            document
                              .querySelector('.trend-analysis')
                              ?.scrollIntoView({ block: 'start' })
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
                        [
                          JSON.stringify(r.label),
                          y.year,
                          y.works,
                          r.observedAt,
                          manifest?.snapshot,
                        ].join(','),
                      ),
                    ),
                  ].join('\n'),
                  'text/csv',
                )
              }
            >
              <Download size={14} />
              Export topic annual counts
            </Button>
          </section>
        </>
      )}
    </div>
  )
}
