import * as d3 from 'd3'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology as TopologySpec } from 'topojson-specification'
import countriesUrl from 'world-atlas/countries-110m.json?url'
import type { CountryMetric } from '../data/types'
import { formatCompact } from '../lib/format'

const countryNames: Record<string, string> = {
  AR: 'Argentina',
  AU: 'Australia',
  BR: 'Brazil',
  CA: 'Canada',
  CH: 'Switzerland',
  CN: 'China',
  DE: 'Germany',
  DK: 'Denmark',
  ES: 'Spain',
  FR: 'France',
  GB: 'United Kingdom',
  IL: 'Israel',
  IN: 'India',
  IT: 'Italy',
  JP: 'Japan',
  KR: 'South Korea',
  MX: 'Mexico',
  NL: 'Netherlands',
  SE: 'Sweden',
  SG: 'Singapore',
  US: 'United States of America',
  ZA: 'South Africa',
}

interface DensityMapProps {
  rows: CountryMetric[]
}

interface MapFeature {
  type: 'Feature'
  id?: string
  properties: {
    name?: string
  }
  geometry: unknown
}

interface WorldTopology extends TopologySpec {
  objects: {
    countries: GeometryCollection
  }
}

export function DensityMap({ rows }: DensityMapProps) {
  const [features, setFeatures] = useState<MapFeature[]>([])
  const metricsByName = useMemo(() => {
    const entries = rows.map((row) => [countryNames[row.country] || row.country, row] as const)
    return new Map(entries)
  }, [rows])
  const maxWorks = Math.max(...rows.map((row) => row.works), 1)

  useEffect(() => {
    let cancelled = false
    fetch(countriesUrl)
      .then((response) => response.json())
      .then((topology: WorldTopology) => {
        if (cancelled) {
          return
        }
        const collection = feature(topology, topology.objects.countries) as unknown as { features: MapFeature[] }
        setFeatures(collection.features)
      })
      .catch(() => setFeatures([]))
    return () => {
      cancelled = true
    }
  }, [])

  const width = 760
  const height = 420
  const projection = d3.geoNaturalEarth1().fitExtent(
    [
      [18, 22],
      [width - 18, height - 22],
    ],
    { type: 'Sphere' },
  )
  const path = d3.geoPath(projection)
  const ranked = rows.slice(0, 8)

  return (
    <div className="density-map density-map-projected" aria-label="Country research density map">
      <svg className="density-map-svg" viewBox={`0 0 ${width} ${height}`} role="img">
        <defs>
          <linearGradient id="country-fill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path className="map-sphere" d={path({ type: 'Sphere' }) || ''} />
        {features.map((item) => {
          const name = item.properties.name || ''
          const metric = metricsByName.get(name)
          const active = Boolean(metric)
          const value = metric ? Math.max(0.16, metric.works / maxWorks) : 0
          return (
            <path
              className={`map-country ${active ? 'is-active' : ''}`}
              d={path(item as d3.GeoPermissibleObjects) || ''}
              key={item.id || name}
              style={{ '--v': value } as React.CSSProperties}
            >
              <title>{metric ? `${name}: ${metric.works} works` : name}</title>
            </path>
          )
        })}
      </svg>
      <ol className="country-rank-list">
        {ranked.map((row, index) => (
          <li key={row.country}>
            <span>{index + 1}</span>
            <strong>{countryNames[row.country]?.replace('United States of America', 'United States') || row.country}</strong>
            <em>{formatCompact(row.works)}</em>
          </li>
        ))}
      </ol>
    </div>
  )
}
