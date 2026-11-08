import { ArrowRight, Compass, Moon, Sun } from 'lucide-react'
import type { AtlasData } from '../data/types'
import { Button } from '../components/ui'
import { hrefFor, navigate } from '../lib/router'
import { useResearch } from '../data/research'

export function OverviewPage({
  atlas,
  onThemeChange,
  theme,
}: {
  atlas: AtlasData
  onThemeChange: () => void
  theme: 'dark' | 'light'
}) {
  const { manifest, landscape } = useResearch()
  const topics = [
    'large-language-models',
    'ai-agents',
    'retrieval-augmented-generation',
    'llm-evaluation',
    'multimodal-foundation-models',
    'ai-safety-alignment',
  ].flatMap((slug) => atlas.topics.filter((t) => t.slug === slug))
  return (
    <div className="overview-page">
      <header className="research-header">
        <span className="eyebrow">RESEARCH ATLAS / THE AI EDITION</span>
        <Button variant="ghost" size="icon" onClick={onThemeChange} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </header>
      <section className="observatory-hero">
        <div>
          <span className="edition-label">A clearer view of a changing field</span>
          <h1>
            Understand where
            <br />
            research is going.
          </h1>
          <p>
            Follow ideas across papers, people and time. Explore the evidence behind emerging themes in AI—and
            find your next direction.
          </p>
          <div className="research-actions">
            <Button size="lg" onClick={() => navigate('/explore')}>
              Explore the landscape <ArrowRight size={17} />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/compare')}>
              Compare research areas
            </Button>
          </div>
          <p className="hero-footnote">
            OpenAlex data ·{' '}
            {manifest
              ? `${manifest.uniqueWorks.toLocaleString()} unique papers in the focused landscape`
              : 'Curated topic profiles'}{' '}
            · Coverage is explicit, not assumed.
          </p>
        </div>
        <div className="hero-index">
          <Compass size={30} />
          <span className="eyebrow">YOUR STARTING POINTS</span>
          {topics.slice(0, 4).map((t, i) => (
            <a key={t.slug} href={hrefFor(`/explore?topic=${t.slug}`)}>
              <span>0{i + 1}</span>
              <strong>{t.label}</strong>
              <ArrowRight size={17} />
            </a>
          ))}
        </div>
      </section>
      <section className="overview-section">
        <div className="section-intro">
          <div>
            <span className="eyebrow">RESEARCH AREAS</span>
            <h2>Go deeper, one question at a time.</h2>
          </div>
          <p>
            Annual publication totals provide context. People and relationships come from bounded work
            samples.
          </p>
        </div>
        <div className="topic-grid">
          {topics.map((t) => (
            <article className="topic-story" key={t.slug}>
              <span className="eyebrow">{t.workArea}</span>
              <h3>{t.label}</h3>
              <p>{t.description}</p>
              <div className="story-numbers">
                <strong>
                  {t.metrics.worksLast3Years.toLocaleString()}
                  <span>query-matched works · three completed years</span>
                </strong>
                <strong>
                  {(
                    landscape?.topics.find((p) => p.slug === t.slug)?.count ?? t.quality.worksCollected
                  ).toLocaleString()}
                  <span>papers available for exploration</span>
                </strong>
              </div>
              <div className="research-actions">
                <Button variant="ghost" onClick={() => navigate(`/explore?topic=${t.slug}`)}>
                  Explore papers <ArrowRight size={15} />
                </Button>
                <Button variant="ghost" onClick={() => navigate(`/topic/${t.slug}`)}>
                  Topic profile
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="method-strip">
        <div>
          <span className="eyebrow">BUILT FOR INVESTIGATION</span>
          <h2>Every insight should lead to evidence.</h2>
          <p>
            Explore a theme, inspect its papers, and keep a reading list. Shared views preserve filters and a
            snapshot identifier. Research Atlas makes coverage and uncertainty part of the experience.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/about')}>
          Methods & data <ArrowRight size={16} />
        </Button>
      </section>
    </div>
  )
}
