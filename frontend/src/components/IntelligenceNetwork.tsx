import Graph from 'graphology'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { LocateFixed, Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Sigma from 'sigma'
import type { NetworkData, NetworkNode } from '../data/types'
import { formatCompact, formatScore } from '../lib/format'
import { Button } from './ui'

interface IntelligenceNetworkProps {
  network: NetworkData
  mode: 'author' | 'institution'
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
      label: index < 24 ? node.label : '',
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
      color: 'rgba(35, 215, 207, 0.16)',
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

  return { graph, communities, communityIndex }
}

export function IntelligenceNetwork({ network, mode }: IntelligenceNetworkProps) {
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
      enableEdgeEvents: false,
      edgeReducer: (edge, data) => {
        if (!hoveredNode) {
          return data
        }
        const [source, target] = graphBundle.graph.extremities(edge)
        const connected = source === hoveredNode || target === hoveredNode
        return {
          ...data,
          color: connected ? 'rgba(35, 215, 207, 0.26)' : 'rgba(155, 173, 178, 0.045)',
          size: connected ? Math.min(2.2, Number(data.size || 1) * 1.28) : 0.28,
        }
      },
      labelColor: { color: '#dff6f4' },
      labelDensity: 0.08,
      labelFont: 'IBM Plex Sans',
      labelRenderedSizeThreshold: 11,
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
          color: 'rgba(155, 173, 178, 0.24)',
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
    <div className="network-canvas network-canvas-sigma">
      <div className="network-toolbar" aria-label="Network viewport controls">
        <Button variant="outline" size="icon" type="button" onClick={() => zoom(-0.22)} aria-label="Zoom in network">
          <Plus aria-hidden="true" />
        </Button>
        <Button variant="outline" size="icon" type="button" onClick={() => zoom(0.22)} aria-label="Zoom out network">
          <Minus aria-hidden="true" />
        </Button>
        <Button variant="outline" size="icon" type="button" onClick={reset} aria-label="Reset network viewport">
          <LocateFixed aria-hidden="true" />
        </Button>
      </div>
      <div className="network-sigma-stage" ref={containerRef} />
      <div className="network-interaction-hint">Drag nodes to rearrange clusters. Scroll or use controls to zoom.</div>
      <div className="network-community-legend">
        {graphBundle.communities.slice(0, 6).map((community) => (
          <span key={community}>
            <i style={{ background: palette[(graphBundle.communityIndex.get(community) || 0) % palette.length] }} />
            {community.slice(0, 22)}
          </span>
        ))}
      </div>
      {hover && (
        <div className="network-hover-card" style={{ left: hover.x + 14, top: hover.y + 14 }}>
          <strong>{hover.node.label}</strong>
          <span>{hover.node.community}</span>
          <span>{hover.node.institution || hover.node.country || 'Institution not resolved'}</span>
          <em>{formatScore(hover.node.score)} score</em>
        </div>
      )}
      {selected && (
        <aside className="network-node-detail">
          <span className="section-kicker">Selected node</span>
          <strong>{selected.label}</strong>
          <p>{selected.institution || selected.country || selected.community}</p>
          <div>
            <span>{formatScore(selected.score)} score</span>
            {selected.works && <span>{formatCompact(selected.works)} works</span>}
          </div>
        </aside>
      )}
    </div>
  )
}
