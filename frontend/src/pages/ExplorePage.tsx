import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Bookmark,
  Download,
  Search,
  Share2,
  X,
  SlidersHorizontal,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { useResearch, researchFile } from '../data/research'
import type { ResearchPaper } from '../data/research'
import { Button, Input, Pagination, SelectField } from '../components/ui'
import { exportPapers } from '../lib/exportResearch'
import { landscapeColor } from '../lib/landscape'
import { PaperTimeline } from '../components/PaperTimeline'
import { TopicTrendPanel } from '../components/TopicTrendPanel'
import type { AtlasData } from '../data/types'
import { navigate } from '../lib/router'
import { formatDate } from '../lib/format'

const PaperMap = lazy(() => import('../components/PaperMap').then((m) => ({ default: m.PaperMap })))
const emptyReferences: string[] = []
const getParams = () => new URLSearchParams(window.location.search)

export function ExplorePage({ atlas }: { atlas: AtlasData }) {
  const evidenceRef = useRef<HTMLElement>(null)
  const { manifest, landscape, error, notice } = useResearch()
  const [topic, setTopic] = useState(() => getParams().get('topic') || 'all')
  const [track, setTrack] = useState(() => {
    const value = getParams().get('track') || 'all'
    return ['all', 'methods', 'applications'].includes(value) ? value : 'all'
  })
  const [query, setQuery] = useState(() => getParams().get('q') || '')
  const [year, setYear] = useState(() => {
    const value = Number(getParams().get('year'))
    return Number.isInteger(value) && value >= 2017 && value <= new Date().getFullYear() ? value : 2017
  })
  const [cluster, setCluster] = useState(() => getParams().get('cluster') || 'all')
  const [type, setType] = useState(() => getParams().get('type') || 'all')
  const [selected, setSelected] = useState(() => getParams().get('paper') || '')
  const [paper, setPaper] = useState<ResearchPaper | null>(null)
  const [detailError, setDetailError] = useState('')
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem('atlas:reading-list') || '[]')
      return Array.isArray(value)
        ? [...new Set(value.filter((id): id is string => typeof id === 'string'))]
        : []
    } catch {
      return []
    }
  })
  const [savedOnly, setSavedOnly] = useState(false)
  const savedIds = useMemo(() => new Set(saved), [saved])
  const savedFilter = savedOnly ? savedIds : null
  const [page, setPage] = useState(1)
  const [view, setView] = useState(() => (getParams().get('view') === 'list' ? 'list' : 'map'))
  const [showFilters, setShowFilters] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(() => getParams().get('panel') !== 'closed')
  const [focusedTheme, setFocusedTheme] = useState<number | null>(() => {
    const value = getParams().get('focus')
    const id = Number(value)
    return value !== null && Number.isInteger(id) && id >= 0 && id < 12 ? id : null
  })
  const [message, setMessage] = useState('')
  const [region, setRegion] = useState<string[]>([])
  const [camera, setCamera] = useState<{ x: number; y: number; ratio: number } | undefined>(() => {
    try {
      const value = getParams().get('camera')
      if (value) {
        const c = JSON.parse(value)
        if ([c.x, c.y, c.ratio].every(Number.isFinite) && c.ratio > 0) return c
      }
    } catch {
      /* Invalid shared camera uses default framing. */
    }
  })
  const trackTopics = useMemo(
    () =>
      new Set(
        (landscape?.topics || []).filter((t) => track === 'all' || t.role === track).map((t) => t.slug),
      ),
    [landscape, track],
  )
  const scopePoints = useMemo(
    () =>
      (landscape?.points || []).filter(
        (p) =>
          (topic === 'all' || p.topics.includes(topic)) &&
          (track === 'all' || p.topics.some((slug) => trackTopics.has(slug))) &&
          (cluster === 'all' || p.cluster === Number(cluster)) &&
          (type === 'all' || p.type === type) &&
          (!savedFilter || savedFilter.has(p.id)) &&
          p.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [landscape, topic, cluster, type, savedFilter, query, track, trackTopics],
  )
  const points = useMemo(() => scopePoints.filter((p) => p.year >= year), [scopePoints, year])
  const ordered = useMemo(
    () => [...points].sort((a, b) => b.citations - a.citations || a.id.localeCompare(b.id)),
    [points],
  )
  const activePoint = landscape?.points.find((p) => p.id === selected)
  const availableSaved = useMemo(
    () => (landscape?.points || []).filter((p) => savedIds.has(p.id)),
    [landscape, savedIds],
  )
  useEffect(() => {
    if (activePoint && inspectorOpen && matchMedia('(max-width:760px)').matches)
      evidenceRef.current?.scrollIntoView({
        block: 'start',
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })
  }, [activePoint, inspectorOpen])

  useEffect(() => {
    try {
      localStorage.setItem('atlas:reading-list', JSON.stringify(saved))
    } catch {
      queueMicrotask(() =>
        setMessage('Browser storage is unavailable. This reading list is kept for the current session only.'),
      )
    }
  }, [saved])
  useEffect(() => {
    if (topic !== 'all') sessionStorage.setItem('atlas:topic', topic)
  }, [topic])
  useEffect(() => {
    if (!activePoint || !manifest) return
    const controller = new AbortController()
    researchFile<Record<string, ResearchPaper>>(
      manifest,
      `papers-${activePoint.shard}.json`,
      controller.signal,
    )
      .then((values) => {
        setPaper(values[activePoint.id])
        setDetailError('')
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setDetailError(err instanceof Error ? err.message : 'Evidence could not load.')
      })
    return () => controller.abort()
  }, [manifest, activePoint])
  useEffect(() => {
    const params = new URLSearchParams({ topic, track, year: String(year), cluster, type })
    if (query) params.set('q', query)
    if (selected) params.set('paper', selected)
    if (focusedTheme !== null) params.set('focus', String(focusedTheme))
    if (view === 'list') params.set('view', 'list')
    if (!inspectorOpen) params.set('panel', 'closed')
    if (manifest) params.set('snapshot', manifest.snapshot)
    if (camera) params.set('camera', JSON.stringify(camera))
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`)
  }, [
    topic,
    track,
    year,
    cluster,
    type,
    query,
    selected,
    manifest,
    camera,
    focusedTheme,
    view,
    inspectorOpen,
  ])

  if (error)
    return (
      <div className="research-empty">
        <h1>Research landscape</h1>
        <p>{error}</p>
        <p>The existing topic profiles are available from the navigation.</p>
      </div>
    )
  if (!manifest || !landscape)
    return (
      <div className="research-empty" role="status">
        Loading the research landscape…
      </div>
    )
  const activePaper = paper?.id === selected ? paper : null
  const totalPages = Math.max(1, Math.ceil(points.length / 12))
  const currentPage = Math.min(page, totalPages)
  const updateFilter = (action: () => void) => {
    action()
    setPage(1)
    setFocusedTheme(null)
    setRegion([])
    setCamera(undefined)
  }
  function toggleSave(id: string) {
    setSaved((values) => (values.includes(id) ? values.filter((value) => value !== id) : [...values, id]))
  }
  function selectPaper(id: string) {
    setSelected(id)
    if (id) setInspectorOpen(true)
  }

  return (
    <div className="explore-page">
      <header className="research-header">
        <div>
          <h1>The research landscape.</h1>
          <p>
            {manifest.uniqueWorks.toLocaleString()} indexed works · AI, computing & scientific applications ·
            Partial coverage
          </p>
        </div>
        <div className="research-actions">
          <TopicTrendPanel atlas={atlas} defaultTopic={topic} key={topic} />
          <Button
            variant="outline"
            onClick={() => {
              setSavedOnly((v) => !v)
              setCamera(undefined)
              setRegion([])
              if (!savedOnly) {
                setTopic('all')
                setTrack('all')
                setCluster('all')
                setQuery('')
                setType('all')
                setYear(2017)
                setView('list')
              }
              setPage(1)
            }}
          >
            <Bookmark size={15} />
            {savedOnly ? 'All papers' : `Reading list (${saved.length})`}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (savedOnly) {
                setMessage('Reading lists stay in this browser. Export the list to share it.')
                return
              }
              void navigator.clipboard.writeText(window.location.href).then(
                () => setMessage('View link copied.'),
                () => setMessage('Copy the current address to share this view.'),
              )
            }}
          >
            <Share2 size={15} />
            Share view
          </Button>
        </div>
      </header>
      {notice && (
        <p role="status" className="snapshot-notice">
          {notice}
        </p>
      )}
      {savedOnly && availableSaved.length < saved.length && (
        <p role="status" className="snapshot-notice">
          {saved.length - availableSaved.length} saved records are not available in this snapshot. Exports
          contain the available records only.
        </p>
      )}
      <div className="explore-filters">
        <SelectField
          ariaLabel="Research area"
          value={topic}
          onValueChange={(value) => updateFilter(() => setTopic(value))}
          options={[
            { value: 'all', label: 'All research areas' },
            ...landscape.topics
              .filter((t) => track === 'all' || t.role === track)
              .map((t) => ({ value: t.slug, label: t.label, meta: `${t.count.toLocaleString()} collected` })),
          ]}
        />
        <label className="search-field">
          <span className="sr-only">Find a paper</span>
          <div>
            <Search size={16} />
            <Input
              value={query}
              placeholder="Search paper titles…"
              onChange={(e) => updateFilter(() => setQuery(e.target.value))}
            />
          </div>
        </label>
        <SelectField
          ariaLabel="Research track"
          value={track}
          onValueChange={(value) => {
            setTrack(value)
            setTopic('all')
            setPage(1)
            setFocusedTheme(null)
            setCamera(undefined)
            setRegion([])
          }}
          options={[
            { value: 'all', label: 'All research' },
            { value: 'methods', label: 'AI & computing' },
            { value: 'applications', label: 'Scientific applications' },
          ]}
        />
        <Button
          className="filter-toggle"
          variant="outline"
          aria-expanded={showFilters}
          aria-controls="explore-refinements"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal size={16} />
          Filters{cluster !== 'all' || type !== 'all' ? ' · active' : ''}
        </Button>
      </div>
      {showFilters && (
        <div className="explore-refinements" id="explore-refinements">
          <SelectField
            label="Limit to a theme"
            value={cluster}
            onValueChange={(value) => updateFilter(() => setCluster(value))}
            options={[
              { value: 'all', label: 'All themes' },
              ...landscape.clusters.map((c) => ({ value: String(c.id), label: c.label })),
            ]}
          />
          <SelectField
            label="Work type"
            value={type}
            onValueChange={(value) => updateFilter(() => setType(value))}
            options={[
              { value: 'all', label: 'All work types' },
              ...[...new Set(landscape.points.map((p) => p.type))]
                .sort()
                .map((t) => ({ value: t, label: t })),
            ]}
          />
          <Button
            variant="ghost"
            onClick={() => {
              setCluster('all')
              setType('all')
              setYear(2017)
              setPage(1)
            }}
          >
            Reset refinements
          </Button>
        </div>
      )}
      <div className="explore-toolbar">
        <span>
          {points.length.toLocaleString()} papers in this view
          {view === 'list' ? ' · sorted by citations' : ''}
          {region.length > 0 && ` · ${region.length} in selected region`}
        </span>
        <div>
          {region.length > 0 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSaved((values) => [...new Set([...values, ...region])])}
              >
                Save region
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRegion([])}>
                Clear selection
              </Button>
            </>
          )}
          <Button
            variant={view === 'map' ? 'secondary' : 'ghost'}
            size="sm"
            aria-pressed={view === 'map'}
            onClick={() => setView('map')}
          >
            Landscape
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            Paper list
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={inspectorOpen ? 'Hide evidence panel' : 'Show evidence panel'}
            onClick={() => setInspectorOpen((v) => !v)}
          >
            {inspectorOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </Button>
        </div>
      </div>
      <div
        className={`explore-workspace ${view === 'list' ? 'list-view' : ''} ${!inspectorOpen ? 'inspector-closed' : ''}`}
      >
        <section className="explore-canvas">
          {view === 'map' && (
            <Suspense fallback={<div className="research-empty">Preparing the landscape…</div>}>
              <PaperMap
                key={`${topic}/${track}/${year}/${cluster}/${type}/${query}/${savedOnly}`}
                points={points}
                clusters={landscape.clusters}
                selected={selected}
                onSelect={selectPaper}
                references={activePaper?.references || emptyReferences}
                camera={camera}
                onCamera={setCamera}
                onSelection={setRegion}
                focusCluster={focusedTheme}
                onFocusCluster={setFocusedTheme}
              />
            </Suspense>
          )}
          {view === 'list' && (
            <div className="paper-list-pane">
              <div className="paper-results" key={currentPage}>
                {ordered.slice((currentPage - 1) * 12, currentPage * 12).map((p) => (
                  <button
                    className={`paper-result ${selected === p.id ? 'selected' : ''}`}
                    key={p.id}
                    onClick={() => selectPaper(p.id)}
                  >
                    <span className="eyebrow">
                      {p.year} · {p.type} · {p.citations.toLocaleString()} citations
                    </span>
                    <strong>{p.title}</strong>
                    <span>{landscape.clusters.find((c) => c.id === p.cluster)?.label}</span>
                  </button>
                ))}
              </div>
              <Pagination
                page={currentPage}
                pageCount={totalPages}
                pageSize={12}
                totalItems={points.length}
                onPageChange={setPage}
                itemLabel="papers"
              />
            </div>
          )}
          <PaperTimeline
            points={scopePoints}
            year={year}
            onYear={(value) => updateFilter(() => setYear(value))}
          />
          {points.length === 0 && (
            <div className="research-empty">
              No papers match these filters. Try another year, theme or search.
            </div>
          )}
        </section>
        <aside
          ref={evidenceRef}
          className="evidence-panel"
          aria-label="Selected paper evidence"
          hidden={!inspectorOpen}
        >
          {activePoint ? (
            <>
              <div className="evidence-top">
                <span className="eyebrow">PAPER EVIDENCE</span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Close paper evidence"
                  onClick={() => setSelected('')}
                >
                  <X size={16} />
                </Button>
              </div>
              <h2>{activePoint.title}</h2>
              <div className="paper-facts">
                <span>{activePoint.year}</span>
                <span>{activePoint.citations.toLocaleString()} citations</span>
                <span>{activePoint.type}</span>
                {activePoint.oa && <span>Open access</span>}
              </div>
              {!points.some((p) => p.id === selected) && (
                <p className="snapshot-notice">This paper is outside the current filters.</p>
              )}
              {activePoint.retracted && (
                <p role="alert">OpenAlex marks this work as retracted. Review the source before using it.</p>
              )}
              <div className="research-actions">
                <Button variant="secondary" onClick={() => toggleSave(selected)}>
                  <Bookmark size={15} />
                  {saved.includes(selected) ? 'Saved' : 'Save paper'}
                </Button>
                <Button variant="ghost" asChild>
                  <a
                    href={activePaper?.url || `https://openalex.org/${selected}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read source <ArrowUpRight size={15} />
                  </a>
                </Button>
              </div>
              {detailError ? (
                <p role="alert">{detailError}</p>
              ) : !activePaper ? (
                <p role="status">Loading source evidence…</p>
              ) : (
                <>
                  <h3>Authors & affiliations</h3>
                  <ul className="author-evidence">
                    {activePaper.authors.slice(0, 12).map((a, i) => (
                      <li key={a.id || i}>
                        {a.id ? (
                          <button
                            className="evidence-link"
                            onClick={() =>
                              navigate(
                                `/connections?kind=authors&entity=${encodeURIComponent(a.id)}&snapshot=${manifest.snapshot}`,
                              )
                            }
                          >
                            {a.name || 'Author not resolved'} <ArrowUpRight size={11} />
                          </button>
                        ) : (
                          <strong>{a.name || 'Author not resolved'}</strong>
                        )}
                        <span>
                          {a.institutions.length
                            ? a.institutions.map((institution, i) => (
                                <span key={institution.id || i}>
                                  {i > 0 ? '; ' : ''}
                                  {institution.id ? (
                                    <button
                                      className="evidence-link affiliation-link"
                                      onClick={() =>
                                        navigate(
                                          `/connections?kind=institutions&entity=${encodeURIComponent(institution.id)}&snapshot=${manifest.snapshot}`,
                                        )
                                      }
                                    >
                                      {institution.display_name}
                                    </button>
                                  ) : (
                                    institution.display_name
                                  )}
                                </span>
                              ))
                            : 'Affiliation not resolved'}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {activePaper.authors.length > 12 && (
                    <p>{activePaper.authors.length - 12} additional coauthors in the source record.</p>
                  )}
                  <h3>Abstract</h3>
                  <p>{activePaper.abstract || 'An abstract is not available in this OpenAlex record.'}</p>
                  <h3>Citation context</h3>
                  <p>
                    {activePaper.referencesAvailable
                      ? `${activePaper.references.length} references recorded; ${activePaper.references.filter((id) => points.some((p) => p.id === id)).length} appear in the current view.`
                      : 'References were not captured for this record. No citation links are inferred.'}
                  </p>
                  <h3>Why included</h3>
                  <p>{activePaper.inclusion}</p>
                  {activePaper.matchedQueries?.length ? (
                    <ul>
                      {activePaper.matchedQueries.map((query) => (
                        <li key={query}>{query}</li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="source-note">
                    {activePaper.source} · OpenAlex {selected} · Source record observed{' '}
                    {activePaper.observedAt
                      ? `${activePaper.observedAt} (UTC)`
                      : 'at an unknown date in the legacy sample'}{' '}
                    · Snapshot {manifest.snapshot.slice(0, 8)}
                  </p>
                </>
              )}
            </>
          ) : (
            <>
              <span className="eyebrow">{focusedTheme !== null ? 'THEME IN FOCUS' : 'THEMES & IDEAS'}</span>
              <h2>
                {focusedTheme !== null
                  ? landscape.clusters.find((c) => c.id === focusedTheme)?.label
                  : 'Take a closer look.'}
              </h2>
              <p>
                {focusedTheme !== null
                  ? 'The highlighted papers share this computed theme. Other papers remain visible for context.'
                  : 'Focus a theme to explore its papers, or select any point to inspect the evidence.'}
              </p>
              {focusedTheme !== null && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setFocusedTheme(null)}>
                    Back to the landscape
                  </Button>
                  <h3>Papers in this theme</h3>
                  {ordered
                    .filter((p) => p.cluster === focusedTheme)
                    .slice(0, 4)
                    .map((p) => (
                      <button className="theme-paper" key={p.id} onClick={() => selectPaper(p.id)}>
                        <strong>{p.title}</strong>
                        <span>
                          {p.year} · {p.citations.toLocaleString()} citations
                        </span>
                      </button>
                    ))}
                </>
              )}
              <h3>{focusedTheme !== null ? 'Other themes' : 'Explore a theme'}</h3>
              {landscape.clusters
                .map((c) => ({ ...c, count: points.filter((p) => p.cluster === c.id).length }))
                .filter((c) => c.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((c) => (
                  <button
                    className="theme-link"
                    key={c.id}
                    onClick={() => {
                      setFocusedTheme(c.id)
                      setSelected('')
                    }}
                    aria-pressed={focusedTheme === c.id}
                  >
                    <span>
                      <i
                        className="theme-key"
                        style={{
                          background: landscapeColor(c.id, document.documentElement.dataset.theme === 'dark'),
                        }}
                      />
                      {c.label}
                    </span>
                    <span>{c.count}</span>
                  </button>
                ))}
              <p className="source-note">{landscape.method}</p>
            </>
          )}
        </aside>
      </div>
      <footer className="explore-footer">
        <p role="status">
          {message ||
            `OpenAlex · ${formatDate(manifest.processedAt)} · ${manifest.snapshot.slice(0, 8)} · Proximity = shared language; shading = local paper density.`}
        </p>
        <div className="research-actions">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => exportPapers(availableSaved, manifest.snapshot, 'bib')}
            disabled={availableSaved.length === 0}
          >
            Export reading list
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportPapers(points, manifest.snapshot, 'csv')}>
            <Download size={14} />
            Export view
          </Button>
        </div>
      </footer>
    </div>
  )
}
