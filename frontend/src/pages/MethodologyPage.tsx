import type { AtlasData } from '../data/types'
import { formatDate, formatNumber } from '../lib/format'
import { Activity, Compass, Database, Layers3, RefreshCw, ShieldCheck } from 'lucide-react'
import { Accordion, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui'

interface MethodologyPageProps {
  atlas: AtlasData
}

export function MethodologyPage({ atlas }: MethodologyPageProps) {
  const signalLabels: Record<string, string> = {
    trendScore: 'Topic momentum',
    risingResearcherScore: 'Rising researcher visibility',
    institutionStrengthScore: 'Institution strength',
  }

  return (
    <div className="page">
      <section className="page-heading information-heading">
        <div>
          <span className="section-kicker">Information layer</span>
          <h1 className="page-title">Information</h1>
          <p className="page-intro">
            A concise guide to the snapshot, scoring language, and limits behind Research Atlas. The product is built
            for discovery, not absolute ranking.
          </p>
        </div>
        <Badge variant="outline">Updated {formatDate(atlas.generatedAt)}</Badge>
      </section>

      <section className="information-grid">
        <Card className="information-card information-card-primary">
          <CardHeader>
            <div>
              <CardTitle>Static research snapshot</CardTitle>
              <CardDescription>{atlas.source.notes}</CardDescription>
            </div>
            <Database aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="information-stat-row">
              <span>
                <strong>{formatNumber(atlas.topics.length)}</strong>
                curated topics
              </span>
              <span>
                <strong>{formatNumber(atlas.taxonomy.length)}</strong>
                domains
              </span>
              <span>
                <strong>{formatNumber(atlas.trending.length)}</strong>
                trend signals
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="information-card">
          <CardHeader>
            <div>
              <CardTitle>Update model</CardTitle>
              <CardDescription>Offline OpenAlex processing, static JSON, GitHub Pages delivery.</CardDescription>
            </div>
            <RefreshCw aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="information-step-line">
              <span>OpenAlex</span>
              <i />
              <span>Processor</span>
              <i />
              <span>Static site</span>
            </div>
          </CardContent>
        </Card>

        <Card className="information-card">
          <CardHeader>
            <div>
              <CardTitle>Ranking posture</CardTitle>
              <CardDescription>Signals are directional and transparent by design.</CardDescription>
            </div>
            <ShieldCheck aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="information-copy">
              The app says "rising visibility" and "strength signal" because OpenAlex artifacts are useful evidence,
              not final judgments about quality, prestige, or impact.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="information-layout">
        <Card className="information-signal-card">
          <CardHeader>
            <div>
              <CardTitle>Signal guide</CardTitle>
              <CardDescription>How the main scores should be read inside the product.</CardDescription>
            </div>
            <Activity aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <Accordion
              defaultValue="trendScore"
              items={Object.entries(atlas.methodology).map(([key, value]) => ({
                value: key,
                title: signalLabels[key] || key,
                content: <p className="accordion-copy">{value}</p>,
              }))}
            />
          </CardContent>
        </Card>

        <Card className="information-signal-card">
          <CardHeader>
            <div>
              <CardTitle>Interpretation guardrails</CardTitle>
              <CardDescription>Keep these caveats attached to every leaderboard and graph.</CardDescription>
            </div>
            <Compass aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <Accordion
              defaultValue="coverage"
              items={[
                {
                  value: 'coverage',
                  title: 'Coverage is curated',
                  content: <p className="accordion-copy">The MVP covers a selected set of OpenAlex-aligned domains and topics, not the full research graph.</p>,
                },
                {
                  value: 'taxonomy',
                  title: 'Taxonomy follows OpenAlex',
                  content: <p className="accordion-copy">Topic navigation uses domain, field, subfield, and topic labels so future additions stay aligned with OpenAlex conventions.</p>,
                },
                {
                  value: 'citations',
                  title: 'Citations lag reality',
                  content: <p className="accordion-copy">Citation velocity helps normalize recent activity, but newer papers and fields may still be undercounted.</p>,
                },
                {
                  value: 'names',
                  title: 'Authors are disambiguated upstream',
                  content: <p className="accordion-copy">OpenAlex author identities are used as provided, with compact frontend artifacts rather than manual profile correction.</p>,
                },
              ]}
            />
          </CardContent>
        </Card>
      </section>

      <section className="information-band">
        <div>
          <Layers3 aria-hidden="true" />
          <strong>What earns space in the interface</strong>
          <p>Trend, geography, rankings, papers, and networks stay when they explain movement or expertise. Decorative widgets do not.</p>
        </div>
        <a href={atlas.source.url} target="_blank" rel="noreferrer">
          OpenAlex source
        </a>
      </section>
    </div>
  )
}
