import * as d3 from 'd3'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent, WheelEvent } from 'react'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology as TopologySpec } from 'topojson-specification'
import countriesUrl from 'world-atlas/countries-110m.json?url'
import type { CountryMetric } from '../data/types'
import { cx } from '../lib/cx'
import { formatCompact, formatPercent } from '../lib/format'
import { Button } from './ui'

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

const countryNames: Record<string, string> = {
  AE: 'United Arab Emirates',
  AR: 'Argentina',
  AT: 'Austria',
  AU: 'Australia',
  BD: 'Bangladesh',
  BE: 'Belgium',
  BR: 'Brazil',
  CA: 'Canada',
  CH: 'Switzerland',
  CL: 'Chile',
  CN: 'China',
  CO: 'Colombia',
  CZ: 'Czechia',
  DE: 'Germany',
  DK: 'Denmark',
  EG: 'Egypt',
  ES: 'Spain',
  ET: 'Ethiopia',
  FI: 'Finland',
  FR: 'France',
  GB: 'United Kingdom',
  GH: 'Ghana',
  GR: 'Greece',
  HK: 'Hong Kong',
  HU: 'Hungary',
  ID: 'Indonesia',
  IE: 'Ireland',
  IL: 'Israel',
  IN: 'India',
  IR: 'Iran',
  IT: 'Italy',
  JP: 'Japan',
  KE: 'Kenya',
  KR: 'South Korea',
  LB: 'Lebanon',
  MA: 'Morocco',
  MX: 'Mexico',
  MY: 'Malaysia',
  NG: 'Nigeria',
  NL: 'Netherlands',
  NO: 'Norway',
  NZ: 'New Zealand',
  PK: 'Pakistan',
  PL: 'Poland',
  PT: 'Portugal',
  RO: 'Romania',
  RU: 'Russia',
  SA: 'Saudi Arabia',
  SE: 'Sweden',
  SG: 'Singapore',
  TH: 'Thailand',
  TR: 'Turkey',
  TW: 'Taiwan',
  UA: 'Ukraine',
  US: 'United States',
  VN: 'Vietnam',
  ZA: 'South Africa',
}

const countryNumericIds: Record<string, string> = {
  AE: '784',
  AR: '032',
  AT: '040',
  AU: '036',
  BD: '050',
  BE: '056',
  BR: '076',
  CA: '124',
  CH: '756',
  CL: '152',
  CN: '156',
  CO: '170',
  CZ: '203',
  DE: '276',
  DK: '208',
  EG: '818',
  ES: '724',
  ET: '231',
  FI: '246',
  FR: '250',
  GB: '826',
  GH: '288',
  GR: '300',
  HK: '344',
  HU: '348',
  ID: '360',
  IE: '372',
  IL: '376',
  IN: '356',
  IR: '364',
  IT: '380',
  JP: '392',
  KE: '404',
  KR: '410',
  LB: '422',
  MA: '504',
  MX: '484',
  MY: '458',
  NG: '566',
  NL: '528',
  NO: '578',
  NZ: '554',
  PK: '586',
  PL: '616',
  PT: '620',
  RO: '642',
  RU: '643',
  SA: '682',
  SE: '752',
  SG: '702',
  TH: '764',
  TR: '792',
  TW: '158',
  UA: '804',
  US: '840',
  VN: '704',
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

interface CountryHover {
  x: number
  y: number
  name: string
  metric: CountryMetric
  share: number
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
  const [viewState, setViewState] = useState({ key: '', k: 1, x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [hover, setHover] = useState<CountryHover | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragStart = useRef<{ clientX: number; clientY: number } | null>(null)
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
  const mappedWorkTotal = Math.max(1, geoRows.reduce((total, row) => total + row.works, 0))
  const viewKey = useMemo(() => geoRows.map((row) => `${row.country}:${row.works}`).join('|'), [geoRows])
  const view = viewState.key === viewKey ? viewState : { key: viewKey, k: 1, x: 0, y: 0 }
  const ranked = geoRows.slice(0, 7)
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

  function updateZoom(factor: number, centerX = width / 2, centerY = height / 2) {
    setViewState((current) => {
      const base = current.key === viewKey ? current : { key: viewKey, k: 1, x: 0, y: 0 }
      const nextK = Math.min(4, Math.max(0.85, base.k * factor))
      const scale = nextK / base.k
      return {
        key: viewKey,
        k: nextK,
        x: centerX - (centerX - base.x) * scale,
        y: centerY - (centerY - base.y) * scale,
      }
    })
  }

  function resetView() {
    setViewState({ key: viewKey, k: 1, x: 0, y: 0 })
  }

  function countryName(code: string, featureName = '') {
    return countryNames[code] || (code.length === 2 ? regionNames.of(code) : undefined) || featureName || code
  }

  function setCountryHover(event: PointerEvent<SVGPathElement>, metric: CountryMetric, featureName: string) {
    const bounds = containerRef.current?.getBoundingClientRect()
    const x = Math.min(event.clientX - (bounds?.left || 0), Math.max(18, (bounds?.width || 0) - 248))
    const y = Math.min(event.clientY - (bounds?.top || 0), Math.max(18, (bounds?.height || 0) - 130))
    setHover({
      x,
      y,
      name: countryName(metric.country, featureName),
      metric,
      share: metric.workShare ?? metric.works / mappedWorkTotal,
    })
  }

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    dragStart.current = { clientX: event.clientX, clientY: event.clientY }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!dragStart.current) {
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const dx = ((event.clientX - dragStart.current.clientX) / rect.width) * width
    const dy = ((event.clientY - dragStart.current.clientY) / rect.height) * height
    dragStart.current = { clientX: event.clientX, clientY: event.clientY }
    setViewState((current) => {
      const base = current.key === viewKey ? current : { key: viewKey, k: 1, x: 0, y: 0 }
      return { ...base, x: base.x + dx, y: base.y + dy }
    })
  }

  function onPointerUp(event: PointerEvent<SVGSVGElement>) {
    dragStart.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function onWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = ((event.clientX - rect.left) / rect.width) * width
    const centerY = ((event.clientY - rect.top) / rect.height) * height
    updateZoom(event.deltaY > 0 ? 0.88 : 1.14, centerX, centerY)
  }

  return (
    <div
      ref={containerRef}
      className="relative grid min-h-[326px] grid-cols-[minmax(0,1fr)_132px] gap-3 overflow-hidden rounded-card border border-border bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px),radial-gradient(circle_at_28%_34%,rgba(54,215,199,0.14),transparent_22%),radial-gradient(circle_at_62%_38%,rgba(244,180,84,0.13),transparent_20%),rgba(255,255,255,0.02)] bg-[length:44px_44px,44px_44px,auto,auto,auto] p-2.5 max-[1160px]:grid-cols-1 max-[760px]:p-2"
      aria-label="Country research density map"
    >
      <div className="absolute top-3 left-3 z-[3] inline-flex overflow-hidden rounded-lg border border-border-strong bg-[color-mix(in_srgb,var(--card-solid)_90%,transparent)] shadow-atlas backdrop-blur-xl">
        <Button className="rounded-none border-0" variant="ghost" size="icon-xs" onClick={() => updateZoom(1.18)} aria-label="Zoom map in" title="Zoom in">
          <Plus aria-hidden="true" />
        </Button>
        <Button className="rounded-none border-x border-y-0 border-border" variant="ghost" size="icon-xs" onClick={() => updateZoom(0.85)} aria-label="Zoom map out" title="Zoom out">
          <Minus aria-hidden="true" />
        </Button>
        <Button className="rounded-none border-0" variant="ghost" size="icon-xs" onClick={resetView} aria-label="Reset map view" title="Reset view">
          <RotateCcw aria-hidden="true" />
        </Button>
      </div>
      <svg
        className={cx('h-full min-h-[296px] w-full touch-none select-none max-[760px]:min-h-[250px]', dragging ? 'cursor-grabbing' : 'cursor-grab')}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {sortedFeatures.map((item) => {
            const id = String(item.id).padStart(3, '0')
            const name = item.properties.name || ''
            const metric = metricsById.get(id)
            const active = Boolean(metric)
            const value = metric ? Math.max(0.12, metric.works / maxWorks) : 0
            const fillShare = Math.round(22 + value * 72)
            const hovered = metric ? hover?.metric.country === metric.country : false
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
                  strokeWidth: hovered ? 2.15 / view.k : active ? 0.95 / view.k : 0.35 / view.k,
                  filter: hovered ? 'drop-shadow(0 0 8px color-mix(in srgb, var(--chart-primary) 52%, transparent))' : undefined,
                }}
                onPointerEnter={metric ? (event) => setCountryHover(event, metric, name) : undefined}
                onPointerMove={metric ? (event) => setCountryHover(event, metric, name) : undefined}
                onPointerLeave={metric ? () => setHover(null) : undefined}
              >
                <title>{metric ? `${countryName(metric.country, name)}: ${metric.works} works` : name}</title>
              </path>
            )
          })}
        </g>
      </svg>
      {hover && (
        <div
          className="pointer-events-none absolute z-[5] grid w-[min(232px,calc(100%-24px))] gap-2 rounded-card border border-[color-mix(in_srgb,var(--primary)_36%,var(--border))] bg-[color-mix(in_srgb,var(--card-solid)_96%,#fff)] px-3 py-2.5 text-[0.72rem] shadow-atlas backdrop-blur-xl"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <div>
            <strong className="block text-[0.86rem] leading-tight text-foreground">{hover.name}</strong>
            <span className="text-muted-foreground">Mapped country activity</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="grid gap-0.5 rounded-card border border-border bg-card-soft p-2">
              <em className="not-italic font-bold text-foreground">{formatCompact(hover.metric.works)}</em>
              <span className="text-muted-foreground">works</span>
            </span>
            <span className="grid gap-0.5 rounded-card border border-border bg-card-soft p-2">
              <em className="not-italic font-bold text-foreground">{formatCompact(hover.metric.institutions)}</em>
              <span className="text-muted-foreground">institutions</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
            <span className="text-muted-foreground">{formatCompact(hover.metric.citations)} citations</span>
            <strong className="text-primary">{formatPercent(hover.share)} share</strong>
          </div>
        </div>
      )}
      <ol className="grid list-none content-center gap-2 p-0 m-0 max-[760px]:grid-cols-2">
        {ranked.map((row, index) => (
          <li className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-[7px] text-[0.72rem] text-muted-foreground" key={row.country}>
            <span>{index + 1}</span>
            <strong className="min-w-0 truncate font-semibold text-foreground">{countryName(row.country)}</strong>
            <em className="not-italic font-bold text-primary">{formatCompact(row.works)}</em>
          </li>
        ))}
      </ol>
    </div>
  )
}
