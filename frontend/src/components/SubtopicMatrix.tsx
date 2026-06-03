import type React from 'react'
import type { SubtopicMatrix as MatrixData } from '../data/types'

interface SubtopicMatrixProps {
  matrix: MatrixData
}

export function SubtopicMatrix({ matrix }: SubtopicMatrixProps) {
  const columns = matrix.columns.slice(0, 8)
  return (
    <div className="matrix-panel" aria-label="Institution by subtopic matrix">
      <div className="matrix">
        <div className="matrix-row matrix-header-row">
          <span className="matrix-label">Institution</span>
          {columns.map((column) => (
            <span className="matrix-label matrix-column-label" key={column} title={column}>
              {column.split(' ').slice(0, 2).join(' ')}
            </span>
          ))}
        </div>
        {matrix.rows.slice(0, 10).map((row) => (
          <div className="matrix-row" key={row.institution}>
            <span className="matrix-label" title={row.institution}>
              {row.institution}
              {row.country && <em>{row.country}</em>}
            </span>
            {columns.map((column) => {
              const value = row.values.find((item) => item.subtopic === column)?.value || 0
              return <span className="matrix-cell" style={{ '--v': value } as React.CSSProperties} key={column} title={`${row.institution}: ${column}`} />
            })}
          </div>
        ))}
      </div>
      <div className="matrix-legend">
        <span>Low</span>
        <span className="matrix-ramp" />
        <span>High</span>
        <span className="muted">Normalized activity by institution and subtopic</span>
      </div>
    </div>
  )
}
