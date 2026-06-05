import type { AtlasData } from '../data/types'
import { BookOpen, Compass, Database, ExternalLink, Layers3, ShieldCheck } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui'

interface MethodologyPageProps {
  atlas: AtlasData
}

export function MethodologyPage({ atlas }: MethodologyPageProps) {
  return (
    <div className="grid min-w-0 gap-3">
      <section className="flex min-w-0 items-start justify-between gap-[18px] pb-1 max-[760px]:flex-col max-[760px]:items-stretch">
        <div className="min-w-0">
          <span className="mb-2 inline-block text-[0.68rem] font-bold uppercase text-muted-foreground">About Research Atlas</span>
          <h1 className="m-0 font-display text-[clamp(1.7rem,2.08vw,1.9rem)] leading-[1.2] font-[740] tracking-[0]">About</h1>
          <p className="mt-2 mb-0 max-w-[820px] text-[0.91rem] leading-[1.55] text-muted-foreground [overflow-wrap:anywhere]">
            Research Atlas is a static research intelligence site for scanning fast-moving topics, visible researchers,
            institutional activity, papers, geography, and collaboration structure across curated OpenAlex profiles.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,1.18fr)_minmax(260px,0.92fr)_minmax(260px,0.92fr)] gap-2.5 max-[1160px]:grid-cols-1">
        <Card className="overflow-hidden border-[color-mix(in_srgb,var(--primary)_34%,var(--border))] bg-[linear-gradient(140deg,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_58%),var(--card)]">
          <CardHeader className="[&>svg]:size-[19px] [&>svg]:text-primary">
            <div>
              <CardTitle>What This Site Is</CardTitle>
              <CardDescription>An open research atlas, not a live search engine or ranking of scientific quality.</CardDescription>
            </div>
            <Compass aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="m-0 text-[0.8rem] leading-[1.6] text-muted-foreground">
              The interface is built for orientation. It helps readers notice where a topic is gaining momentum, who is
              becoming more visible, which institutions appear active, and how collaboration patterns are organized in
              the current public data snapshot.
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="[&>svg]:size-[19px] [&>svg]:text-primary">
            <div>
              <CardTitle>Data Source</CardTitle>
              <CardDescription>{atlas.source.notes}</CardDescription>
            </div>
            <Database aria-hidden="true" />
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="m-0 text-[0.8rem] leading-[1.6] text-muted-foreground">
              Research Atlas currently uses OpenAlex works, topics, authorships, institutions, countries, and sources.
              The published site ships compact static artifacts generated offline.
            </p>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <a href={atlas.source.url} target="_blank" rel="noopener noreferrer">
                OpenAlex
                <ExternalLink aria-hidden="true" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="[&>svg]:size-[19px] [&>svg]:text-primary">
            <div>
              <CardTitle>How To Use It</CardTitle>
              <CardDescription>Use the site as a discovery layer before deeper source-level review.</CardDescription>
            </div>
            <Layers3 aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="m-0 text-[0.8rem] leading-[1.6] text-muted-foreground">
              Start with Atlas for a topic profile, Trending for momentum discovery, Researchers for rising visibility,
              and Networks for collaboration structure. Follow paper and OpenAlex links when a signal needs validation.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)_minmax(280px,0.62fr)] gap-2.5 max-[1160px]:grid-cols-1">
        <Card>
          <CardHeader className="[&>svg]:size-[19px] [&>svg]:text-primary">
            <div>
              <CardTitle>Important Context</CardTitle>
              <CardDescription>Short caveats that should travel with every map, table, and graph.</CardDescription>
            </div>
            <ShieldCheck aria-hidden="true" />
          </CardHeader>
          <CardContent className="pt-2.5">
            <Accordion type="single" collapsible defaultValue="static" className="border-t border-border">
              <AccordionItem value="static" className="border-b border-border">
                <AccordionTrigger className="text-[0.83rem] hover:no-underline">The Public Site Is Static</AccordionTrigger>
                <AccordionContent>
                  <p className="m-0 text-[0.78rem] leading-[1.5] text-muted-foreground">
                    Data is collected and processed offline, then published as static JSON for GitHub Pages. A refresh
                    run creates a new snapshot; the browser does not query OpenAlex live.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="taxonomy" className="border-b border-border">
                <AccordionTrigger className="text-[0.83rem] hover:no-underline">Topic Navigation Follows OpenAlex</AccordionTrigger>
                <AccordionContent>
                  <p className="m-0 text-[0.78rem] leading-[1.5] text-muted-foreground">
                    Topics are organized around OpenAlex-style domain, field, subfield, and topic labels so the atlas can
                    grow without inventing a separate taxonomy.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="signals" className="border-b border-border">
                <AccordionTrigger className="text-[0.83rem] hover:no-underline">Signals Are Directional</AccordionTrigger>
                <AccordionContent>
                  <p className="m-0 text-[0.78rem] leading-[1.5] text-muted-foreground">
                    Phrases like momentum, rising visibility, and institution strength describe evidence inside the
                    snapshot. They are not claims about the best researchers, institutions, papers, or ideas.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="limits" className="border-b border-border">
                <AccordionTrigger className="text-[0.83rem] hover:no-underline">Public Scholarly Data Has Limits</AccordionTrigger>
                <AccordionContent>
                  <p className="m-0 text-[0.78rem] leading-[1.5] text-muted-foreground">
                    Topic assignment, citation counts, author identity resolution, and institution attribution depend on
                    OpenAlex records. Recent papers and newly emerging areas can be underrepresented.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-card-soft">
          <CardHeader className="[&>svg]:size-[19px] [&>svg]:text-primary">
            <div>
              <CardTitle>What Belongs Here</CardTitle>
              <CardDescription>The product stays useful by keeping only evidence-bearing views.</CardDescription>
            </div>
            <BookOpen aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="m-0 text-[0.8rem] leading-[1.6] text-muted-foreground">
              Charts, maps, tables, paper lists, and networks earn space when they help explain movement, expertise, or
              collaboration. Decorative widgets and opaque scores are intentionally kept out.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
