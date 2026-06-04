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
    return atlas.topics
      .filter((topic) => `${topic.label} ${topic.domain} ${topic.field} ${topic.subfield} ${topic.workArea}`.toLowerCase().includes(normalized))
      .slice(0, 8)
  }, [atlas.topics, query])

  return (
    <div className="relative min-w-0 flex-[0_1_420px] w-[min(420px,36vw)] max-[760px]:w-full max-[760px]:flex-none">
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-10"
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
              key={topic.slug}
              onClick={() => {
                setQuery('')
                navigate(`/topic/${topic.slug}`)
              }}
            >
              <span>{topic.label}</span>
              <small className="text-[0.72rem] text-muted-foreground">
                {topic.domain} / {topic.field}
              </small>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
