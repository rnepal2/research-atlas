import { useEffect, useMemo, useRef, useState } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import type { ResearchPoint, ResearchLandscape } from '../data/research'
import { Button } from './ui'
import { densityGeometry, landscapeColor } from '../lib/landscape'

export function PaperMap({
  points,
  clusters,
  selected,
  onSelect,
  references,
  camera,
  onCamera,
  onSelection,
  synthetic = false,
  focusCluster = null,
  onFocusCluster,
  theme,
}: {
  points: ResearchPoint[]
  clusters: ResearchLandscape['clusters']
  selected: string
  onSelect: (id: string) => void
  references: string[]
  camera?: { x: number; y: number; ratio: number }
  onCamera: (value: { x: number; y: number; ratio: number }) => void
  onSelection?: (ids: string[]) => void
  synthetic?: boolean
  focusCluster?: number | null
  onFocusCluster?: (cluster: number | null) => void
  theme?: 'dark' | 'light'
}) {
  const container = useRef<HTMLDivElement>(null)
  const sigma = useRef<Sigma | null>(null)
  const select = useRef(onSelect)
  const saveCamera = useRef(onCamera)
  const initialCamera = useRef(camera)
  const underlay = useRef<HTMLCanvasElement>(null)
  const hoveredId = useRef('')
  const selectedId = useRef(selected)
  const previousSelected = useRef(selected)
  const previousFocus = useRef<number | null>(focusCluster)
  const focused = useRef(focusCluster)
  const focusAction = useRef(onFocusCluster)
  const density = useMemo(() => (synthetic ? null : densityGeometry(points)), [points, synthetic])
  const [hover, setHover] = useState<{ point: ResearchPoint; x: number; y: number } | null>(null)
  const [failed, setFailed] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [box, setBox] = useState<{ x: number; y: number; endX: number; endY: number } | null>(null)
  useEffect(() => {
    select.current = onSelect
    saveCamera.current = onCamera
    focusAction.current = onFocusCluster
  }, [onSelect, onCamera, onFocusCluster])
  useEffect(() => {
    if (!container.current) return
    const graph = new Graph()
    const dark = theme ? theme === 'dark' : document.documentElement.dataset.theme !== 'light'
    const style = getComputedStyle(document.documentElement)
    const neutral = style.getPropertyValue('--border').trim()
    const pointLookup = new Map(points.map((p) => [p.id, p]))
    for (const point of points)
      graph.addNode(point.id, {
        x: point.x,
        y: point.y,
        size: 1.6 + Math.min(3, Math.log1p(point.citations) * 0.28),
        label: null,
        paperTitle: point.title,
        color: landscapeColor(point.cluster, dark),
        cluster: point.cluster,
      })
    const visibleThemes = new Map<number, { x: number; y: number; count: number }>()
    for (const point of points) {
      const group = visibleThemes.get(point.cluster) || { x: 0, y: 0, count: 0 }
      group.x += point.x
      group.y += point.y
      group.count++
      visibleThemes.set(point.cluster, group)
    }
    for (const cluster of clusters) {
      const group = visibleThemes.get(cluster.id)
      if (group)
        graph.addNode(`theme:${cluster.id}`, {
          x: group.x / group.count,
          y: group.y / group.count,
          size: 0,
          label: cluster.label,
          color: landscapeColor(cluster.id, dark),
        })
    }
    let renderer: Sigma
    try {
      renderer = new Sigma(graph, container.current, {
        renderLabels: true,
        labelColor: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim(),
        },
        labelSize: 11,
        labelDensity: 0.5,
        labelGridCellSize: 120,
        labelRenderedSizeThreshold: 0,
        defaultDrawNodeLabel: (context, data, settings) => {
          if (!data.label) return
          const width = container.current?.clientWidth || 0
          const height = container.current?.clientHeight || 0
          // Keep annotations inside the map and away from its fixed controls.
          if (!data.highlighted && ((data.y < 105 && data.x < 270) || data.y > height - 65)) return
          context.font = `${settings.labelWeight} ${settings.labelSize}px ${settings.labelFont}`
          let label = data.label.length > 65 ? `${data.label.slice(0, 62)}…` : data.label
          const maxWidth = Math.max(80, Math.min(270, width - 24))
          while (label.length > 4 && context.measureText(label).width > maxWidth)
            label = `${label.slice(0, -2)}…`
          const textWidth = context.measureText(label).width
          const x = Math.max(8, Math.min(width - textWidth - 8, data.x + data.size + 4))
          const y = Math.max(16, Math.min(height - 16, data.y))
          context.save()
          context.globalAlpha = 0.88
          context.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--background')
            .trim()
          context.fillRect(x - 3, y - 10, textWidth + 6, 17)
          context.globalAlpha = 1
          context.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--foreground')
            .trim()
          context.fillText(label, x, y + 3)
          context.restore()
        },
        enableEdgeEvents: false,
        defaultDrawNodeHover: () => {},
        minCameraRatio: 0.04,
        maxCameraRatio: 2.5,
      })
    } catch {
      // The adjacent searchable list remains the complete keyboard-accessible view.
      queueMicrotask(() => setFailed(true))
      return
    }
    sigma.current = renderer
    if (initialCamera.current) renderer.getCamera().setState(initialCamera.current)
    renderer.on('clickNode', ({ node }) => {
      if (!node.startsWith('theme:')) select.current(node)
      else focusAction.current?.(Number(node.split(':')[1]))
    })
    renderer.on('clickStage', () => select.current(''))
    renderer.on('enterNode', ({ node, event }) => {
      const point = pointLookup.get(node)
      if (!point) return
      hoveredId.current = node
      setHover({
        point,
        x: Math.min(event.x + 18, Math.max(12, (container.current?.clientWidth || 0) - 300)),
        y: Math.max(12, event.y - 70),
      })
      renderer.refresh()
    })
    renderer.on('leaveNode', () => {
      hoveredId.current = ''
      setHover(null)
      renderer.refresh()
    })
    let detailZoom = false
    renderer.setSetting('nodeReducer', (id, data) => {
      const active = id === selectedId.current || id === hoveredId.current
      const theme = id.startsWith('theme:')
      const dim = focused.current !== null && !theme && data.cluster !== focused.current && !active
      return {
        ...data,
        size: active ? 7 : dim ? 1.3 : data.size,
        color: dim ? neutral : data.color,
        label: active
          ? data.paperTitle
          : dim
            ? null
            : theme
              ? detailZoom
                ? null
                : data.label
              : detailZoom
                ? data.paperTitle
                : null,
        forceLabel: active,
        zIndex: active ? 5 : 0,
      }
    })
    const paths = density?.paths.map((p) => ({ ...p, path: new Path2D(p.path) })) || []
    const drawUnderlay = () => {
      const canvas = underlay.current
      if (!canvas || !container.current) return
      const { width, height } = renderer.getDimensions()
      const pixelRatio = window.devicePixelRatio || 1
      if (
        canvas.width !== Math.round(width * pixelRatio) ||
        canvas.height !== Math.round(height * pixelRatio)
      ) {
        canvas.width = Math.round(width * pixelRatio)
        canvas.height = Math.round(height * pixelRatio)
      }
      const context = canvas.getContext('2d')
      if (!context) return
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, width, height)
      if (density) {
        const o = renderer.graphToViewport({ x: density.minX, y: density.minY })
        const a = renderer.graphToViewport({ x: density.minX + density.spanX, y: density.minY })
        const b = renderer.graphToViewport({ x: density.minX, y: density.minY + density.spanY })
        context.save()
        context.transform(
          (a.x - o.x) / density.resolution,
          (a.y - o.y) / density.resolution,
          (b.x - o.x) / density.resolution,
          (b.y - o.y) / density.resolution,
          o.x,
          o.y,
        )
        for (const path of paths) {
          context.fillStyle = style.getPropertyValue('--chart-primary').trim()
          context.globalAlpha = 0.025
          context.fill(path.path)
        }
        context.restore()
      }
      for (const id of [selectedId.current, hoveredId.current]) {
        if (!id || !graph.hasNode(id)) continue
        const attrs = graph.getNodeAttributes(id)
        const p = renderer.graphToViewport({ x: attrs.x, y: attrs.y })
        const r = renderer.scaleSize(7) + 4
        context.beginPath()
        context.arc(p.x, p.y, r, 0, Math.PI * 2)
        context.strokeStyle = style.getPropertyValue('--foreground').trim()
        context.lineWidth = 1
        context.globalAlpha = 0.65
        context.stroke()
      }
      context.globalAlpha = 1
    }
    renderer.on('afterRender', drawUnderlay)
    let cameraTimer: ReturnType<typeof setTimeout> | undefined
    const updateLabels = (ratio: number) => {
      const next = ratio < 0.45
      if (next === detailZoom) return
      detailZoom = next
      // One index refresh at a level-of-detail boundary, not N graph mutations.
      renderer.refresh()
    }
    updateLabels(renderer.getCamera().getState().ratio)
    renderer.getCamera().on('updated', (state) => {
      updateLabels(state.ratio)
      // Persist the settled view, not every animation frame. Frequent history
      // writes both hurt panning and can exceed browser history rate limits.
      clearTimeout(cameraTimer)
      cameraTimer = setTimeout(() => {
        saveCamera.current({ x: state.x, y: state.y, ratio: state.ratio })
      }, 250)
    })
    return () => {
      clearTimeout(cameraTimer)
      initialCamera.current = renderer.getCamera().getState()
      renderer.kill()
      sigma.current = null
    }
  }, [points, clusters, density, theme])
  useEffect(() => {
    const renderer = sigma.current
    if (!renderer) return
    const graph = renderer.getGraph()
    graph.clearEdges()
    if (selected && graph.hasNode(selected)) {
      for (const id of references)
        if (id !== selected && graph.hasNode(id) && !graph.hasEdge(selected, id))
          graph.addEdge(selected, id, { size: 1, color: '#71899c' })
    }
    selectedId.current = selected
    renderer.refresh()
    if (selected && selected !== previousSelected.current && graph.hasNode(selected)) {
      const attrs = graph.getNodeAttributes(selected)
      const center = renderer.viewportToFramedGraph(renderer.graphToViewport({ x: attrs.x, y: attrs.y }))
      void renderer.getCamera().animate(
        { ...center, ratio: Math.min(0.38, renderer.getCamera().ratio) },
        {
          duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 550,
          easing: 'cubicInOut',
        },
      )
    }
    previousSelected.current = selected
  }, [selected, references, points])
  useEffect(() => {
    const renderer = sigma.current
    if (!renderer) return
    focused.current = focusCluster
    const was = previousFocus.current
    previousFocus.current = focusCluster
    if (focusCluster !== null) {
      const group = points.filter((p) => p.cluster === focusCluster)
      if (group.length) {
        const positions = group.map((p) => renderer.graphToViewport(p))
        const minX = Math.min(...positions.map((p) => p.x)),
          maxX = Math.max(...positions.map((p) => p.x))
        const minY = Math.min(...positions.map((p) => p.y)),
          maxY = Math.max(...positions.map((p) => p.y))
        const center = renderer.viewportToFramedGraph({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 })
        const { width, height } = renderer.getDimensions()
        const ratio =
          renderer.getCamera().ratio *
          Math.max((maxX - minX) / (width * 0.72), (maxY - minY) / (height * 0.72), 0.12)
        void renderer.getCamera().animate(
          { ...center, ratio: Math.max(0.12, Math.min(1.1, ratio)) },
          {
            duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650,
            easing: 'cubicInOut',
          },
        )
      }
    } else if (was !== null && !selectedId.current) {
      void renderer.getCamera().animatedReset({ duration: 400 })
    }
    renderer.refresh()
  }, [focusCluster, points])

  return (
    <div
      className="paper-map"
      aria-label="Text similarity landscape. Use the adjacent paper list for keyboard exploration."
    >
      <canvas ref={underlay} className="landscape-density" aria-hidden="true" />
      <div ref={container} className="absolute inset-0" />
      {hover && (
        <div className="landscape-tooltip" style={{ left: hover.x, top: hover.y }}>
          <span className="eyebrow">
            {hover.point.year} · {hover.point.type}
          </span>
          <strong>{hover.point.title}</strong>
          <span>{hover.point.citations.toLocaleString()} recorded citations · click to inspect</span>
        </div>
      )}
      {selecting && (
        <div
          className="absolute inset-0 z-10 cursor-crosshair"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            const bounds = event.currentTarget.getBoundingClientRect()
            const x = event.clientX - bounds.left
            const y = event.clientY - bounds.top
            setBox({ x, y, endX: x, endY: y })
          }}
          onPointerMove={(event) => {
            if (!box) return
            const bounds = event.currentTarget.getBoundingClientRect()
            setBox({ ...box, endX: event.clientX - bounds.left, endY: event.clientY - bounds.top })
          }}
          onPointerUp={() => {
            const renderer = sigma.current
            if (box && renderer)
              onSelection?.(
                points
                  .filter((point) => {
                    const p = renderer.graphToViewport({ x: point.x, y: point.y })
                    return (
                      p.x >= Math.min(box.x, box.endX) &&
                      p.x <= Math.max(box.x, box.endX) &&
                      p.y >= Math.min(box.y, box.endY) &&
                      p.y <= Math.max(box.y, box.endY)
                    )
                  })
                  .map((p) => p.id),
              )
            setBox(null)
            setSelecting(false)
          }}
          onPointerCancel={() => {
            setBox(null)
            setSelecting(false)
          }}
        >
          {box && (
            <div
              style={{
                position: 'absolute',
                left: Math.min(box.x, box.endX),
                top: Math.min(box.y, box.endY),
                width: Math.abs(box.x - box.endX),
                height: Math.abs(box.y - box.endY),
                border: '1px solid var(--primary)',
                background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              }}
            />
          )}
        </div>
      )}
      {failed && <p className="map-fallback">WebGL is unavailable. Explore the same papers in the list.</p>}
      <div className="map-legend">
        <span className="eyebrow">{synthetic ? 'SYNTHETIC RENDERING FIXTURE' : 'THEMATIC LANDSCAPE'}</span>
        <p>
          {synthetic ? 'Generated coordinates; no research records.' : 'Nearby papers share language.'}
          <br />
          {synthetic ? 'Pan and zoom to test rendering.' : 'Select a paper to inspect its evidence.'}
        </p>
      </div>
      <div className="map-controls">
        <Button
          variant="outline"
          size="sm"
          onClick={() => sigma.current?.getCamera().animatedZoom({ duration: 180 })}
          aria-label="Zoom into landscape"
        >
          +
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => sigma.current?.getCamera().animatedUnzoom({ duration: 180 })}
          aria-label="Zoom out of landscape"
        >
          −
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onFocusCluster?.(null)
            void sigma.current?.getCamera().animatedReset({ duration: 450 })
          }}
        >
          Fit map
        </Button>
        {onSelection && (
          <Button
            variant={selecting ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSelecting((value) => !value)}
          >
            {selecting ? 'Draw a rectangle…' : 'Select region'}
          </Button>
        )}
      </div>
      <div className="map-caption">
        {synthetic ? 'Synthetic fixture' : 'Text similarity / t-SNE · seed 42'} ·{' '}
        {points.length.toLocaleString()} {synthetic ? 'points' : 'papers'}
        <br />
        {synthetic
          ? 'Point-only fixture; no edges.'
          : 'Lines show selected paper’s references within this view.'}
      </div>
    </div>
  )
}
