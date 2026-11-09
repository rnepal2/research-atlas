import { useEffect, useState } from 'react'
import type { AtlasData } from '../data/types'
import { researchFile, useResearch } from '../data/research'
import { PageHeader } from '../components/PageHeader'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui'

interface Coverage {
  expectedPartitionCount: number
  startedPartitionCount: number
  exhaustedPartitionCount: number
  eligibleUniqueWorks: number
  abstractsAvailable: number
  referencesAvailable: number
}

export function MethodologyPage({ atlas }: { atlas: AtlasData }) {
  const { manifest } = useResearch()
  const [coverage, setCoverage] = useState<Coverage>()
  const [coverageError, setCoverageError] = useState('')
  useEffect(() => {
    if (!manifest) return
    const controller = new AbortController()
    researchFile<Coverage>(manifest, 'coverage.json', controller.signal)
      .then(setCoverage)
      .catch(() => {
        if (!controller.signal.aborted) setCoverageError('Coverage details could not be loaded.')
      })
    return () => controller.abort()
  }, [manifest])

  return (
    <div className="grid min-w-0 gap-5">
      <PageHeader
        eyebrow="Research Atlas"
        title="Methods & data"
        description="What is included, how the views are built, and where interpretation needs care."
      />
      <section className="method-strip">
        <div>
          <span className="eyebrow">THE PURPOSE</span>
          <h2>AI research, in context.</h2>
          <p>
            Follow advances in AI and computer science, then investigate their applications across the
            scientific domains already covered here. This is a discovery tool, not a ranking of scientific
            quality or a complete census of research.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href={atlas.source.url} target="_blank" rel="noopener noreferrer">
            About OpenAlex
          </a>
        </Button>
      </section>
      <section className="grid gap-5 min-[1100px]:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coverage of the paper landscape</CardTitle>
            <CardDescription>
              Partial collection within a declared boundary—not an estimate of field size.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              The edition covers 23 AI and computing areas and 77 scientific application contexts, from 2017
              onward. A paper must match a curated title/abstract query and any configured topic assignments.
              Application papers also need explicit AI methods in the title or abstract. Computing papers do
              not have to mention AI. Articles, reviews, preprints, conference papers and reports are
              eligible. Counts distinguish OpenAlex work IDs, not unique studies; publication and preprint
              versions can remain separate records. Physics collections use development-edition
              scientific-context queries; they are not silently limited to a single source topic assignment.
              Method filters describe terminology found in the title or abstract, not independently verified
              use or adoption. Field labels organize the curated Atlas topic collections using the source
              hierarchy’s terminology. They are not a restriction to each paper’s primary OpenAlex field: a
              computer-science paper about a physics application can belong to both collections.
            </p>
            {coverage && (
              <dl className="coverage-facts">
                {[
                  ['Unique papers', coverage.eligibleUniqueWorks],
                  ['With an abstract', coverage.abstractsAvailable],
                  ['With captured reference IDs', coverage.referencesAvailable],
                  ['Topic/year boundaries started', coverage.startedPartitionCount],
                  ['Topic/year boundaries exhausted', coverage.exhaustedPartitionCount],
                  ['Topic/year boundaries declared', coverage.expectedPartitionCount],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{Number(value).toLocaleString()}</dd>
                  </div>
                ))}
              </dl>
            )}
            {coverageError && <p role="status">{coverageError}</p>}
            <p>
              A boundary is exhausted only when its versioned query has no cursor pages left. This does not
              prove that the query finds every relevant paper. Keywords, missing abstracts, indexing delays
              and topic assignments can all exclude relevant research. Areas and tracks overlap; their paper
              counts must not be added together.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reading the landscape</CardTitle>
            <CardDescription>
              Text similarity helps find nearby ideas; it does not establish a relationship.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Coordinates are computed offline from title and abstract text using TF-IDF, truncated SVD and
              seeded t-SNE. Theme labels summarize frequent terms in k-means groups. They are navigation aids,
              not a peer-reviewed taxonomy. Local proximity indicates shared language; global distances
              between t-SNE groups have no quantitative meaning.
            </p>
            <p>
              Points grow with recorded citation counts. Zoom in to reveal paper titles, or use the searchable
              paper list for keyboard exploration. Selecting a paper shows its source evidence. Lines show
              actual reference IDs present in the current view; related-work suggestions are never substituted
              for citations. Background shading shows local record density in this projection, not confidence
              or a geographic boundary.
            </p>
            <p>
              Saved reading lists remain in this browser. Shared links preserve filters, the selected paper,
              camera position and snapshot ID. Exports carry the snapshot ID. Older links require the
              corresponding snapshot to remain available.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Publication trends and comparisons</CardTitle>
            <CardDescription>
              Whole-topic counts and AI-filtered paper samples are different populations.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Topic profiles and comparison charts use separate annual OpenAlex aggregate queries—not counts
              from the paper landscape. For application areas, these trends describe the broader parent topic,
              not AI adoption within it. The chart discloses this distinction.
            </p>
            <p>
              Momentum compares the latest three completed publication years with the three preceding years.
              The current year appears separately as year to date and is excluded from completed-year growth.
              Indexing delays and changes in OpenAlex coverage can affect these counts.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>People, institutions and collaboration</CardTitle>
            <CardDescription>
              Activity inside collected publications, not lifetime rankings or career trajectories.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              People & institutions uses the focused paper corpus. An author’s cited-work impact divides
              citations to each collected paper across its credited authorships; it is not their lifetime
              citation total. Institutions count distinct works carrying their affiliation. A
              multi-institution work can count for several institutions. Authors are attributed only to their
              own recorded affiliations. Organizational and placeholder names are excluded from the people
              directory; their citation credit is not reassigned to other authors.
            </p>
            <p>
              Networks and legacy topic profiles provide broader topic context from bounded samples. Network
              colors group author topic assignments or institution countries—not detected communities. Edges
              represent coauthorship or shared publications; missing edges do not prove the absence of
              collaboration. Experimental scores are relative to the sample, not scientific merit.
            </p>
            <p>
              The people workspace uses an elastic, bounded ego view of up to 32 observed coauthors or
              co-publishing institutions. Every link retains its shared work IDs. Neighbor size reflects
              shared work count; layout distances and curved lines have no quantitative meaning. The adjacent
              list provides the same connections without relying on the canvas.
            </p>
            <p>
              Recent activity includes this year and the two preceding calendar years. Dividing citation
              counts by paper age is not measured citation velocity; that requires repeated observations.
              Missing affiliations remain unresolved rather than being guessed.
            </p>
          </CardContent>
        </Card>
      </section>
      <p className="source-note">
        Source: OpenAlex. Data is collected offline and delivered as versioned static files; the browser does
        not query OpenAlex. Checksums are verified before research files are rendered. The established weekly
        production refresh remains separate from this development corpus. Bibliographic metadata, citations,
        identity resolution and retraction flags can contain source errors; verify consequential findings
        against the original publication.
        {manifest &&
          ` Paper snapshot ${manifest.snapshot.slice(0, 8)}, built ${new Date(manifest.processedAt).toLocaleDateString()}.`}
      </p>
    </div>
  )
}
