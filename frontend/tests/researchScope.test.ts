import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeScope,
  topicSlugs,
  inScope,
  carryScope,
  readScope,
  sharedScopeSearch,
} from '../src/lib/researchScope.ts'
import { completedPeriod, indexedSeries } from '../src/lib/researchTrends.ts'
import { scopeEntities } from '../src/lib/scopedEntities.ts'
import type { ResearchPoint } from '../src/data/research.ts'

const topics = [
  { slug: 'llm', label: 'LLM', field: 'Computer Science' },
  { slug: 'physics', label: 'Physics', field: 'Physics and Astronomy' },
]
test('legacy topic links infer their field; field and topic changes cannot conflict', () => {
  assert.deepEqual(readScope(topics, '?topic=physics'), { field: 'Physics and Astronomy', topic: 'physics' })
  assert.deepEqual(normalizeScope(topics, 'invalid', 'bad'), { field: 'all', topic: 'all' })
  assert.deepEqual(normalizeScope(topics, 'Physics and Astronomy', 'all'), {
    field: 'Physics and Astronomy',
    topic: 'all',
  })
  const slugs = topicSlugs(topics, { field: 'Physics and Astronomy', topic: 'all' })
  assert.equal(inScope({ topics: ['llm'] }, slugs), false)
  assert.equal(inScope({ topics: ['physics', 'llm'] }, slugs), true)
  assert.equal(
    carryScope('/trending', '?field=Physics&topic=physics&paper=W1&camera=bad'),
    '/trending?field=Physics&topic=physics',
  )
  assert.equal(
    sharedScopeSearch('?field=Physics&topic=physics&camera=changed'),
    'field=Physics&topic=physics',
  )
  assert.equal(
    carryScope('/connections', sharedScopeSearch('?field=Physics&snapshot=abc')),
    '/connections?field=Physics&snapshot=abc',
  )
})
test('completed-period growth excludes YTD and does not invent zero baselines or missing years', () => {
  const rows = Array.from({ length: 10 }, (_, i) => ({ year: 2017 + i, works: i < 6 ? 10 : 20 }))
  rows[9].works = 999999
  assert.deepEqual(completedPeriod(rows, 2026), { previous: 30, recent: 60, growth: 1 })
  assert.equal(completedPeriod(rows.slice(-3), 2026).recent, null)
  assert.equal(
    completedPeriod(
      rows.map((r) => ({ ...r, works: 0 })),
      2026,
    ).growth,
    null,
  )
  assert.equal(indexedSeries([{ label: 'A', rows: [{ year: 2020, works: 0 }] }]), null)
  const index = indexedSeries([
    {
      label: 'A',
      rows: [
        { year: 2020, works: 0 },
        { year: 2021, works: 10 },
      ],
    },
    {
      label: 'B',
      rows: [
        { year: 2020, works: 1 },
        { year: 2021, works: 20 },
      ],
    },
  ])
  assert.equal(index?.baseline, 2021)
  assert.equal(index?.series[1].rows[0].works, 100)
})
test('scoped author and institution impact is recomputed from paper evidence, retaining unresolved credit', () => {
  const papers = [{ id: 'W1', citations: 120, creditDivisor: 3 }] as ResearchPoint[]
  const rows = [{ id: 'A1', name: 'One', works: ['W1', 'W2'], citations: 1000 }]
  assert.equal(scopeEntities(rows, papers, 'authors')[0].citations, 40)
  assert.equal(scopeEntities(rows, papers, 'institutions')[0].citations, 120)
  assert.deepEqual(scopeEntities(rows, papers, 'authors')[0].works, ['W1'])
  assert.equal(
    scopeEntities(rows, [{ ...papers[0], creditDivisor: undefined }], 'authors')[0].citations,
    null,
  )
})
