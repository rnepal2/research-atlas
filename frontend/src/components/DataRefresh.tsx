import { useEffect, useState } from 'react'
import { formatDate } from '../lib/format'

export function DataRefresh({ fallback, path }: { fallback: string; path: string }) {
  const focused = ['/', '/explore', '/trending', '/connections', '/people', '/networks'].includes(path)
  const requested = new URLSearchParams(location.search).get('snapshot')
  const snapshot = requested && /^[a-f0-9]{16}$/.test(requested) ? requested : ''
  const key = focused ? snapshot || 'latest' : 'profiles'
  const [observed, setObserved] = useState({ key: '', date: '' })
  useEffect(() => {
    if (!focused) return
    const controller = new AbortController()
    const file = snapshot ? `snapshots/${snapshot}/manifest.json` : 'research-manifest.json'
    void fetch(`${import.meta.env.BASE_URL}research/${file}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Date unavailable')
        return response.json()
      })
      .then((manifest) => {
        if (!controller.signal.aborted && Number.isFinite(Date.parse(manifest.processedAt)))
          setObserved({ key, date: manifest.processedAt })
      })
      .catch(() => {
        if (!controller.signal.aborted) setObserved({ key, date: '' })
      })
    return () => controller.abort()
  }, [focused, snapshot, key])
  const date = focused ? (observed.key === key ? observed.date : '') : fallback
  return (
    <div
      className="workspace-dateline"
      title={
        focused
          ? 'Research snapshot build date. Individual records and annual queries retain their own observation dates.'
          : 'Topic profile refresh date.'
      }
    >
      <span>Data Refresh</span>
      {date ? (
        <time dateTime={date}>{formatDate(date)}</time>
      ) : (
        <span>{observed.key === key ? 'Date unavailable' : 'Loading…'}</span>
      )}
    </div>
  )
}
