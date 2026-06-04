import * as d3 from 'd3'
import { useEffect, useMemo, useState } from 'react'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology as TopologySpec } from 'topojson-specification'
import countriesUrl from 'world-atlas/countries-110m.json?url'
import type { CountryMetric } from '../data/types'
import { cx } from '../lib/cx'
import { formatCompact } from '../lib/format'

const countryNames: Record<string, string> = {
  AR: 'Argentina',
  AT: 'Austria',
  AU: 'Australia',
  BE: 'Belgium',
  BR: 'Brazil',
  CA: 'Canada',
  CH: 'Switzerland',
  CN: 'China',
  CZ: 'Czechia',
  DE: 'Germany',
  DK: 'Denmark',
  ES: 'Spain',
  FI: 'Finland',
  FR: 'France',
  GB: 'United Kingdom',
  GR: 'Greece',
  HK: 'Hong Kong',
  HU: 'Hungary',
  IE: 'Ireland',
  IL: 'Israel',
  IN: 'India',
  IT: 'Italy',
  JP: 'Japan',
  KR: 'South Korea',
  LB: 'Lebanon',
  MX: 'Mexico',
  NL: 'Netherlands',
  NO: 'Norway',
  NZ: 'New Zealand',
  PL: 'Poland',
  PT: 'Portugal',
  RU: 'Russia',
  SA: 'Saudi Arabia',
  SE: 'Sweden',
  SG: 'Singapore',
  TR: 'Turkey',
  TW: 'Taiwan',
  US: 'United States',
  ZA: 'South Africa',
}

const countryNumericIds: Record<string, string> = {
  AR: '032',
  AT: '040',
  AU: '036',
  BE: '056',
  BR: '076',
  CA: '124',
  CH: '756',
  CN: '156',
  CZ: '203',
  DE: '276',
  DK: '208',
  ES: '724',
  FI: '246',
  FR: '250',
  GB: '826',
  GR: '300',
  HK: '344',
  HU: '348',
  IE: '372',
  IL: '376',
  IN: '356',
  IT: '380',
  JP: '392',
  KR: '410',
  LB: '422',
  MX: '484',
  NL: '528',
  NO: '578',
  NZ: '554',
  PL: '616',
  PT: '620',
  RU: '643',
  SA: '682',
  SE: '752',
  SG: '702',
  TR: '792',
  TW: '158',
  US: '840',
  ZA: '710',
}

const countryCoordinates: Record<string, [number, number]> = {
  AR: [-63.62, -38.42],
  AT: [14.55, 47.52],
  AU: [133.78, -25.27],
  BE: [4.47, 50.5],
  BR: [-51.93, -14.24],
  CA: [-106.35, 56.13],
  CH: [8.23, 46.82],
  CN: [104.2, 35.86],
  CZ: [15.47, 49.82],
  DE: [10.45, 51.17],
  DK: [9.5, 56.26],
  ES: [-3.75, 40.46],
  FI: [25.75, 61.92],
  FR: [2.21, 46.23],
  GB: [-3.44, 55.38],
  GR: [21.82, 39.07],
  HK: [114.17, 22.32],
  HU: [19.5, 47.16],
  IE: [-8.24, 53.41],
  IL: [34.85, 31.05],
  IN: [78.96, 20.59],
  IT: [12.57, 41.87],
  JP: [138.25, 36.2],
  KR: [127.77, 35.91],
  LB: [35.86, 33.85],
  MX: [-102.55, 23.63],
  NL: [5.29, 52.13],
  NO: [8.47, 60.47],
  NZ: [174.89, -40.9],
  PL: [19.15, 51.92],
  PT: [-8.22, 39.4],
  RU: [105.32, 61.52],
  SA: [45.08, 23.89],
  SE: [18.64, 60.13],
  SG: [103.82, 1.35],
  TR: [35.24, 38.96],
  TW: [120.96, 23.7],
  US: [-95.71, 37.09],
  ZA: [22.94, -30.56],
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
  const metricsById = useMemo(() => {
    const entries = rows.flatMap((row) => {
      const id = countryNumericIds[row.country]
      return id ? ([[id, row] as const]) : []
    })
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
  const featureById = useMemo(() => new Map(features.map((item) => [String(item.id).padStart(3, '0'), item])), [features])
  const geoRows = useMemo(() => rows.filter((row) => row.country !== 'Unknown' && (countryNumericIds[row.country] || countryCoordinates[row.country])), [rows])
  const ranked = geoRows.slice(0, 8)
  const activeIds = useMemo(() => new Set(geoRows.map((row) => countryNumericIds[row.country]).filter(Boolean)), [geoRows])
  const activeFeatures = useMemo(() => features.filter((item) => activeIds.has(String(item.id).padStart(3, '0'))), [activeIds, features])
  const pointFeatures = useMemo(
    () =>
      geoRows.flatMap((row) => {
        const id = countryNumericIds[row.country]
        const coordinates = countryCoordinates[row.country]
        if (!coordinates || (id && featureById.has(id))) {
          return []
        }
        return [
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates },
          },
        ]
      }),
    [featureById, geoRows],
  )
  const mappedCountryCount = activeFeatures.length + pointFeatures.length
  const projection = useMemo(() => {
    const next = d3.geoMercator()
    const focusGeometry =
      activeFeatures.length > 0 || pointFeatures.length > 0
        ? ({ type: 'FeatureCollection', features: [...activeFeatures, ...pointFeatures] } as d3.GeoPermissibleObjects)
        : ({ type: 'Sphere' } as d3.GeoPermissibleObjects)
    next.fitExtent(
      [
        [28, 24],
        [width - 28, height - 30],
      ],
      focusGeometry,
    )
    return next
  }, [activeFeatures, pointFeatures])
  const path = useMemo(() => d3.geoPath(projection), [projection])
  const sortedFeatures = useMemo(
    () => [...features].sort((a, b) => Number(activeIds.has(String(a.id).padStart(3, '0'))) - Number(activeIds.has(String(b.id).padStart(3, '0')))),
    [activeIds, features],
  )
  const markers = ranked.flatMap((row) => {
    const id = countryNumericIds[row.country]
    const item = id ? featureById.get(id) : undefined
    const projected = item ? path.centroid(item as d3.GeoPermissibleObjects) : projection(countryCoordinates[row.country])
    if (!projected) {
      return []
    }
    const [x, y] = projected
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return []
    }
    return [{ row, x, y, pointOnly: !item, radius: 4.5 + Math.sqrt(row.works / maxWorks) * 16 }]
  })
  return (
    <div
      className="relative grid min-h-[326px] grid-cols-[minmax(0,1fr)_132px] gap-3 overflow-hidden rounded-card border border-border bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px),radial-gradient(circle_at_28%_34%,rgba(54,215,199,0.14),transparent_22%),radial-gradient(circle_at_62%_38%,rgba(244,180,84,0.13),transparent_20%),rgba(255,255,255,0.02)] bg-[length:44px_44px,44px_44px,auto,auto,auto] p-2.5 max-[1160px]:grid-cols-1 max-[760px]:p-2"
      aria-label="Country research density map"
    >
      <svg className="h-full min-h-[296px] w-full max-[760px]:min-h-[250px]" viewBox={`0 0 ${width} ${height}`} role="img">
        <defs>
          <linearGradient id="country-fill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity="0.9" />
          </linearGradient>
          <filter id="map-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {sortedFeatures.map((item) => {
          const id = String(item.id).padStart(3, '0')
          const name = item.properties.name || ''
          const metric = metricsById.get(id)
          const active = Boolean(metric)
          const value = metric ? Math.max(0.12, metric.works / maxWorks) : 0
          const fillShare = Math.round(22 + value * 72)
          return (
            <path
              className={cx(
                'transition-[fill,opacity,stroke-width] duration-150',
                active ? 'opacity-100' : 'opacity-35',
              )}
              d={path(item as d3.GeoPermissibleObjects) || ''}
              key={item.id || name}
              style={{
                fill: active ? `color-mix(in srgb, var(--chart-primary) ${fillShare}%, var(--card-solid))` : 'var(--map-country-fill)',
                stroke: active ? 'color-mix(in srgb, var(--chart-primary) 58%, var(--border))' : 'var(--map-country-stroke)',
                strokeWidth: active ? 0.95 : 0.35,
              }}
            >
              <title>{metric ? `${countryNames[metric.country] || name}: ${metric.works} works` : name}</title>
            </path>
          )
        })}
        {markers.map(({ row, x, y, pointOnly, radius }) => (
          <g key={`${row.country}-marker`} filter="url(#map-glow)">
            {pointOnly && <title>{`${countryNames[row.country] || row.country}: ${row.works} works`}</title>}
            <circle cx={x} cy={y} r={radius} fill="color-mix(in srgb, var(--chart-primary) 26%, transparent)" stroke="var(--chart-primary)" strokeWidth="1.5" />
            <circle cx={x} cy={y} r={Math.max(3.4, radius * 0.32)} fill="var(--card-solid)" stroke="var(--chart-primary)" strokeWidth="1" />
            <text x={x} y={y - radius - 5} textAnchor="middle" className="fill-foreground text-[11px] font-bold">
              {formatCompact(row.works)}
            </text>
          </g>
        ))}
        <text x="18" y="26" className="fill-muted-foreground text-[11px] font-bold uppercase">
          Focused View / {mappedCountryCount} Mapped Countries
        </text>
      </svg>
      <ol className="grid list-none content-center gap-2 p-0 m-0 max-[760px]:grid-cols-2">
        {ranked.map((row, index) => (
          <li className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-[7px] text-[0.72rem] text-muted-foreground" key={row.country}>
            <span>{index + 1}</span>
            <strong className="min-w-0 truncate font-semibold text-foreground">{countryNames[row.country] || row.country}</strong>
            <em className="not-italic font-bold text-primary">{formatCompact(row.works)}</em>
          </li>
        ))}
      </ol>
    </div>
  )
}
