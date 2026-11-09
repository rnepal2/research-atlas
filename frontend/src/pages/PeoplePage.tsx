import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Network, BookOpen, X, Share2, List } from 'lucide-react'
import { Button, Input, Pagination, Tabs, TabsList, TabsTrigger } from '../components/ui'
import { PageHeader } from '../components/PageHeader'
import { EgoNetwork } from '../components/EgoNetwork'
import { researchFile, useResearch } from '../data/research'
import type { EvidenceEntity } from '../data/research'
import { sharedConnections } from '../lib/connections'
import { navigate, replaceViewUrl } from '../lib/router'
import { formatDate } from '../lib/format'
import type { AtlasData } from '../data/types'
import { ResearchScopeControls } from '../components/ResearchScopeControls'
import { inScope, readScope, scopePath, topicSlugs } from '../lib/researchScope'
import { scopeEntities } from '../lib/scopedEntities'
import { SnapshotNotice } from '../components/SnapshotNotice'

export function PeoplePage({ atlas }: { atlas: AtlasData }) {
  const { manifest, landscape, error, notice } = useResearch()
  const [scope, setScope] = useState(() => readScope(atlas.topics))
  const allowedTopics = useMemo(() => topicSlugs(atlas.topics, scope), [atlas, scope])
  const [kind, setKind] = useState(() =>
    new URLSearchParams(location.search).get('kind') === 'institutions' ? 'institutions' : 'authors',
  )
  const [selected, setSelected] = useState(() => new URLSearchParams(location.search).get('entity') || '')
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<EvidenceEntity[]>([])
  const [failure, setFailure] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [directoryPageSize, setDirectoryPageSize] = useState(5)
  const directoryRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState(() =>
    new URLSearchParams(location.search).get('view') === 'papers' ? 'papers' : 'network',
  )
  const [showConnections, setShowConnections] = useState(false)
  const [connectionId, setConnectionId] = useState(
    () => new URLSearchParams(location.search).get('connection') || '',
  )
  const [message, setMessage] = useState('')
  const [paperPage, setPaperPage] = useState({ key: '', page: 1 })
  const profile = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!directoryRef.current) return
    const observer = new ResizeObserver(([entry]) =>
      setDirectoryPageSize(Math.max(2, Math.min(12, Math.floor(entry.contentRect.height / 72)))),
    )
    observer.observe(directoryRef.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!manifest) return
    const controller = new AbortController()
    researchFile<EvidenceEntity[]>(manifest, `${kind}.json`, controller.signal)
      .then((values) => {
        setRows(values)
        setFailure('')
        setLoading(false)
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setFailure(String(error))
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [manifest, kind])
  const scopedRows = useMemo(
    () =>
      scope.field === 'all' && scope.topic === 'all'
        ? rows
        : scopeEntities(
            rows,
            (landscape?.points || []).filter((p) => inScope(p, allowedTopics)),
            kind,
          ),
    [rows, landscape, allowedTopics, scope, kind],
  )
  const visible = useMemo(
    () =>
      scopedRows.filter((row) =>
        `${row.name} ${(row.affiliations || []).join(' ')} ${row.country || ''}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [scopedRows, query],
  )
  const pages = Math.max(1, Math.ceil(visible.length / directoryPageSize)),
    currentPage = Math.min(page, pages)
  const active = selected
    ? scopedRows.find((r) => r.id === selected)
    : visible[(currentPage - 1) * directoryPageSize]
  const activeId = active?.id
  useEffect(() => {
    if (!selected || selected !== activeId || !matchMedia('(max-width: 760px)').matches) return
    const frame = requestAnimationFrame(() => profile.current?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [selected, activeId])
  const connections = useMemo(() => sharedConnections(active, scopedRows), [active, scopedRows])
  const chosenConnection = connections.neighbors.find((row) => row.id === connectionId)
  const paperLookup = useMemo(() => new Map((landscape?.points || []).map((p) => [p.id, p])), [landscape])
  const supporting = (chosenConnection?.sharedWorks || active?.works || [])
    .map((id) => paperLookup.get(id))
    .filter((p) => !!p)
    .sort((a, b) => b.year - a.year || b.citations - a.citations)
  useEffect(() => {
    if (!active) return
    const params = new URLSearchParams({ kind, entity: active.id, field: scope.field, topic: scope.topic })
    if (connectionId) params.set('connection', connectionId)
    if (view === 'papers') params.set('view', 'papers')
    if (manifest) params.set('snapshot', manifest.snapshot)
    replaceViewUrl(params)
  }, [active, kind, manifest, connectionId, view, scope])
  function follow(id: string) {
    setSelected(id)
    setConnectionId('')
    setQuery('')
    const index = scopedRows.findIndex((row) => row.id === id)
    setPage(Math.max(1, Math.floor(index / directoryPageSize) + 1))
  }
  const paperKey = `${scope.field}/${scope.topic}/${activeId}/${connectionId}`
  const paperPages = Math.max(1, Math.ceil(supporting.length / 12))
  const currentPaperPage = paperPage.key === paperKey ? Math.min(paperPage.page, paperPages) : 1
  const papers = (
    <div className="connection-paper-stack">
      <div className="connection-papers">
        {supporting.slice((currentPaperPage - 1) * 12, currentPaperPage * 12).map((p) => (
          <button
            key={p.id}
            className="theme-paper"
            onClick={() =>
              navigate(scopePath('/', scope, { paper: p.id, snapshot: manifest?.snapshot || '' }))
            }
          >
            <span className="eyebrow">
              {p.year} · {p.type} · {p.citations.toLocaleString()} citations
            </span>
            <strong>{p.title}</strong>
            <ArrowUpRight size={14} />
          </button>
        ))}
      </div>
      <Pagination
        compact
        page={currentPaperPage}
        pageCount={paperPages}
        pageSize={12}
        totalItems={supporting.length}
        onPageChange={(page) => setPaperPage({ key: paperKey, page })}
        itemLabel="supporting papers"
      />
    </div>
  )
  return (
    <div className="people-page connections-page">
      <PageHeader
        title="People & collaboration"
        description="People, institutions and the papers behind their observed collaborations."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              void navigator.clipboard.writeText(location.href).then(
                () => setMessage('Profile view copied.'),
                () => setMessage('Copy the current address to share this view.'),
              )
            }
          >
            <Share2 size={15} />
            Share view
          </Button>
        }
      />
      <ResearchScopeControls
        atlas={atlas}
        topicLabels={landscape?.topics}
        scope={scope}
        onChange={(value) => {
          setScope(value)
          setSelected('')
          setConnectionId('')
          setPage(1)
        }}
      />
      <div className="connections-controls">
        <Tabs
          value={kind}
          onValueChange={(value) => {
            setKind(value)
            setRows([])
            setLoading(true)
            setSelected('')
            setConnectionId('')
            setPage(1)
          }}
        >
          <TabsList>
            <TabsTrigger value="authors">Researchers</TabsTrigger>
            <TabsTrigger value="institutions">Institutions</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          aria-label="Search people or institutions"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelected('')
            setConnectionId('')
            setPage(1)
          }}
          placeholder="Find a name, institution or country…"
        />
      </div>
      {(error || failure) && <p role="alert">{error || failure}</p>}
      <SnapshotNotice message={notice} />
      <div className="connections-workspace">
        <section className="connection-directory paper-list-pane" aria-label="Research directory">
          <div className="directory-caption">
            {loading
              ? 'Loading records…'
              : `${visible.length.toLocaleString()} ${kind === 'authors' ? 'researchers' : 'institutions'}`}
            <span>By collected publication count in this scope</span>
          </div>
          <div className="paper-results" ref={directoryRef}>
            {visible
              .slice((currentPage - 1) * directoryPageSize, currentPage * directoryPageSize)
              .map((row) => (
                <button
                  key={row.id}
                  className={`paper-result ${active?.id === row.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelected(row.id)
                    setConnectionId('')
                  }}
                >
                  <strong title={row.name}>{row.name}</strong>
                  <span>
                    {row.works.length} sampled {row.works.length === 1 ? 'paper' : 'papers'}
                  </span>
                  <span title={row.country || row.affiliations?.join('; ') || 'Affiliation not resolved'}>
                    {row.country || row.affiliations?.slice(0, 2).join('; ') || 'Affiliation not resolved'}
                  </span>
                </button>
              ))}
          </div>
          <Pagination
            compact
            page={currentPage}
            pageCount={pages}
            pageSize={directoryPageSize}
            totalItems={visible.length}
            onPageChange={(value) => {
              setPage(value)
              setSelected('')
              setConnectionId('')
            }}
            itemLabel={kind === 'authors' ? 'researchers' : 'institutions'}
          />
        </section>
        <section
          ref={profile}
          className="connection-profile"
          aria-label="Selected entity and collaboration evidence"
        >
          {active ? (
            <>
              <header className="connection-profile-header">
                <div>
                  <span className="eyebrow">{kind === 'authors' ? 'RESEARCHER' : 'INSTITUTION'} PROFILE</span>
                  <h2>{active.name}</h2>
                  <p>
                    {active.works.length.toLocaleString()} collected{' '}
                    {active.works.length === 1 ? 'paper' : 'papers'} ·{' '}
                    {active.citations === null
                      ? 'Unavailable'
                      : Math.round(active.citations).toLocaleString()}{' '}
                    {kind === 'authors' ? 'fractional' : 'full-counted'} cited-work impact
                  </p>
                </div>
                <Button variant="ghost" size="icon-sm" asChild>
                  <a
                    href={active.id}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open source profile for ${active.name}`}
                  >
                    <ArrowUpRight size={17} />
                  </a>
                </Button>
              </header>
              <div className="connection-viewbar">
                <Tabs
                  value={view}
                  onValueChange={(value) => {
                    setView(value)
                    setConnectionId('')
                  }}
                >
                  <TabsList>
                    <TabsTrigger value="network">
                      <Network size={15} />
                      Connections
                    </TabsTrigger>
                    <TabsTrigger value="papers">
                      <BookOpen size={15} />
                      Papers
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                {view === 'network' && (
                  <Button
                    size="icon-sm"
                    variant={showConnections ? 'secondary' : 'ghost'}
                    aria-label={showConnections ? 'Hide connection list' : 'Show connection list'}
                    aria-expanded={showConnections}
                    aria-controls="connection-list"
                    onClick={() => setShowConnections((v) => !v)}
                  >
                    <List size={16} />
                  </Button>
                )}
                <span>
                  {connections.neighbors.length} of {connections.total.toLocaleString()} observed{' '}
                  {kind === 'authors' ? 'coauthors' : 'linked institutions'}
                </span>
              </div>
              {view === 'network' ? (
                <>
                  <div className={`connection-canvas-row ${chosenConnection ? 'with-evidence' : ''}`}>
                    <EgoNetwork
                      hub={active}
                      peers={connections.neighbors}
                      selectedConnection={connectionId}
                      onSelect={follow}
                      onInspect={setConnectionId}
                    />
                    {chosenConnection && (
                      <aside className="shared-paper-drawer">
                        <div className="evidence-top">
                          <span className="eyebrow">SHARED PAPER EVIDENCE</span>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Close shared paper evidence"
                            onClick={() => setConnectionId('')}
                          >
                            <X size={15} />
                          </Button>
                        </div>
                        <h3>{chosenConnection.name}</h3>
                        <p>
                          {chosenConnection.sharedWorks.length} shared collected{' '}
                          {chosenConnection.sharedWorks.length === 1 ? 'paper' : 'papers'} with {active.name}.
                        </p>
                        {papers}
                      </aside>
                    )}
                  </div>
                  {showConnections && (
                    <div
                      id="connection-list"
                      className="connection-list"
                      aria-label="Connections and shared paper counts"
                    >
                      {connections.neighbors.map((peer) => (
                        <button
                          key={peer.id}
                          aria-pressed={connectionId === peer.id}
                          onClick={() => setConnectionId((value) => (value === peer.id ? '' : peer.id))}
                        >
                          <span>{peer.name}</span>
                          <strong>
                            {peer.sharedWorks.length}
                            <span> shared {peer.sharedWorks.length === 1 ? 'paper' : 'papers'}</span>
                          </strong>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                papers
              )}
              <p className="connection-scope">
                {active.country || active.affiliations?.slice(0, 3).join('; ') || 'Affiliations not resolved'}
                . Publication affiliations are not verified current appointments.{' '}
                {kind === 'authors'
                  ? 'Organizational and placeholder names are excluded from the directory.'
                  : 'Shared affiliations use full institution counting; they do not establish formal partnerships.'}{' '}
                The view is sample-relative; missing links do not establish the absence of collaboration.
              </p>
            </>
          ) : (
            <div className="research-empty" role="status">
              <p>
                {loading
                  ? 'Loading source evidence…'
                  : selected
                    ? 'This entity has no collected papers in the selected scope, or is not an individual in this snapshot’s directory.'
                    : 'No records match this search.'}
              </p>
              {selected && !loading && (
                <Button variant="outline" onClick={() => setSelected('')}>
                  Browse the directory
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
      <footer className="connections-footer" role="status">
        {message ||
          `OpenAlex · ${manifest ? formatDate(manifest.processedAt) : 'loading'} · ${manifest?.snapshot.slice(0, 8) || 'loading'} · Partial corpus. Connections are ranked by shared paper count; geometry is not an impact metric.`}
      </footer>
    </div>
  )
}
