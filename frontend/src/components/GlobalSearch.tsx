import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AtlasData } from '../data/types'
import { navigate } from '../lib/router'
import { Input } from './ui'

interface GlobalSearchProps {
  atlas: AtlasData
}

export function GlobalSearch({ atlas }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return []
    }
    const index = atlas.searchIndex?.length
      ? atlas.searchIndex
      : atlas.topics.map((topic) => ({
          type: 'topic' as const,
          label: topic.label,
          description: topic.description,
          meta: `${topic.domain} / ${topic.field}`,
          path: `/topic/${topic.slug}`,
          score: topic.metrics.trendScore,
        }))
    return index
      .filter((item) => `${item.label} ${item.description} ${item.meta} ${item.type}`.toLowerCase().includes(normalized))
      .slice(0, 9)
  }, [atlas.searchIndex, atlas.topics, query])

  return (
    <div className="relative min-w-0 flex-[0_1_420px] w-[min(420px,36vw)] max-[760px]:w-full max-[760px]:flex-none">
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-[color-mix(in_srgb,var(--foreground)_58%,var(--muted-foreground))]" />
      <Input
        className="bg-[color-mix(in_srgb,var(--card-solid)_90%,transparent)] pl-10 pr-3 text-[0.88rem] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-[color-mix(in_srgb,var(--muted-foreground)_84%,transparent)] dark:bg-[color-mix(in_srgb,var(--card-solid)_78%,transparent)]"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search topics, fields, domains"
        aria-label="Search topics, fields, domains"
      />
      {matches.length > 0 && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 rounded-card border border-border bg-[color-mix(in_srgb,var(--card-solid)_96%,#ffffff)] p-1.5 shadow-atlas">
          {matches.map((topic) => (
            <button
              className="grid w-full cursor-pointer gap-0.5 rounded-md bg-transparent px-2.5 py-[9px] text-left text-foreground hover:bg-secondary"
              type="button"
              key={`${topic.type}-${topic.label}-${topic.path}`}
              onClick={() => {
                setQuery('')
                navigate(topic.path)
              }}
            >
              <span>{topic.label}</span>
              <small className="text-[0.72rem] text-muted-foreground">
                {topic.type} / {topic.meta}
              </small>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
