import type { ResearchPoint } from '../data/research'

export function downloadText(name: string, content: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportPapers(papers: ResearchPoint[], snapshot: string, format: 'csv' | 'bib') {
  const quote = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`
  const escape = (value: string) => value.replace(/[{}\\]/g, ' ')
  const content =
    format === 'csv'
      ? [
          'id,title,year,citations,snapshot',
          ...papers.map((p) => [p.id, p.title, p.year, p.citations, snapshot].map(quote).join(',')),
        ].join('\n')
      : papers
          .map(
            (p) =>
              `@misc{${p.id},\n title = {${escape(p.title)}},\n year = {${p.year}},\n url = {https://openalex.org/${p.id}},\n note = {Research Atlas snapshot ${snapshot}}\n}`,
          )
          .join('\n\n')
  downloadText(
    `research-atlas-${snapshot}.${format}`,
    content,
    format === 'csv' ? 'text/csv;charset=utf-8' : 'application/x-bibtex',
  )
}
