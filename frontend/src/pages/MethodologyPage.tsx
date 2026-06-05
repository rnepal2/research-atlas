import type { AtlasData } from '../data/types'
import { formatNumber, formatPercent } from '../lib/format'
import { Activity, Compass, Database, Layers3, RefreshCw, ShieldCheck, ExternalLink } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui'

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
    <div className="grid min-w-0 gap-3">
      <section className="flex min-w-0 items-start justify-between gap-[18px] pb-1 max-[760px]:flex-col max-[760px]:items-stretch">
        <div className="min-w-0">
          <span className="mb-2 inline-block text-[0.68rem] font-bold uppercase text-muted-foreground">About Research Atlas</span>
          <h1 className="m-0 font-display text-[clamp(1.7rem,2.08vw,1.9rem)] leading-[1.2] font-[740] tracking-[0]">About</h1>
          <p className="mt-2 mb-0 max-w-[820px] text-[0.91rem] leading-[1.55] text-muted-foreground [overflow-wrap:anywhere]">
            Research Atlas is an OpenAlex intelligence dashboard for exploring research momentum, visible researchers,
            institutional activity, papers, geography, and collaboration structure across curated topic profiles.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,1.22fr)_minmax(260px,0.9fr)_minmax(260px,0.9fr)] gap-2.5 max-[1160px]:grid-cols-1">
        <Card className="overflow-hidden border-[color-mix(in_srgb,var(--primary)_36%,var(--border))] bg-[linear-gradient(140deg,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_58%),var(--card)]">
          <CardHeader className="[&>svg]:size-[19px] [&>svg]:text-primary">
            <div>
              <CardTitle>What this site is</CardTitle>
              <CardDescription>Static research intelligence generated from OpenAlex and shipped as compact JSON.</CardDescription>
            </div>
            <Database aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="m-0 min-h-[72px] text-[0.78rem] leading-[1.55] text-muted-foreground">
              The site is designed for discovery: which topics are moving, where activity concentrates, which researchers
              are becoming more visible, and how collaboration networks are structured.
            </p>
            <div className="grid grid-cols-4 gap-2 max-[760px]:grid-cols-1">
              <span className="grid min-h-[72px] content-end gap-0.5 rounded-card border border-border bg-card-soft p-2.5 text-[0.72rem] font-bold text-muted-foreground">
                <strong className="text-[1.55rem] leading-none font-[720] text-foreground">{formatNumber(atlas.coverage?.configuredTopics || atlas.coverage?.topics || atlas.topics.length)}</strong>
                configured topics
              </span>
              <span className="grid min-h-[72px] content-end gap-0.5 rounded-card border border-border bg-card-soft p-2.5 text-[0.72rem] font-bold text-muted-foreground">
                <strong className="text-[1.55rem] leading-none font-[720] text-foreground">{formatNumber(atlas.coverage?.topics || atlas.topics.length)}</strong>
                collected profiles
              </span>
              <span className="grid min-h-[72px] content-end gap-0.5 rounded-card border border-border bg-card-soft p-2.5 text-[0.72rem] font-bold text-muted-foreground">
                <strong className="text-[1.55rem] leading-none font-[720] text-foreground">{formatNumber(atlas.coverage?.worksCollected || 0)}</strong>
                works collected
              </span>
              <span className="grid min-h-[72px] content-end gap-0.5 rounded-card border border-border bg-card-soft p-2.5 text-[0.72rem] font-bold text-muted-foreground">
                <strong className="text-[1.55rem] leading-none font-[720] text-foreground">{formatNumber(atlas.coverage?.mappedCountries || 0)}</strong>
                mapped countries
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="[&>svg]:size-[19px] [&>svg]:text-primary">
            <div>
              <CardTitle>Data model</CardTitle>
              <CardDescription>{atlas.source.notes}</CardDescription>
            </div>
            <RefreshCw aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[72px] items-center justify-between gap-2 text-[0.76rem] font-bold text-foreground">
              <span className="min-w-0 whitespace-nowrap rounded-full border border-border bg-card-soft px-[9px] py-[7px]">OpenAlex</span>
              <i className="h-px flex-1 bg-[linear-gradient(90deg,transparent,var(--primary),transparent)]" />
              <span className="min-w-0 whitespace-nowrap rounded-full border border-border bg-card-soft px-[9px] py-[7px]">Processor</span>
              <i className="h-px flex-1 bg-[linear-gradient(90deg,transparent,var(--primary),transparent)]" />
              <span className="min-w-0 whitespace-nowrap rounded-full border border-border bg-card-soft px-[9px] py-[7px]">Static site</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="[&>svg]:size-[19px] [&>svg]:text-primary">
            <div>
              <CardTitle>Interpretation posture</CardTitle>
              <CardDescription>Signals are directional, transparent, and intentionally modest.</CardDescription>
            </div>
            <ShieldCheck aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="m-0 min-h-[72px] text-[0.78rem] leading-[1.55] text-muted-foreground">
              The app says "rising visibility" and "strength signal" because OpenAlex artifacts are useful evidence,
              not final judgments about quality, prestige, or impact.
            </p>
            <div className="mt-3 rounded-card border border-border bg-card-soft p-2.5">
              <span className="block text-[0.68rem] font-bold uppercase text-muted-foreground">Average snapshot completeness</span>
              <strong className="text-[1.45rem] leading-none text-foreground">{formatNumber(atlas.coverage?.averageCompletenessScore || 0)}</strong>
              <span className="mt-1 block text-[0.72rem] text-muted-foreground">
                {formatNumber(atlas.coverage?.skippedTopics || 0)} configured topics are waiting on raw OpenAlex collection.
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <span className="rounded-card border border-border bg-card-soft p-2 text-[0.72rem] text-muted-foreground">
                <strong className="block text-[1.08rem] text-foreground">{formatPercent(atlas.coverage?.profileCompletionRate || 0)}</strong>
                profile completion
              </span>
              <span className="rounded-card border border-border bg-card-soft p-2 text-[0.72rem] text-muted-foreground">
                <strong className="block text-[1.08rem] text-foreground">{atlas.coverage?.latestPublicationYear || 'n/a'}</strong>
                latest represented year
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-2.5 max-[1160px]:grid-cols-1">
        <Card>
          <CardHeader className="[&>svg]:size-[19px] [&>svg]:text-primary">
            <div>
              <CardTitle>How to read the signals</CardTitle>
              <CardDescription>Scores are product signals for scanning and comparison, not final evaluations.</CardDescription>
            </div>
            <Activity aria-hidden="true" />
          </CardHeader>
          <CardContent className="pt-2.5">
            <Accordion type="single" collapsible defaultValue="trendScore" className="border-t border-border">
              {Object.entries(atlas.methodology).map(([key, value]) => (
                <AccordionItem value={key} key={key} className="border-b border-border">
                  <AccordionTrigger className="min-h-[46px] py-0 text-[0.83rem] hover:no-underline">{signalLabels[key] || key}</AccordionTrigger>
                  <AccordionContent>
                    <p className="m-0 text-[0.78rem] leading-[1.5] text-muted-foreground">{value}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="[&>svg]:size-[19px] [&>svg]:text-primary">
            <div>
              <CardTitle>Coverage and caveats</CardTitle>
              <CardDescription>Keep these limits attached to every leaderboard, map, and graph.</CardDescription>
            </div>
            <Compass aria-hidden="true" />
          </CardHeader>
          <CardContent className="pt-2.5">
            <Accordion type="single" collapsible defaultValue="coverage" className="border-t border-border">
              <AccordionItem value="coverage" className="border-b border-border">
                <AccordionTrigger className="min-h-[46px] py-0 text-[0.83rem] hover:no-underline">Coverage is curated</AccordionTrigger>
                <AccordionContent>
                  <p className="m-0 text-[0.78rem] leading-[1.5] text-muted-foreground">
                    The current snapshot includes {formatNumber(atlas.coverage?.topics || atlas.topics.length)} of {formatNumber(atlas.coverage?.configuredTopics || atlas.coverage?.topics || atlas.topics.length)} configured topic profiles, averaging {formatNumber(atlas.coverage?.averageWorksPerProfile || 0)} collected works per profile.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="depth" className="border-b border-border">
                <AccordionTrigger className="min-h-[46px] py-0 text-[0.83rem] hover:no-underline">Coverage depth is uneven</AccordionTrigger>
                <AccordionContent>
                  <p className="m-0 text-[0.78rem] leading-[1.5] text-muted-foreground">
                    Median topic depth is {formatNumber(atlas.coverage?.medianWorksPerProfile || 0)} works, with {formatNumber(atlas.coverage?.topicsBelowTargetDepth || 0)} topics below the current 5x depth target of {formatNumber(atlas.coverage?.coverageDepthTarget || 0)} works.
                  </p>
                  {atlas.coverage?.shallowestTopics?.length ? (
                    <div className="mt-3 grid gap-1.5">
                      {atlas.coverage.shallowestTopics.slice(0, 5).map((topic) => (
                        <a
                          className="flex items-center justify-between gap-3 rounded-card border border-border bg-card-soft px-2.5 py-2 text-[0.74rem] font-bold text-foreground hover:border-[color-mix(in_srgb,var(--primary)_48%,var(--border))]"
                          href={`/topic/${topic.slug}`}
                          key={topic.slug}
                        >
                          <span className="min-w-0 truncate">{topic.label}</span>
                          <span className="shrink-0 text-muted-foreground">{formatNumber(topic.worksCollected)} works</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="taxonomy" className="border-b border-border">
                <AccordionTrigger className="min-h-[46px] py-0 text-[0.83rem] hover:no-underline">Taxonomy follows OpenAlex</AccordionTrigger>
                <AccordionContent>
                  <p className="m-0 text-[0.78rem] leading-[1.5] text-muted-foreground">Topic navigation uses domain, field, subfield, and topic labels so future additions stay aligned with OpenAlex conventions.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="citations" className="border-b border-border">
                <AccordionTrigger className="min-h-[46px] py-0 text-[0.83rem] hover:no-underline">Citations lag reality</AccordionTrigger>
                <AccordionContent>
                  <p className="m-0 text-[0.78rem] leading-[1.5] text-muted-foreground">Citation velocity helps normalize recent activity, but newer papers and fields may still be undercounted.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="names" className="border-b border-border">
                <AccordionTrigger className="min-h-[46px] py-0 text-[0.83rem] hover:no-underline">Authors are disambiguated upstream</AccordionTrigger>
                <AccordionContent>
                  <p className="m-0 text-[0.78rem] leading-[1.5] text-muted-foreground">OpenAlex author identities are used as provided, with compact frontend artifacts rather than manual profile correction.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      <section className="flex items-center justify-between gap-[18px] rounded-card border border-border bg-[linear-gradient(90deg,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_62%),rgba(255,255,255,0.024)] p-3.5 max-[760px]:flex-col max-[760px]:items-stretch">
        <div className="grid min-w-0 grid-cols-[auto_1fr] gap-x-2.5 gap-y-[3px]">
          <Layers3 aria-hidden="true" className="row-span-2 size-[18px] text-primary" />
          <strong className="text-[0.86rem]">What earns space in the interface</strong>
          <p className="m-0 text-[0.76rem] text-muted-foreground">Trend, geography, rankings, papers, and networks stay when they explain movement, expertise, or collaboration. Decorative widgets do not.</p>
        </div>
        <a
          href={atlas.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-8 shrink-0 whitespace-nowrap rounded-card border border-border px-2.5 py-[7px] text-[0.74rem] font-bold text-primary"
        >
          OpenAlex
          <ExternalLink aria-hidden="true" className="inline ml-1" size={12} />
        </a>
      </section>
    </div>
  )
}
