import { useEffect, useRef, useState } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import type { ResearchPoint, ResearchLandscape } from '../data/research'
import { Button } from './ui'

const colors = [
  '#66b8d9',
  '#c9ac77',
  '#b3a0df',
  '#73b39d',
  '#d68f86',
  '#8da8db',
  '#d0a4bb',
  '#b8bf7a',
  '#7fc6bb',
  '#c69d68',
  '#91afc5',
  '#b2a7a0',
]

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
}) {
  const container = useRef<HTMLDivElement>(null)
  const sigma = useRef<Sigma | null>(null)
  const select = useRef(onSelect)
  const saveCamera = useRef(onCamera)
  const initialCamera = useRef(camera)
  const [failed, setFailed] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [box, setBox] = useState<{ x: number; y: number; endX: number; endY: number } | null>(null)
  useEffect(() => {
    select.current = onSelect
    saveCamera.current = onCamera
  }, [onSelect, onCamera])
  useEffect(() => {
    if (!container.current) return
    const graph = new Graph()
    const palette =
      document.documentElement.dataset.theme === 'light'
        ? [
            '#365f7c',
            '#946823',
            '#77578f',
            '#426f62',
            '#a55849',
            '#536b9c',
            '#965d7b',
            '#747b3f',
            '#377f80',
            '#997044',
            '#5b7688',
            '#797064',
          ]
        : colors
    for (const point of points)
      graph.addNode(point.id, {
        x: point.x,
        y: point.y,
        size: 2 + Math.min(4, Math.log1p(point.citations) / 3),
        label: null,
        paperTitle: point.title,
        color: palette[point.cluster % palette.length],
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
          color: palette[cluster.id % palette.length],
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
    })
    let detailZoom = false
    let cameraTimer: ReturnType<typeof setTimeout> | undefined
    const updateLabels = (ratio: number) => {
      const next = ratio < 0.45
      if (next === detailZoom) return
      detailZoom = next
      graph.forEachNode((id, attrs) => {
        const theme = id.startsWith('theme:')
        graph.setNodeAttribute(
          id,
          'label',
          theme
            ? next
              ? null
              : clusters.find((c) => `theme:${c.id}` === id)?.label || ''
            : next
              ? attrs.paperTitle
              : null,
        )
      })
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
  }, [points, clusters])
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
    renderer.setSetting('nodeReducer', (id, data) => ({
      ...data,
      size: id === selected ? 9 : data.size,
      highlighted: id === selected,
      zIndex: id === selected ? 2 : 0,
      label: id === selected ? data.paperTitle : data.label,
      forceLabel: id === selected,
    }))
  }, [selected, references, points])

  return (
    <div
      className="paper-map"
      aria-label="Text similarity landscape. Use the adjacent paper list for keyboard exploration."
    >
      <div ref={container} className="absolute inset-0" />
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
          onClick={() => sigma.current?.getCamera().animatedReset({ duration: 180 })}
        >
          Fit map
        </Button>
        {onSelection && (
          <Button
            variant={selecting ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSelecting((value) => !value)}
          >
            Select region
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
