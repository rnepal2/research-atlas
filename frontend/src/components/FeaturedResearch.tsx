import { ArrowUpRight } from 'lucide-react'
import type { AtlasData } from '../data/types'
import type { ResearchLandscape } from '../data/research'
import { featuredCollections } from '../lib/researchScope'

export function FeaturedResearch({
  atlas,
  landscape,
  onSelect,
}: {
  atlas: AtlasData
  landscape: ResearchLandscape
  onSelect: (slug: string) => void
}) {
  return (
    <section className="featured-research" aria-label="Selected topics across fields">
      <header>
        <div>
          <h2>Topics across fields.</h2>
          <p>Selected areas to explore—not a trend ranking.</p>
        </div>
        <button className="featured-browse" onClick={() => onSelect('all')}>
          Browse all covered topics <ArrowUpRight size={14} />
        </button>
      </header>
      <div className="featured-columns">
        {featuredCollections.map((collection) => (
          <section key={collection.title}>
            <h3>{collection.title}</h3>
            <p>{collection.description}</p>
            {collection.slugs.map((slug) => {
              const topic = atlas.topics.find((t) => t.slug === slug)
              if (!topic) return null
              const count = landscape.topics.find((t) => t.slug === slug)?.count ?? 0
              return (
                <button key={slug} onClick={() => onSelect(slug)}>
                  <strong>{landscape.topics.find((t) => t.slug === slug)?.label || topic.label}</strong>
                  <span>{count ? `${count.toLocaleString()} papers` : 'Collection pending'}</span>
                  <ArrowUpRight size={14} />
                </button>
              )
            })}
          </section>
        ))}
      </div>
    </section>
  )
}
