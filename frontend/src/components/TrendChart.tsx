import * as d3 from 'd3'
import { useState } from 'react'
import type { YearlyMetric } from '../data/types'
import { formatCompact } from '../lib/format'
import { Button } from './ui'

interface TrendChartProps {
  rows: YearlyMetric[]
}

export function TrendChart({ rows }: TrendChartProps) {
  const [range, setRange] = useState<'5y' | '10y'>('10y')
  const visibleRows = range === '5y' ? rows.slice(-5) : rows
  const width = 820
  const height = 330
  const margin = { top: 24, right: 70, bottom: 42, left: 52 }
  const x = d3
    .scalePoint<number>()
    .domain(visibleRows.map((row) => row.year))
    .range([margin.left, width - margin.right])
    .padding(0.5)
  const yWorks = d3
    .scaleLinear()
    .domain([0, d3.max(visibleRows, (row) => row.works) || 1])
    .nice()
    .range([height - margin.bottom, margin.top])
  const yVelocity = d3
    .scaleLinear()
    .domain([0, d3.max(visibleRows, (row) => row.citationVelocity) || 1])
    .nice()
    .range([height - margin.bottom, margin.top])
  const workLine = d3
    .line<YearlyMetric>()
    .x((row) => x(row.year) || 0)
    .y((row) => yWorks(row.works))
    .curve(d3.curveCatmullRom.alpha(0.55))(visibleRows)
  const citationLine = d3
    .line<YearlyMetric>()
    .x((row) => x(row.year) || 0)
    .y((row) => yVelocity(row.citationVelocity))
    .curve(d3.curveCatmullRom.alpha(0.55))(visibleRows)
  const workArea =
    d3
      .area<YearlyMetric>()
      .x((row) => x(row.year) || 0)
      .y0(height - margin.bottom)
      .y1((row) => yWorks(row.works))
      .curve(d3.curveCatmullRom.alpha(0.55))(visibleRows) || ''

  const yTicks = yWorks.ticks(4)
  const velocityTicks = yVelocity.ticks(4)
  const xTicks = visibleRows.filter((_, index) => index % 2 === 0 || index === visibleRows.length - 1)

  return (
    <div className="chart-frame">
      <div className="chart-controls" aria-label="Publication trend range">
        <Button variant={range === '5y' ? 'default' : 'ghost'} size="sm" type="button" onClick={() => setRange('5y')}>
          5Y
        </Button>
        <Button variant={range === '10y' ? 'default' : 'ghost'} size="sm" type="button" onClick={() => setRange('10y')}>
          10Y
        </Button>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Publication and citation velocity trend">
        <defs>
          <linearGradient id="works-area-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => (
          <g key={tick}>
            <line className="chart-grid-line" x1={margin.left} x2={width - margin.right} y1={yWorks(tick)} y2={yWorks(tick)} />
            <text className="axis-label" x={margin.left - 12} y={yWorks(tick) + 4} textAnchor="end">
              {formatCompact(tick)}
            </text>
          </g>
        ))}
        {velocityTicks.map((tick) => (
          <text key={tick} className="axis-label axis-label-right" x={width - margin.right + 14} y={yVelocity(tick) + 4}>
            {formatCompact(tick)}
          </text>
        ))}
        {xTicks.map((row) => (
          <text key={row.year} className="axis-label" x={x(row.year)} y={height - 8} textAnchor="middle">
            {row.year}
          </text>
        ))}
        <text className="axis-title" x={margin.left} y={15}>
          Works
        </text>
        <text className="axis-title axis-title-right" x={width - margin.right} y={15} textAnchor="end">
          Citation velocity
        </text>
        <path className="area-works" d={workArea} />
        {citationLine && <path className="line-citations" d={citationLine} />}
        {workLine && <path className="line-works" d={workLine} />}
        {visibleRows.map((row) => (
          <g key={row.year}>
            <circle className="chart-dot" cx={x(row.year)} cy={yWorks(row.works)} r={4.5}>
              <title>
                {row.year}: {formatCompact(row.works)} works
              </title>
            </circle>
            <circle className="chart-dot chart-dot-velocity" cx={x(row.year)} cy={yVelocity(row.citationVelocity)} r={3.5}>
              <title>
                {row.year}: {formatCompact(row.citationVelocity)} citation velocity
              </title>
            </circle>
          </g>
        ))}
      </svg>
      <div className="legend">
        <span>
          <span className="dot" />
          Works
        </span>
        <span>
          <span className="dot coral" />
          Citation velocity
        </span>
      </div>
    </div>
  )
}
