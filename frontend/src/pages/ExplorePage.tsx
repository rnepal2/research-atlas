import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Bookmark, Download, Search, Share2, X } from 'lucide-react'
import { useResearch, researchFile } from '../data/research'
import type { ResearchPaper } from '../data/research'
import { Button, Input, Pagination, SelectField } from '../components/ui'
import { exportPapers } from '../lib/exportResearch'

const PaperMap = lazy(() => import('../components/PaperMap').then((m) => ({ default: m.PaperMap })))
const emptyReferences: string[] = []
const getParams = () => new URLSearchParams(window.location.search)

export function ExplorePage() {
  const { manifest, landscape, error } = useResearch()
  const [topic, setTopic] = useState(() => getParams().get('topic') || 'all')
  const [query, setQuery] = useState(() => getParams().get('q') || '')
  const [year, setYear] = useState(() => Number(getParams().get('year')) || 2017)
  const [cluster, setCluster] = useState(() => getParams().get('cluster') || 'all')
  const [type, setType] = useState(() => getParams().get('type') || 'all')
  const [selected, setSelected] = useState(() => getParams().get('paper') || '')
  const [paper, setPaper] = useState<ResearchPaper | null>(null)
  const [detailError, setDetailError] = useState('')
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('atlas:reading-list') || '[]')
    } catch {
      return []
    }
  })
  const [savedOnly, setSavedOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [view, setView] = useState('map')
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
  const points = useMemo(
    () =>
      (landscape?.points || []).filter(
        (p) =>
          (topic === 'all' || p.topics.includes(topic)) &&
          p.year >= year &&
          (cluster === 'all' || p.cluster === Number(cluster)) &&
          (type === 'all' || p.type === type) &&
          (!savedOnly || saved.includes(p.id)) &&
          p.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [landscape, topic, year, cluster, type, savedOnly, saved, query],
  )
  const ordered = useMemo(
    () => [...points].sort((a, b) => b.citations - a.citations || a.id.localeCompare(b.id)),
    [points],
  )
  const activePoint = landscape?.points.find((p) => p.id === selected)
  const requestedSnapshot = getParams().get('snapshot')

  useEffect(() => {
    localStorage.setItem('atlas:reading-list', JSON.stringify(saved))
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
    const params = new URLSearchParams({ topic, year: String(year), cluster, type })
    if (query) params.set('q', query)
    if (selected) params.set('paper', selected)
    if (manifest) params.set('snapshot', manifest.snapshot)
    if (camera) params.set('camera', JSON.stringify(camera))
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`)
  }, [topic, year, cluster, type, query, selected, manifest, camera])

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
  }
  function toggleSave(id: string) {
    setSaved((values) => (values.includes(id) ? values.filter((value) => value !== id) : [...values, id]))
  }

  return (
    <div className="explore-page">
      <header className="research-header">
        <div>
          <span className="eyebrow">RESEARCH ATLAS / AI OBSERVATORY</span>
          <h1>Follow the ideas.</h1>
          <p>Explore the papers, connections and questions shaping AI research.</p>
        </div>
        <div className="research-actions">
          <Button
            variant="outline"
            onClick={() => {
              setSavedOnly((v) => !v)
              setPage(1)
            }}
          >
            <Bookmark size={15} />
            {savedOnly ? 'All papers' : `Reading list (${saved.length})`}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
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
      <div className="research-context">
        <span className="status-dot" />
        Focused corpus · {manifest.uniqueWorks.toLocaleString()} unique papers · Partial coverage{' '}
        <span>Snapshot {manifest.snapshot.slice(0, 8)}</span>
      </div>
      {requestedSnapshot && requestedSnapshot !== manifest.snapshot && (
        <p role="status">This link refers to an older snapshot. Showing the currently available release.</p>
      )}
      <div className="explore-filters">
        <SelectField
          label="Research area"
          value={topic}
          onValueChange={(value) => updateFilter(() => setTopic(value))}
          options={[
            { value: 'all', label: 'All AI areas' },
            ...landscape.topics.map((t) => ({ value: t.slug, label: t.label })),
          ]}
        />
        <label className="search-field">
          <span>Find a paper</span>
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
          label="Theme"
          value={cluster}
          onValueChange={(value) => updateFilter(() => setCluster(value))}
          options={[
            { value: 'all', label: 'All themes' },
            ...landscape.clusters.map((c) => ({ value: String(c.id), label: c.label })),
          ]}
        />
        <label className="year-filter">
          <span>Published since {year}</span>
          <input
            aria-label="Earliest publication year"
            type="range"
            min={2017}
            max={new Date().getFullYear()}
            value={year}
            onChange={(e) => updateFilter(() => setYear(Number(e.target.value)))}
          />
        </label>
      </div>
      <div className="explore-toolbar">
        <span>
          {points.length.toLocaleString()} matching papers · sorted by citations
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
          <Button variant={view === 'map' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('map')}>
            Landscape
          </Button>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('list')}>
            Paper list
          </Button>
          <select
            aria-label="Work type"
            value={type}
            onChange={(e) => updateFilter(() => setType(e.target.value))}
          >
            <option value="all">All work types</option>
            {[...new Set(landscape.points.map((p) => p.type))].sort().map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={`explore-workspace ${view === 'list' ? 'list-view' : ''}`}>
        <section className="explore-canvas">
          {view === 'map' && (
            <Suspense fallback={<div className="research-empty">Preparing the landscape…</div>}>
              <PaperMap
                points={points}
                clusters={landscape.clusters}
                selected={selected}
                onSelect={setSelected}
                references={activePaper?.references || emptyReferences}
                camera={camera}
                onCamera={setCamera}
                onSelection={setRegion}
              />
            </Suspense>
          )}
          {view === 'list' && (
            <div className="paper-results">
              {ordered.slice((currentPage - 1) * 12, currentPage * 12).map((p) => (
                <button
                  className={`paper-result ${selected === p.id ? 'selected' : ''}`}
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                >
                  <span className="eyebrow">
                    {p.year} · {p.type} · {p.citations.toLocaleString()} citations
                  </span>
                  <strong>{p.title}</strong>
                  <span>{landscape.clusters.find((c) => c.id === p.cluster)?.label}</span>
                </button>
              ))}
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
          {points.length === 0 && (
            <div className="research-empty">
              No papers match these filters. Try another year, theme or search.
            </div>
          )}
        </section>
        <aside className="evidence-panel" aria-label="Selected paper evidence">
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
                        <strong>{a.name || 'Author not resolved'}</strong>
                        <span>
                          {a.institutions.map((i) => i.display_name).join('; ') || 'Affiliation not resolved'}
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
                  <p className="source-note">
                    {activePaper.source} · OpenAlex {selected} · Source record observed{' '}
                    {activePaper.observedAt || 'at an unknown date in the legacy sample'} · Snapshot{' '}
                    {manifest.snapshot.slice(0, 8)}
                  </p>
                </>
              )}
            </>
          ) : (
            <>
              <span className="eyebrow">START EXPLORING</span>
              <h2>One paper opens a new direction.</h2>
              <p>
                Select a point or find a paper in the list to inspect its authors, abstract and references.
              </p>
              <h3>Explore a theme</h3>
              {landscape.clusters.map((c) => (
                <button
                  className="theme-link"
                  key={c.id}
                  onClick={() => updateFilter(() => setCluster(String(c.id)))}
                >
                  <span>{c.label}</span>
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
            'Source: OpenAlex. Text similarity is a discovery aid; it does not establish agreement or research quality.'}
        </p>
        <div className="research-actions">
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              exportPapers(
                savedOnly ? points : landscape.points.filter((p) => saved.includes(p.id)),
                manifest.snapshot,
                'bib',
              )
            }
            disabled={saved.length === 0}
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
