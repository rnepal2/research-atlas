import type React from 'react'

interface DataStateProps {
  loading: boolean
  error: string | null
  children: React.ReactNode
}

export function DataState({ loading, error, children }: DataStateProps) {
  if (loading) {
    return (
      <div className="state-screen">
        <div className="state-box">
          <h1>Loading Research Atlas</h1>
          <p>Preparing the static intelligence artifact.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="state-screen">
        <div className="state-box">
          <h1>Data artifact unavailable</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return children
}
