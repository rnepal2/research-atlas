import { useEffect, useRef, useState } from 'react'
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, randomLcg } from 'd3'
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3'
import { LocateFixed, Minus, Plus } from 'lucide-react'
import { Button } from './ui'
import type { EvidenceEntity } from '../data/research'
import type { ConnectionEvidence } from '../lib/connections'

interface Node extends SimulationNodeDatum {
  id: string
  name: string
  count: number
  hub: boolean
  x: number
  y: number
}
interface Link extends SimulationLinkDatum<Node> {
  peer: string
  count: number
}

export function EgoNetwork({
  hub,
  peers,
  selectedConnection,
  onSelect,
  onInspect,
}: {
  hub: EvidenceEntity
  peers: ConnectionEvidence[]
  selectedConnection: string
  onSelect: (id: string) => void
  onInspect: (id: string) => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const previous = useRef(new Map<string, { x: number; y: number }>())
  const callbacks = useRef({ onSelect, onInspect })
  const selected = useRef(selectedConnection)
  const controls = useRef<(action: 'in' | 'out' | 'fit') => void>(() => {})
  const redraw = useRef<() => void>(() => {})
  const [hover, setHover] = useState<{
    name: string
    count: number
    x: number
    y: number
    hub: boolean
  } | null>(null)
  useEffect(() => {
    callbacks.current = { onSelect, onInspect }
    selected.current = selectedConnection
    redraw.current()
  }, [onSelect, onInspect, selectedConnection])
  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext('2d')
    if (!element || !context) return
    const style = getComputedStyle(document.documentElement)
    const ink = style.getPropertyValue('--foreground').trim(),
      paper = style.getPropertyValue('--background').trim()
    const blue = style.getPropertyValue('--chart-primary').trim(),
      copper = style.getPropertyValue('--primary').trim(),
      line = style.getPropertyValue('--muted-foreground').trim()
    const saved = previous.current
    const nodes: Node[] = [
      {
        id: hub.id,
        name: hub.name,
        count: hub.works.length,
        hub: true,
        ...(saved.get(hub.id) || { x: 0, y: 0 }),
      },
      ...peers.map((peer, i) => ({
        id: peer.id,
        name: peer.name,
        count: peer.sharedWorks.length,
        hub: false,
        ...(saved.get(peer.id) || {
          x: Math.cos(i * 2.39996) * (150 + Math.sqrt(i) * 22),
          y: Math.sin(i * 2.39996) * (150 + Math.sqrt(i) * 22),
        }),
      })),
    ]
    const links: Link[] = peers.map((peer) => ({
      source: hub.id,
      target: peer.id,
      peer: peer.id,
      count: peer.sharedWorks.length,
    }))
    const simulation = forceSimulation<Node>(nodes)
      .randomSource(randomLcg(42))
      .stop()
      .force(
        'link',
        forceLink<Node, Link>(links)
          .id((n) => n.id)
          .distance((d) => Math.max(115, 220 - Math.log1p(d.count) * 35))
          .strength(0.3),
      )
      .force('charge', forceManyBody<Node>().strength(-220))
      .force(
        'collision',
        forceCollide<Node>()
          .radius((n) => (n.hub ? 50 : 27))
          .strength(0.8),
      )
      .force('x', forceX<Node>(0).strength(0.025))
      .force('y', forceY<Node>(0).strength(0.035))
      .alphaDecay(0.035)
      .velocityDecay(0.5)
    let width = 0,
      height = 0,
      zoom = 1,
      panX = 0,
      panY = 0,
      frame = 0,
      hovered = '',
      drag: Node | null = null,
      down: { x: number; y: number; node: string; edge: string } | null = null,
      moved = false
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const started = performance.now(),
      rootStart = { x: nodes[0].x, y: nodes[0].y }
    const scale = () => Math.min(width / 720, height / 540) * zoom
    const screen = (n: { x: number; y: number }) => ({
      x: width / 2 + panX + n.x * scale(),
      y: height / 2 + panY + n.y * scale(),
    })
    const radius = (n: Node) =>
      Math.max(4, (n.hub ? 19 : 5 + Math.min(10, Math.sqrt(n.count) * 2)) * Math.sqrt(scale()))
    const draw = () => {
      const ratio = devicePixelRatio || 1
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, width, height)
      for (const edge of links) {
        const a = screen(edge.source as Node),
          b = screen(edge.target as Node),
          active = edge.peer === (hovered || selected.current)
        const bend = (edge.index || 0) % 2 === 0 ? 0.12 : -0.12
        context.beginPath()
        context.moveTo(a.x, a.y)
        context.quadraticCurveTo(
          (a.x + b.x) / 2 - (b.y - a.y) * bend,
          (a.y + b.y) / 2 + (b.x - a.x) * bend,
          b.x,
          b.y,
        )
        context.strokeStyle = active ? copper : line
        context.globalAlpha = active ? 0.85 : 0.21
        context.lineWidth = active ? 2 : Math.min(1.7, 0.5 + Math.log1p(edge.count) * 0.28)
        context.stroke()
        if (active) {
          const mx = (a.x + b.x) / 2 - ((b.y - a.y) * bend) / 2,
            my = (a.y + b.y) / 2 + ((b.x - a.x) * bend) / 2
          context.globalAlpha = 1
          context.font = '11px "Geist Variable", sans-serif'
          context.fillStyle = paper
          context.fillRect(mx - 13, my - 9, 26, 17)
          context.fillStyle = copper
          context.textAlign = 'center'
          context.fillText(String(edge.count), mx, my + 3)
        }
      }
      context.globalAlpha = 1
      for (const node of nodes) {
        const p = screen(node),
          r = radius(node),
          active = node.id === hovered || node.id === selected.current
        context.beginPath()
        context.arc(p.x, p.y, r, 0, Math.PI * 2)
        context.fillStyle = node.hub ? copper : blue
        context.globalAlpha = node.hub || active ? 1 : 0.82
        context.fill()
        context.globalAlpha = 1
        context.strokeStyle = paper
        context.lineWidth = 2
        context.stroke()
        if (node.hub || active) {
          context.beginPath()
          context.arc(p.x, p.y, r + 4, 0, Math.PI * 2)
          context.lineWidth = 1
          context.strokeStyle = node.hub ? copper : blue
          context.globalAlpha = 0.5
          context.stroke()
          context.globalAlpha = 1
        }
      }
      const occupied = [
        { x: 12, y: 10, w: 240, h: 80 },
        { x: 10, y: height - 55, w: 165, h: 50 },
        { x: width - 190, y: height - 55, w: 185, h: 50 },
      ]
      const labelNodes = nodes
        .filter((n) => n.hub || n.id === hovered || n.id === selected.current || (n.index || 0) < 9)
        .sort(
          (a, b) =>
            Number(b.hub) * 10 +
            Number(b.id === hovered) * 5 -
            Number(a.hub) * 10 -
            Number(a.id === hovered) * 5,
        )
      for (const node of labelNodes) {
        const p = screen(node),
          r = radius(node)
        const text = node.name.length > 27 ? node.name.slice(0, 25) + '…' : node.name
        context.font = node.hub ? '17px Georgia, serif' : '11px "Geist Variable", sans-serif'
        const tw = context.measureText(text).width,
          th = node.hub ? 18 : 13
        const outward = p.x >= width / 2 ? p.x + r + 7 : p.x - r - tw - 7
        const choices = node.hub
          ? [
              [p.x - tw / 2, p.y + r + 18],
              [p.x - tw / 2, p.y - r - 8],
              [outward, p.y + 4],
            ]
          : [
              [outward, p.y + 4],
              [p.x - tw / 2, p.y - r - 8],
              [p.x - tw / 2, p.y + r + 17],
            ]
        for (const [cx, cy] of choices) {
          const x = Math.max(7, Math.min(width - tw - 7, cx)),
            y = Math.max(th + 4, Math.min(height - 8, cy))
          const box = { x: x - 3, y: y - th, w: tw + 6, h: th + 5 }
          if (
            occupied.some(
              (o) =>
                box.x < o.x + o.w + 4 &&
                box.x + box.w + 4 > o.x &&
                box.y < o.y + o.h + 3 &&
                box.y + box.h + 3 > o.y,
            )
          )
            continue
          if (
            nodes.some(
              (other) =>
                other !== node &&
                (() => {
                  const op = screen(other),
                    or = radius(other) + 3
                  return (
                    box.x < op.x + or &&
                    box.x + box.w > op.x - or &&
                    box.y < op.y + or &&
                    box.y + box.h > op.y - or
                  )
                })(),
            )
          )
            continue
          occupied.push(box)
          context.fillStyle = paper
          context.globalAlpha = 0.92
          context.fillRect(box.x, box.y, box.w, box.h)
          context.globalAlpha = 1
          context.fillStyle = ink
          context.textAlign = 'left'
          context.fillText(text, x, y)
          break
        }
      }
    }
    const tick = () => {
      frame = 0
      const t = reduced ? 1 : Math.min(1, (performance.now() - started) / 650),
        ease = 1 - Math.pow(1 - t, 3)
      if (!drag || drag.id !== hub.id) {
        nodes[0].fx = rootStart.x * (1 - ease)
        nodes[0].fy = rootStart.y * (1 - ease)
      }
      if (simulation.alpha() > 0.008) {
        simulation.tick(reduced ? 120 : 1)
      }
      for (const node of nodes) saved.set(node.id, { x: node.x, y: node.y })
      draw()
      if (simulation.alpha() > 0.008 || drag || t < 1) frame = requestAnimationFrame(tick)
    }
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const resize = () => {
      const rect = element.getBoundingClientRect()
      width = rect.width
      height = rect.height
      element.width = Math.round(width * (devicePixelRatio || 1))
      element.height = Math.round(height * (devicePixelRatio || 1))
      wake()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    const pick = (x: number, y: number) =>
      nodes.find((n) => {
        const p = screen(n)
        return Math.hypot(p.x - x, p.y - y) < radius(n) + 7
      })
    const pickEdge = (x: number, y: number) =>
      links.find((edge) => {
        const a = screen(edge.source as Node),
          b = screen(edge.target as Node),
          bend = (edge.index || 0) % 2 === 0 ? 0.12 : -0.12
        const c = { x: (a.x + b.x) / 2 - (b.y - a.y) * bend, y: (a.y + b.y) / 2 + (b.x - a.x) * bend }
        for (let i = 1; i < 15; i++) {
          const t = i / 15
          const px = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
            py = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y
          if (Math.hypot(px - x, py - y) < 7) return true
        }
        return false
      })
    const coords = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }
    const move = (event: PointerEvent) => {
      const p = coords(event)
      if (down) {
        if (Math.hypot(p.x - down.x, p.y - down.y) > 4) moved = true
        if (drag) {
          drag.fx = (p.x - width / 2 - panX) / scale()
          drag.fy = (p.y - height / 2 - panY) / scale()
          simulation.alpha(0.25)
          wake()
        } else if (moved) {
          panX += event.movementX
          panY += event.movementY
          draw()
        }
        return
      }
      const hit = pick(p.x, p.y),
        edge = hit ? null : pickEdge(p.x, p.y)
      const next = hit?.id || edge?.peer || ''
      if (next !== hovered) {
        hovered = next
        setHover(
          hit
            ? {
                name: hit.name,
                count: hit.count,
                hub: hit.hub,
                x: Math.max(8, Math.min(width - 250, p.x + 15)),
                y: Math.max(12, p.y - 75),
              }
            : null,
        )
        draw()
      }
      element.style.cursor = hit ? 'grab' : edge ? 'pointer' : 'default'
    }
    const downEvent = (event: PointerEvent) => {
      const p = coords(event),
        hit = pick(p.x, p.y)
      down = { ...p, node: hit?.id || '', edge: hit ? '' : pickEdge(p.x, p.y)?.peer || '' }
      drag = hit || null
      moved = false
      element.setPointerCapture(event.pointerId)
    }
    const up = (event: PointerEvent) => {
      if (drag) {
        drag.fx = drag.hub ? 0 : null
        drag.fy = drag.hub ? 0 : null
        simulation.alpha(0.18)
      }
      if (down && !moved) {
        setHover(null)
        if (down.node) callbacks.current.onSelect(down.node)
        else callbacks.current.onInspect(down.edge)
      }
      drag = null
      down = null
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
      wake()
    }
    const cancel = () => {
      if (drag) {
        drag.fx = drag.hub ? 0 : null
        drag.fy = drag.hub ? 0 : null
      }
      drag = null
      down = null
      wake()
    }
    const leave = () => {
      hovered = ''
      setHover(null)
      draw()
    }
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      zoom = Math.max(0.45, Math.min(3, zoom * Math.exp(-event.deltaY * 0.003)))
      draw()
    }
    controls.current = (action) => {
      if (action === 'fit') {
        zoom = 1
        panX = 0
        panY = 0
      } else zoom = Math.max(0.45, Math.min(3, zoom * (action === 'in' ? 1.25 : 0.8)))
      draw()
    }
    redraw.current = draw
    element.addEventListener('pointerdown', downEvent)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', cancel)
    element.addEventListener('pointerleave', leave)
    element.addEventListener('wheel', wheel, { passive: false })
    resize()
    return () => {
      cancelAnimationFrame(frame)
      simulation.stop()
      observer.disconnect()
      element.removeEventListener('pointerdown', downEvent)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', cancel)
      element.removeEventListener('pointerleave', leave)
      element.removeEventListener('wheel', wheel)
      redraw.current = () => {}
      if (saved.size > 512) saved.clear()
    }
  }, [hub, peers])
  return (
    <div className="ego-network">
      <canvas
        ref={canvas}
        aria-label={`Collaboration view for ${hub.name}. ${peers.length} displayed connections. Use the Show connection list control for equivalent keyboard exploration and shared paper evidence.`}
      />
      <div className="ego-legend">
        <span className="eyebrow">{peers.length ? 'SHARED PUBLICATIONS' : 'NO OBSERVED CONNECTIONS'}</span>
        <p>
          {peers.length
            ? 'Neighbors scale by shared papers. Select a connection to inspect its evidence.'
            : 'No shared papers with another resolved entity in this sample.'}
        </p>
      </div>
      {hover && (
        <div className="landscape-tooltip" style={{ left: hover.x, top: hover.y }}>
          <strong>{hover.name}</strong>
          <span>
            {hover.count} {hover.hub ? 'sampled' : 'shared'} papers · click to explore
          </span>
        </div>
      )}
      <div className="ego-controls">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Zoom into collaboration view"
          onClick={() => controls.current('in')}
        >
          <Plus />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Zoom out of collaboration view"
          onClick={() => controls.current('out')}
        >
          <Minus />
        </Button>
        <Button variant="outline" size="sm" onClick={() => controls.current('fit')}>
          <LocateFixed />
          Fit view
        </Button>
      </div>
      <span className="ego-caption">
        Drag nodes · Ctrl/⌘ + scroll to zoom
        <br />
        Layout distance is not a measured relationship.
      </span>
    </div>
  )
}
