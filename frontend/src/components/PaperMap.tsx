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
}: {
  points: ResearchPoint[]
  clusters: ResearchLandscape['clusters']
  selected: string
  onSelect: (id: string) => void
  references: string[]
  camera?: { x: number; y: number; ratio: number }
  onCamera: (value: { x: number; y: number; ratio: number }) => void
  onSelection?: (ids: string[]) => void
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
    const strongest = new Set(
      clusters.map(
        (c) => points.filter((p) => p.cluster === c.id).sort((a, b) => b.citations - a.citations)[0]?.id,
      ),
    )
    for (const point of points)
      graph.addNode(point.id, {
        x: point.x,
        y: point.y,
        size: 2 + Math.min(4, Math.log1p(point.citations) / 3),
        label: strongest.has(point.id) ? point.title : '',
        color: colors[point.cluster % colors.length],
      })
    for (const cluster of clusters) {
      if (points.some((p) => p.cluster === cluster.id))
        graph.addNode(`theme:${cluster.id}`, {
          x: cluster.x,
          y: cluster.y,
          size: 0,
          label: cluster.label,
          forceLabel: true,
          color: colors[cluster.id % colors.length],
        })
    }
    let renderer: Sigma
    try {
      renderer = new Sigma(graph, container.current, {
        renderLabels: true,
        labelColor: { color: getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim() },
        labelSize: 11,
        labelDensity: 0.035,
        labelRenderedSizeThreshold: 5,
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
    renderer
      .getCamera()
      .on('updated', (state) => saveCamera.current({ x: state.x, y: state.y, ratio: state.ratio }))
    return () => {
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
      label: id.startsWith('theme:') && renderer.getCamera().getState().ratio < 0.45 ? '' : data.label,
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
        <span className="eyebrow">THEMATIC LANDSCAPE</span>
        <p>
          Nearby papers share language.
          <br />
          Select a paper to inspect its evidence.
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
        Text similarity / t-SNE · seed 42 · {points.length.toLocaleString()} papers
        <br />
        Lines show selected paper’s references within this view.
      </div>
    </div>
  )
}
