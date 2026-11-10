import { navigate } from '../lib/router'
import { Button } from './ui'

export function SnapshotNotice({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="snapshot-notice snapshot-switch" role="status">
      <p>{message}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const params = new URLSearchParams(location.search)
          for (const key of ['snapshot', 'camera', 'focus', 'cluster']) params.delete(key)
          const base = import.meta.env.BASE_URL.replace(/\/$/, '')
          navigate(location.pathname.slice(base.length) + '?' + params)
        }}
      >
        View latest release
      </Button>
    </div>
  )
}
