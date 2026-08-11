import Graph from 'graphology'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { LocateFixed, Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Sigma from 'sigma'
import type { NetworkData, NetworkNode } from '../data/types'
import { formatCompact, formatScore } from '../lib/format'
import { cn } from '../lib/utils'
import { Button } from './ui'

interface IntelligenceNetworkProps {
  network: NetworkData
  mode: 'author' | 'institution'
  className?: string
}

interface HoverState {
  x: number
  y: number
  node: NetworkNode & {
    color: string
    fullLabel?: string
    size: number
  }
}

const palette = ['#23d7cf', '#d8a84a', '#e56f61', '#74d69b', '#7da4ff', '#caa7ff', '#f2c46d', '#8ee8df']

function graphColors() {
  const light = document.documentElement.dataset.theme === 'light'
  return {
    edge: light ? 'rgba(4, 123, 117, 0.34)' : 'rgba(35, 215, 207, 0.18)',
    mutedEdge: light ? 'rgba(4, 123, 117, 0.18)' : 'rgba(35, 215, 207, 0.08)',
    fadedNode: light ? 'rgba(95, 112, 118, 0.34)' : 'rgba(155, 173, 178, 0.24)',
    label: light ? '#11191d' : '#dff6f4',
  }
}

function hash(value: string) {
  return [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0)
}

function initialPosition(id: string, communityIndex: number, communityCount: number) {
  const angle = (Math.PI * 2 * communityIndex) / Math.max(1, communityCount)
  const local = ((hash(id) % 360) * Math.PI) / 180
  return {
    x: Math.cos(angle) * 12 + Math.cos(local) * 2.8,
    y: Math.sin(angle) * 9 + Math.sin(local) * 2.8,
  }
}

function buildGraph(network: NetworkData, mode: 'author' | 'institution') {
  const graph = new Graph({ multi: true, type: 'undirected' })
  const colors = graphColors()
  const sourceNodes = network.nodes.slice(0, mode === 'institution' ? 90 : 115)
  const communities = [...new Set(sourceNodes.map((node) => node.community || 'Mixed'))].slice(0, 8)
  const communityIndex = new Map(communities.map((community, index) => [community, index]))

  sourceNodes.forEach((node, index) => {
    const community = node.community || 'Mixed'
    const color = palette[(communityIndex.get(community) || 0) % palette.length]
    const score = Math.max(1, node.score || node.works || 1)
    const position = initialPosition(node.id, communityIndex.get(community) || 0, communities.length)
    graph.addNode(node.id, {
      ...node,
      nodeRole: node.type,
      type: 'circle',
      x: position.x,
      y: position.y,
      label: '',
      fullLabel: node.label,
      color,
      size: mode === 'institution' ? 5 + Math.min(13, Math.sqrt(score) * 1.45) : 4 + Math.min(11, Math.sqrt(score) * 1.22),
      community,
      originalColor: color,
      zIndex: index < 16 ? 2 : 1,
    })
  })

  network.edges.slice(0, mode === 'institution' ? 190 : 260).forEach((edge, index) => {
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) {
      return
    }
    const edgeId = `${edge.source}:${edge.target}:${index}`
    graph.addEdgeWithKey(edgeId, edge.source, edge.target, {
      color: colors.edge,
      baseColor: colors.edge,
      mutedColor: colors.mutedEdge,
      size: Math.max(0.4, Math.min(2.4, Math.sqrt(edge.weight) * 0.55)),
      weight: edge.weight,
    })
  })

  forceAtlas2.assign(graph, {
    iterations: 170,
    settings: {
      adjustSizes: true,
      barnesHutOptimize: true,
      edgeWeightInfluence: 0.65,
      gravity: 1.2,
      scalingRatio: mode === 'institution' ? 6 : 8,
      slowDown: 4,
    },
  })

  return { graph, communities, communityIndex, colors }
}

export function IntelligenceNetwork({ network, mode, className }: IntelligenceNetworkProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const graphBundle = useMemo(() => buildGraph(network, mode), [network, mode])
  const [hover, setHover] = useState<HoverState | null>(null)
  const [selected, setSelected] = useState<HoverState['node'] | null>(null)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    let hoveredNode: string | null = null
    let hoveredNeighbors = new Set<string>()
    let draggedNode: string | null = null

    const renderer = new Sigma(graphBundle.graph, containerRef.current, {
      allowInvalidContainer: true,
      defaultEdgeType: 'line',
      defaultNodeColor: '#23d7cf',
      defaultDrawNodeHover: () => {},
      enableEdgeEvents: false,
      edgeReducer: (edge, data) => {
        if (!hoveredNode) {
          return data
        }
        const [source, target] = graphBundle.graph.extremities(edge)
        const connected = source === hoveredNode || target === hoveredNode
        return {
          ...data,
          color: connected ? data.baseColor || graphBundle.colors.edge : data.mutedColor || graphBundle.colors.mutedEdge,
          size: connected ? Number(data.size || 1) : 0.28,
        }
      },
      labelColor: { color: graphBundle.colors.label },
      labelDensity: 0.08,
      labelFont: 'Inter',
      labelRenderedSizeThreshold: 1000,
      minCameraRatio: 0.42,
      maxCameraRatio: 2.2,
      nodeReducer: (node, data) => {
        const size = Number(data.size || 4)
        if (!hoveredNode) {
          return data
        }
        if (node === hoveredNode) {
          return {
            ...data,
            label: '',
            forceLabel: false,
            color: data.originalColor || data.color,
            size: size * 1.42,
            zIndex: 10,
          }
        }
        if (hoveredNeighbors.has(node)) {
          return {
            ...data,
            label: '',
            forceLabel: false,
            color: data.originalColor || data.color,
            size: size * 1.08,
            zIndex: 6,
          }
        }
        return {
          ...data,
          label: '',
          color: graphBundle.colors.fadedNode,
          size: Math.max(2, size * 0.62),
          zIndex: 0,
        }
      },
      renderEdgeLabels: false,
      zIndex: true,
    })
    sigmaRef.current = renderer

    const releaseDraggedNode = () => {
      if (!draggedNode) {
        return
      }
      graphBundle.graph.removeNodeAttribute(draggedNode, 'fixed')
      draggedNode = null
      containerRef.current?.classList.remove('is-dragging')
      renderer.setSetting('enableCameraPanning', true)
      renderer.setSetting('enableCameraZooming', true)
      renderer.refresh()
    }

    renderer.on('enterNode', ({ node, event }) => {
      const attributes = graphBundle.graph.getNodeAttributes(node) as HoverState['node']
      hoveredNode = node
      hoveredNeighbors = new Set(graphBundle.graph.neighbors(node))
      const bounds = containerRef.current?.getBoundingClientRect()
      const x = Math.min(event.x, Math.max(16, (bounds?.width || 0) - 272))
      const y = Math.min(event.y, Math.max(16, (bounds?.height || 0) - 118))
      setHover({ x, y, node: { ...attributes, label: attributes.fullLabel || attributes.label } as HoverState['node'] })
      renderer.refresh()
    })
    renderer.on('leaveNode', () => {
      hoveredNode = null
      hoveredNeighbors = new Set()
      setHover(null)
      renderer.refresh()
    })
    renderer.on('downNode', ({ node, event, preventSigmaDefault }) => {
      draggedNode = node
      const attributes = graphBundle.graph.getNodeAttributes(node) as HoverState['node']
      setSelected({ ...attributes, label: attributes.fullLabel || attributes.label } as HoverState['node'])
      graphBundle.graph.setNodeAttribute(node, 'fixed', true)
      containerRef.current?.classList.add('is-dragging')
      renderer.setSetting('enableCameraPanning', false)
      renderer.setSetting('enableCameraZooming', false)
      preventSigmaDefault()
      event.preventSigmaDefault()
    })
    renderer.on('moveBody', ({ event }) => {
      if (!draggedNode) {
        return
      }
      const position = renderer.viewportToGraph({ x: event.x, y: event.y })
      graphBundle.graph.mergeNodeAttributes(draggedNode, {
        x: position.x,
        y: position.y,
      })
      hoveredNode = draggedNode
      hoveredNeighbors = new Set(graphBundle.graph.neighbors(draggedNode))
      event.preventSigmaDefault()
      renderer.refresh()
    })
    renderer.on('upNode', releaseDraggedNode)
    renderer.on('upStage', releaseDraggedNode)
    renderer.on('leaveStage', releaseDraggedNode)
    renderer.on('clickNode', ({ node }) => {
      const attributes = graphBundle.graph.getNodeAttributes(node) as HoverState['node']
      setSelected({ ...attributes, label: attributes.fullLabel || attributes.label } as HoverState['node'])
    })

    return () => {
      renderer.kill()
      sigmaRef.current = null
    }
  }, [graphBundle])

  function zoom(delta: number) {
    const camera = sigmaRef.current?.getCamera()
    if (!camera) {
      return
    }
    const current = camera.getState()
    camera.animate({ ratio: Math.max(0.42, Math.min(2.2, current.ratio + delta)) }, { duration: 180 })
  }

  function reset() {
    sigmaRef.current?.getCamera().animatedReset({ duration: 220 })
  }

  return (
    <div className={cn('relative min-h-[320px] overflow-hidden max-[760px]:min-h-[430px]', className)}>
      <div className="absolute top-2.5 right-2.5 z-[3] grid gap-[5px]" aria-label="Network viewport controls">
        <Button className="size-[30px]" variant="outline" size="icon" type="button" onClick={() => zoom(-0.22)} aria-label="Zoom in network">
          <Plus aria-hidden="true" />
        </Button>
        <Button className="size-[30px]" variant="outline" size="icon" type="button" onClick={() => zoom(0.22)} aria-label="Zoom out network">
          <Minus aria-hidden="true" />
        </Button>
        <Button className="size-[30px]" variant="outline" size="icon" type="button" onClick={reset} aria-label="Reset network viewport">
          <LocateFixed aria-hidden="true" />
        </Button>
      </div>
      <div
        className="absolute inset-0 cursor-grab bg-[radial-gradient(circle_at_50%_50%,color-mix(in_srgb,var(--primary)_7%,transparent),transparent_46%),linear-gradient(90deg,var(--background-grid)_1px,transparent_1px),linear-gradient(0deg,var(--background-grid)_1px,transparent_1px)] bg-[length:auto,42px_42px,42px_42px] [&.is-dragging]:cursor-grabbing"
        ref={containerRef}
      />
      <div className="pointer-events-none absolute bottom-3 left-3 z-[2] max-w-[300px] rounded-card border border-border bg-[color-mix(in_srgb,var(--card-solid)_78%,transparent)] px-[9px] py-[7px] text-[0.68rem] font-bold text-muted-foreground backdrop-blur-xl">
        Drag nodes to rearrange clusters. Scroll or use controls to zoom.
      </div>
      <div className="absolute top-3 left-3 z-[2] grid max-w-[210px] gap-[7px] rounded-card border border-border bg-[color-mix(in_srgb,var(--card-solid)_84%,transparent)] p-2.5 backdrop-blur-[14px]">
        {graphBundle.communities.slice(0, 6).map((community) => (
          <span className="flex items-center gap-[7px] text-[0.7rem] font-bold text-muted-foreground" key={community}>
            <i className="size-2 rounded-full shadow-[0_0_12px_currentColor]" style={{ background: palette[(graphBundle.communityIndex.get(community) || 0) % palette.length] }} />
            {community.slice(0, 22)}
          </span>
        ))}
      </div>
      {hover && (
        <div
          className="pointer-events-none absolute z-[4] grid w-[min(250px,calc(100%-24px))] gap-1 rounded-card border border-[color-mix(in_srgb,var(--primary)_34%,var(--border))] bg-[color-mix(in_srgb,var(--card-solid)_95%,#ffffff)] px-[11px] py-2.5 shadow-atlas"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <strong className="text-[0.84rem] leading-[1.2] text-foreground">{hover.node.label}</strong>
          <span className="text-[0.72rem] leading-[1.35] text-muted-foreground">{hover.node.community}</span>
          <span className="text-[0.72rem] leading-[1.35] text-muted-foreground">{hover.node.institution || hover.node.country || 'Institution not resolved'}</span>
          <em className="text-[0.72rem] leading-[1.35] font-bold not-italic text-primary">{formatScore(hover.node.score)} score</em>
        </div>
      )}
      {selected && (
        <aside className="absolute right-3 bottom-3 z-[4] grid w-[min(250px,calc(100%-24px))] gap-1 rounded-card border border-[color-mix(in_srgb,var(--primary)_34%,var(--border))] bg-[color-mix(in_srgb,var(--card-solid)_95%,#ffffff)] px-[11px] py-2.5 shadow-atlas">
          <span className="text-[0.68rem] font-bold uppercase text-muted-foreground">Selected node</span>
          <strong className="text-[0.84rem] leading-[1.2] text-foreground">{selected.label}</strong>
          <p className="m-0 text-[0.72rem] leading-[1.35] text-muted-foreground">{selected.institution || selected.country || selected.community}</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[0.72rem] leading-[1.35] font-bold text-primary">{formatScore(selected.score)} score</span>
            {selected.works && <span className="text-[0.72rem] leading-[1.35] font-bold text-primary">{formatCompact(selected.works)} works</span>}
          </div>
        </aside>
      )}
    </div>
  )
}
