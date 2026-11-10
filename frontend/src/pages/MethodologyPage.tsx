import { useEffect, useState } from 'react'
import type { AtlasData } from '../data/types'
import { researchFile, useResearch } from '../data/research'
import { PageHeader } from '../components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui'

interface Coverage {
  expectedPartitionCount: number
  startedPartitionCount: number
  exhaustedPartitionCount: number
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
        if (!controller.signal.aborted) setCoverageError('Collection status is unavailable.')
      })
    return () => controller.abort()
  }, [manifest])

  return (
    <div className="methodology-page grid min-w-0 gap-5">
      <PageHeader title="Methods & data" description="The scope of the data and how to read each view." />
      <section className="methodology-grid grid gap-4 min-[1100px]:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coverage</CardTitle>
            <CardDescription>Curated topics, with an ongoing paper-level backfill.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              The edition tracks 23 AI and computing areas and 77 scientific application contexts from 2017
              onward.
              Papers match declared title-and-abstract terms and, where specified, OpenAlex topic assignments.
              Application queries also require AI-method terms.
            </p>
            <p>
              The paper map is incomplete even within these topics. Fields and research focuses can share
              papers; their counts should not be added.
            </p>
            {coverage && (
              <p className="methodology-status">
                Backfill: {coverage.startedPartitionCount.toLocaleString()} of{' '}
                {coverage.expectedPartitionCount.toLocaleString()} topic-year queries started;{' '}
                {coverage.exhaustedPartitionCount.toLocaleString()} fully paged.
              </p>
            )}
            {coverageError && <p role="status">{coverageError}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paper landscape</CardTitle>
            <CardDescription>Nearby points share language, not necessarily a research link.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              Positions and themes come from paper titles and abstracts. Distance between groups is not a
              quantitative measure. Point size reflects recorded citations; connecting lines represent
              captured references, not inferred relationships.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Publication trends</CardTitle>
            <CardDescription>Source query totals, separate from the collected paper map.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              Annual counts cover indexed OpenAlex works matching each declared query at refresh; field
              totals count overlapping matches once. They do not count every relevant paper in a field.
            </p>
            <p>The current year is shown separately and excluded from completed-year growth.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>People & collaboration</CardTitle>
            <CardDescription>Observed activity within the collected papers.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              Author impact divides a paper’s citations across its credited authors; it is not a career total.
              Institutions count works carrying their affiliation, so one paper may appear under several
              institutions.
            </p>
            <p>
              Network links reflect recorded coauthorship or shared publications. Layout distance is not a
              measure of collaboration strength; missing affiliations remain unresolved.
            </p>
          </CardContent>
        </Card>
      </section>
      <p className="source-note methodology-source">
        Source:{' '}
        <a href={atlas.source.url} target="_blank" rel="noopener noreferrer">
          OpenAlex
        </a>
        .
      </p>
    </div>
  )
}
