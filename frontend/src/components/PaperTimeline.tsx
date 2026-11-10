import type { ResearchPoint } from '../data/research'

export function PaperTimeline({
  points,
  year,
  onYear,
}: {
  points: ResearchPoint[]
  year: number
  onYear: (year: number) => void
}) {
  const years = Array.from({ length: new Date().getFullYear() - 2017 + 1 }, (_, i) => 2017 + i)
  const counts = new Map<number, number>()
  for (const point of points) counts.set(point.year, (counts.get(point.year) || 0) + 1)
  const max = Math.max(1, ...counts.values())
  return (
    <section className="paper-timeline" aria-label="Collected papers by publication year">
      <div className="timeline-heading">
        <span>
          Collection coverage by year <small>not publication growth</small>
        </span>
        <button onClick={() => onYear(2017)}>{year === 2017 ? 'All years' : `Since ${year} · reset`}</button>
      </div>
      <div className="timeline-bars">
        {years.map((value, i) => (
          <button
            key={value}
            className={value >= year ? 'is-included' : ''}
            onClick={() => onYear(value)}
            aria-label={`${value}${i === years.length - 1 ? ' year to date' : ''}: ${(counts.get(value) || 0).toLocaleString()} collected papers. Show this year onward.`}
          >
            <span className="timeline-tooltip">
              {value} · {(counts.get(value) || 0).toLocaleString()} papers
              {i === years.length - 1 ? ' · YTD' : ''}
            </span>
            <span className="timeline-bar-track">
              <span
                style={{
                  height: `${counts.get(value) ? Math.max(2, ((counts.get(value) || 0) / max) * 100) : 0}%`,
                }}
              />
            </span>
            <span className="timeline-year">
              {value}
              {i === years.length - 1 ? '*' : ''}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
