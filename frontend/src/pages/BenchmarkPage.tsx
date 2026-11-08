import { useEffect, useMemo, useState } from 'react'
import { PaperMap } from '../components/PaperMap'
import { Button } from '../components/ui'
import type { ResearchPoint } from '../data/research'

const clusters: [] = []
const references: string[] = []
const noop = () => {}

/** Synthetic fixtures are deliberately isolated from public research evidence. */
export function BenchmarkPage() {
  const [count, setCount] = useState(1000)
  const [timing, setTiming] = useState(0)
  const points = useMemo(() => {
    let seed = 42
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    return Array.from(
      { length: count },
      (_, i): ResearchPoint => ({
        id: `synthetic-${i}`,
        title: `Synthetic point ${i}`,
        year: 0,
        citations: 0,
        type: 'synthetic',
        cluster: i % 12,
        x: random() * 100,
        y: random() * 100,
        topics: [],
        shard: '',
        oa: false,
        retracted: false,
      }),
    )
  }, [count])
  useEffect(() => {
    let frame = 0
    const samples: number[] = []
    let previous = performance.now()
    function tick(now: number) {
      samples.push(now - previous)
      previous = now
      if (samples.length < 180) frame = requestAnimationFrame(tick)
      else setTiming(samples.sort((a, b) => a - b)[Math.floor(samples.length * 0.95)])
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [count])
  return (
    <div className="grid gap-5">
      <h1>Rendering benchmark · synthetic data</h1>
      <p>
        This fixture measures browser frame cadence while you pan and zoom. It does not measure corpus
        coverage or guarantee production performance. Device: {navigator.userAgent}
      </p>
      <div className="research-actions">
        {[1000, 10000, 50000, 100000].map((n) => (
          <Button key={n} variant={n === count ? 'secondary' : 'outline'} onClick={() => setCount(n)}>
            {n.toLocaleString()} points
          </Button>
        ))}
      </div>
      <p>
        Last 180-frame p95 interval: {timing.toFixed(1)} ms. Run with dev tools closed and record the device,
        viewport and interaction.
      </p>
      <div style={{ height: 550 }}>
        <PaperMap
          points={points}
          clusters={clusters}
          selected=""
          onSelect={noop}
          references={references}
          onCamera={noop}
        />
      </div>
    </div>
  )
}
