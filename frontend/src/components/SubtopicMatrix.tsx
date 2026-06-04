import type React from 'react'
import type { SubtopicMatrix as MatrixData } from '../data/types'

interface SubtopicMatrixProps {
  matrix: MatrixData
}

export function SubtopicMatrix({ matrix }: SubtopicMatrixProps) {
  const columns = matrix.columns.slice(0, 8)
  return (
    <div className="grid min-h-[430px] gap-3 max-[760px]:overflow-x-auto" aria-label="Institution by subtopic matrix">
      <div className="grid gap-1.5 overflow-x-auto">
        <div className="mb-1 grid grid-cols-[230px_repeat(8,minmax(54px,1fr))] items-center gap-1.5 max-[760px]:grid-cols-[180px_repeat(8,44px)]">
          <span className="truncate text-[0.74rem] font-[740] text-foreground">Institution</span>
          {columns.map((column) => (
            <span className="grid min-h-12 items-end justify-items-center whitespace-normal text-center text-[0.74rem] font-[740] text-foreground" key={column} title={column}>
              {column.split(' ').slice(0, 2).join(' ')}
            </span>
          ))}
        </div>
        {matrix.rows.slice(0, 10).map((row) => (
          <div className="grid grid-cols-[230px_repeat(8,minmax(54px,1fr))] items-center gap-1.5 max-[760px]:grid-cols-[180px_repeat(8,44px)]" key={row.institution}>
            <span className="truncate text-[0.74rem] font-[740] text-foreground" title={row.institution}>
              {row.institution}
              {row.country && <em className="block text-[0.66rem] font-semibold not-italic text-muted-foreground">{row.country}</em>}
            </span>
            {columns.map((column) => {
              const value = row.values.find((item) => item.subtopic === column)?.value || 0
              return (
                <span
                  className="h-[34px] rounded-md border border-border [background:linear-gradient(135deg,color-mix(in_srgb,var(--chart-warm)_calc(var(--v)_*_22%),transparent),transparent),color-mix(in_srgb,var(--chart-primary)_calc(var(--v)_*_82%),rgba(255,255,255,0.035))]"
                  style={{ '--v': value } as React.CSSProperties}
                  key={column}
                  title={`${row.institution}: ${column}`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[0.72rem] font-semibold text-muted-foreground">
        <span>Low</span>
        <span className="h-2 w-28 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.04),var(--chart-primary),var(--chart-warm))]" />
        <span>High</span>
        <span className="text-muted-foreground">Normalized activity by institution and subtopic</span>
      </div>
    </div>
  )
}
