import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Pagination, Tabs, TabsList, TabsTrigger } from '../components/ui'
import { PageHeader } from '../components/PageHeader'
import { researchFile, useResearch } from '../data/research'
import { navigate } from '../lib/router'

interface EvidenceEntity {
  id: string
  name: string
  works: string[]
  citations: number
  affiliations?: string[]
  authors?: string[]
  country?: string
}

export function PeoplePage() {
  const { manifest, landscape, error } = useResearch()
  const [kind, setKind] = useState('authors')
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<EvidenceEntity[]>([])
  const [selected, setSelected] = useState('')
  const [failure, setFailure] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
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
  const visible = useMemo(
    () =>
      rows.filter((r) =>
        `${r.name} ${(r.affiliations || []).join(' ')} ${r.country || ''}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [rows, query],
  )
  const pages = Math.max(1, Math.ceil(visible.length / 20))
  const currentPage = Math.min(page, pages)
  const active = visible.find((r) => r.id === selected) || visible[(currentPage - 1) * 20]
  return (
    <div className="people-page grid gap-5">
      <PageHeader
        eyebrow="RESEARCH ATLAS / PEOPLE & INSTITUTIONS"
        title="Find the people behind the papers."
        description="People working across AI, computer science and their scientific applications. These are sampled publication records, not a ranking of scientific quality."
      />
      <div className="research-actions">
        <Tabs
          value={kind}
          onValueChange={(value) => {
            setKind(value)
            setRows([])
            setLoading(true)
            setSelected('')
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
          className="max-w-md"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="Search names, affiliations or countries…"
        />
      </div>
      {(error || failure) && <p role="alert">{error || failure}</p>}
      <p className="source-note">
        {loading ? (
          'Loading source-backed records…'
        ) : (
          <>
            {visible.length.toLocaleString()} matching {kind === 'authors' ? 'researchers' : 'institutions'} ·
            sorted by sampled work count ·{' '}
            {kind === 'authors'
              ? 'citations are fractional across coauthors'
              : 'citations use full institution counting; shared works can count for multiple institutions'}
            .
          </>
        )}
      </p>
      <div className="explore-workspace list-view">
        <section className="paper-list-pane">
          <div className="paper-results" key={currentPage}>
            {visible.slice((currentPage - 1) * 20, currentPage * 20).map((row) => (
              <button
                className={`paper-result ${active?.id === row.id ? 'selected' : ''}`}
                key={row.id}
                onClick={() => setSelected(row.id)}
              >
                <strong>{row.name}</strong>
                <span>
                  {row.works.length} sampled works · {Math.round(row.citations).toLocaleString()} cited-work
                  impact{row.authors && ` · ${row.authors.length} affiliated authors`}
                </span>
                <span>
                  {row.country || row.affiliations?.slice(0, 2).join('; ') || 'Affiliation not resolved'}
                </span>
              </button>
            ))}
          </div>
          <Pagination
            page={currentPage}
            pageCount={pages}
            pageSize={20}
            totalItems={visible.length}
            onPageChange={(value) => {
              setPage(value)
              setSelected('')
            }}
            itemLabel={kind === 'authors' ? 'researchers' : 'institutions'}
          />
        </section>
        <aside className="evidence-panel">
          {active ? (
            <>
              <span className="eyebrow">SOURCE EVIDENCE</span>
              <h2>{active.name}</h2>
              <p>{active.affiliations?.join('; ') || active.country}</p>
              <h3>Supporting papers</h3>
              {active.works
                .map((id) => landscape?.points.find((p) => p.id === id))
                .filter((p) => !!p)
                .slice(0, 30)
                .map((p) => (
                  <button
                    key={p.id}
                    className="theme-link"
                    onClick={() => navigate(`/explore?paper=${p.id}`)}
                  >
                    {p.title}
                    <span>{p.year}</span>
                  </button>
                ))}
              <p>
                Affiliations are those reported on sampled publications and may span multiple years; they are
                not a verified current appointment.
              </p>
              <Button variant="outline" asChild>
                <a href={active.id} target="_blank" rel="noreferrer">
                  Open source profile
                </a>
              </Button>
            </>
          ) : (
            <p role="status">{loading ? 'Loading source evidence…' : 'No records match this search.'}</p>
          )}
        </aside>
      </div>
    </div>
  )
}
