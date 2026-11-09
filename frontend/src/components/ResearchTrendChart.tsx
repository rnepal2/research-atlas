import { useEffect, useId, useRef, useState } from 'react'
import { scaleLinear, scalePoint, line } from 'd3'
import type { AnnualCount } from '../lib/researchTrends'
import { indexedSeries } from '../lib/researchTrends'
import { Button, Tabs, TabsList, TabsTrigger } from './ui'
import { formatCompact } from '../lib/format'

export function ResearchTrendChart({
  series,
  throughYear,
}: {
  series: { label: string; rows: AnnualCount[] }[]
  throughYear: number
}) {
  const id = useId()
  const container = useRef<HTMLDivElement>(null)
  const [measuredWidth, setMeasuredWidth] = useState(1000)
  const [range, setRange] = useState(10),
    [mode, setMode] = useState('counts')
  const [hover, setHover] = useState<number | null>(null)
  const visible = series.map((s) => ({ ...s, rows: s.rows.filter((r) => r.year > throughYear - range) }))
  const indexed = indexedSeries(visible)
  const data = mode === 'index' ? indexed?.series : visible
  const hasData = !!data
  useEffect(() => {
    if (!container.current) return
    const observer = new ResizeObserver(([entry]) =>
      setMeasuredWidth(Math.max(320, Math.min(1000, Math.round(entry.contentRect.width)))),
    )
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [hasData])
  const colors = ['var(--chart-primary)', 'var(--primary)']
  if (!data)
    return (
      <div className="research-empty" ref={container}>
        <p>No common nonzero baseline for an indexed comparison.</p>
        <Button onClick={() => setMode('counts')}>Show publication counts</Button>
      </div>
    )
  const years = [...new Set(data.flatMap((s) => s.rows.map((r) => r.year)))].sort()
  const width = measuredWidth,
    height = measuredWidth < 600 ? 280 : 330,
    left = measuredWidth < 600 ? 44 : 58,
    right = measuredWidth < 600 ? 12 : 25,
    top = 20,
    bottom = 42
  const x = scalePoint<number>()
    .domain(years)
    .range([left, width - right])
    .padding(0.25)
  const y = scaleLinear()
    .domain([0, Math.max(1, ...data.flatMap((s) => s.rows.map((r) => r.works)))])
    .nice()
    .range([height - bottom, top])
  const path = line<AnnualCount>()
    .x((r) => x(r.year)!)
    .y((r) => y(r.works))
  return (
    <div className="annual-chart" ref={container}>
      <div className="annual-chart-controls">
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList>
            <TabsTrigger value="counts">Publication counts</TabsTrigger>
            <TabsTrigger value="index">Indexed growth</TabsTrigger>
          </TabsList>
        </Tabs>
        <div>
          {[5, 10].map((n) => (
            <Button
              key={n}
              variant={range === n ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={range === n}
              onClick={() => {
                setRange(n)
                setHover(null)
              }}
            >
              {n} years
            </Button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>
          Annual publication queries: {series.map((s) => s.label).join(' and ')}
        </title>
        <desc id={`${id}-desc`}>
          Year-to-date observations are dashed.{' '}
          {mode === 'index' ? `Index equals 100 in ${indexed?.baseline}.` : 'Counts start at zero.'} Exact
          annual values are available below the chart.
        </desc>
        <text x={left} y={12}>{mode === 'index' ? `Index · ${indexed?.baseline} = 100` : 'Query-matched works'}</text>
        {y.ticks(4).map((tick) => (
          <g key={tick}>
            <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} className="annual-grid" />
            <text x={left - 12} y={y(tick) + 4} textAnchor="end">
              {formatCompact(tick)}
            </text>
          </g>
        ))}
        {years
          .filter((_, i) => measuredWidth >= 600 || i % 2 === 0 || i === years.length - 1)
          .map((year) => (
            <text key={year} x={x(year)} y={height - 12} textAnchor="middle">
              {year}
              {year === throughYear ? '*' : ''}
            </text>
          ))}
        {data.map((s, i) => (
          <g key={s.label}>
            <path
              d={path(s.rows.filter((r) => r.year < throughYear)) || ''}
              fill="none"
              stroke={colors[i]}
              strokeWidth={2.5}
            />
            <path
              d={path(s.rows.filter((r) => r.year >= throughYear - 1)) || ''}
              fill="none"
              stroke={colors[i]}
              strokeWidth={2.5}
              strokeDasharray="5 5"
            />
            {s.rows.map((r) => (
              <circle
                key={r.year}
                cx={x(r.year)}
                cy={y(r.works)}
                r={hover === r.year ? 5 : 3.5}
                fill="var(--card)"
                stroke={colors[i]}
                strokeWidth={2}
                tabIndex={0}
                aria-label={`${s.label}, ${r.year}${r.year === throughYear ? ' year to date' : ''}: ${Math.round(r.works).toLocaleString()} ${mode === 'index' ? 'index points' : 'query-matched works'}`}
                onFocus={() => setHover(r.year)}
                onBlur={() => setHover(null)}
                onPointerEnter={() => setHover(r.year)}
                onPointerLeave={() => setHover(null)}
              >
                <title>
                  {s.label} · {r.year}: {Math.round(r.works).toLocaleString()}
                </title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <div className="annual-legend">
        {data.map((s, i) => (
          <span key={s.label}>
            <i style={{ background: colors[i] }} />
            {s.label}
          </span>
        ))}
        <span>* {throughYear}: year to date</span>
      </div>
      <p className="annual-hover" aria-live="polite">
        {hover
          ? `${hover}${hover === throughYear ? ' YTD' : ''} · ${data.map((s) => `${s.label}: ${Math.round(s.rows.find((r) => r.year === hover)?.works || 0).toLocaleString()}`).join(' · ')}`
          : mode === 'index'
            ? `Common baseline: ${indexed?.baseline} = 100. Hover or focus a point for values.`
            : 'Hover or focus a point for annual query counts.'}
      </p>
      <details className="annual-values">
        <summary>View exact annual counts</summary>
        <div>
          <table>
            <thead>
              <tr>
                <th>Year</th>
                {series.map((s) => (
                  <th key={s.label}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series[0].rows.map((r) => (
                <tr key={r.year}>
                  <td>
                    {r.year}
                    {r.year === throughYear ? ' YTD' : ''}
                  </td>
                  {series.map((s) => (
                    <td key={s.label}>
                      {s.rows.find((row) => row.year === r.year)?.works.toLocaleString() ?? 'Unavailable'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
