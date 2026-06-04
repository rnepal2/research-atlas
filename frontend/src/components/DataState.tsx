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
        <div className="max-w-[520px] rounded-card border border-border bg-card p-6 shadow-atlas">
          <h1 className="mt-0 mb-2 text-2xl font-bold">Loading Research Atlas</h1>
          <p className="m-0 text-muted-foreground">Preparing the static intelligence artifact.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="max-w-[520px] rounded-card border border-border bg-card p-6 shadow-atlas">
          <h1 className="mt-0 mb-2 text-2xl font-bold">Data artifact unavailable</h1>
          <p className="m-0 text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return children
}
