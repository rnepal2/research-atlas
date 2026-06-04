import { LoaderCircle } from 'lucide-react'
import type React from 'react'

interface DataStateProps {
  loading: boolean
  error: string | null
  children: React.ReactNode
}

export function DataState({ loading, error, children }: DataStateProps) {
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="w-full max-w-[520px] rounded-card border border-border bg-card p-6 shadow-atlas">
          <div className="flex items-center gap-3">
            <LoaderCircle className="mt-1 size-6 animate-spin text-primary" aria-hidden="true" />
            <div>
              <h1 className="mt-0 mb-2 text-2xl font-bold">Loading Research Atlas</h1>
              <p className="m-0 text-muted-foreground italic">Preparing the intelligence artifacts...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="w-full max-w-[520px] rounded-card border border-border bg-card p-6 shadow-atlas">
          <h1 className="mt-0 mb-2 text-2xl font-bold">Data artifacts unavailable</h1>
          <p className="m-0 text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return children
}
