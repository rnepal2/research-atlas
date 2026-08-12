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
  const margin = { top: 24, right: 28, bottom: 42, left: 58 }
  const currentYear = new Date().getFullYear()
  const includesCurrentYear = visibleRows.at(-1)?.year === currentYear
  const completedRows = includesCurrentYear ? visibleRows.slice(0, -1) : visibleRows
  const partialRows = includesCurrentYear ? visibleRows.slice(-2) : []
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
  const line = d3
    .line<YearlyMetric>()
    .x((row) => x(row.year) || 0)
    .y((row) => yWorks(row.works))
    .curve(d3.curveCatmullRom.alpha(0.55))
  const workLine = line(completedRows)
  const partialLine = line(partialRows)
  const workArea =
    d3
      .area<YearlyMetric>()
      .x((row) => x(row.year) || 0)
      .y0(height - margin.bottom)
      .y1((row) => yWorks(row.works))
      .curve(d3.curveCatmullRom.alpha(0.55))(visibleRows) || ''

  const yTicks = yWorks.ticks(4)
  const xTicks = visibleRows.filter((_, index) => index % 2 === 0 || index === visibleRows.length - 1)

  return (
    <div className="min-h-[326px] max-[760px]:min-h-[300px]">
      <div className="mb-2 flex justify-end">
        <div
          className="inline-flex gap-1 rounded-[7px] border border-border bg-[color-mix(in_srgb,var(--card-solid)_82%,transparent)] p-[3px]"
          aria-label="Publication trend range"
        >
          <Button className="min-h-[26px] px-[9px] text-[0.68rem]" variant={range === '5y' ? 'default' : 'ghost'} size="sm" type="button" onClick={() => setRange('5y')}>
            5Y
          </Button>
          <Button className="min-h-[26px] px-[9px] text-[0.68rem]" variant={range === '10y' ? 'default' : 'ghost'} size="sm" type="button" onClick={() => setRange('10y')}>
            10Y
          </Button>
        </div>
      </div>
      <svg className="w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Annual matched research works trend">
        <defs>
          <linearGradient id="works-area-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => (
          <g key={tick}>
            <line className="stroke-[color-mix(in_srgb,var(--foreground)_16%,transparent)] [stroke-width:1]" x1={margin.left} x2={width - margin.right} y1={yWorks(tick)} y2={yWorks(tick)} />
            <text className="fill-muted-foreground text-[11px]" x={margin.left - 12} y={yWorks(tick) + 4} textAnchor="end">
              {formatCompact(tick)}
            </text>
          </g>
        ))}
        {xTicks.map((row) => (
          <text key={row.year} className="fill-muted-foreground text-[11px]" x={x(row.year)} y={height - 8} textAnchor="middle">
            {row.year === currentYear ? `${row.year} YTD` : row.year}
          </text>
        ))}
        <text className="fill-[color-mix(in_srgb,var(--foreground)_74%,transparent)] text-[11px] font-bold" x={margin.left} y={15}>
          Works
        </text>
        <path className="fill-[url(#works-area-gradient)]" d={workArea} />
        {workLine && <path className="fill-none stroke-chart-primary [stroke-width:3.2]" d={workLine} />}
        {partialLine && <path className="fill-none stroke-chart-primary [stroke-dasharray:6_6] [stroke-width:3.2]" d={partialLine} />}
        {visibleRows.map((row) => (
          <g key={row.year}>
            <circle className={row.year === currentYear ? 'fill-card-solid stroke-chart-primary [stroke-dasharray:3_2] [stroke-width:2.2]' : 'fill-card-solid stroke-chart-primary [stroke-width:2.2]'} cx={x(row.year)} cy={yWorks(row.works)} r={4.5}>
              <title>
                {row.year}{row.year === currentYear ? ' YTD' : ''}: {formatCompact(row.works)} matched works
              </title>
            </circle>
          </g>
        ))}
      </svg>
      <div className="-mt-1 flex items-center gap-4 text-[0.74rem] text-muted-foreground">
        <span className="inline-flex items-center gap-[7px]">
          <span className="size-[7px] rounded-full bg-primary" />
          Matched works
        </span>
        {includesCurrentYear && <span>Dashed segment: year to date</span>}
      </div>
    </div>
  )
}
