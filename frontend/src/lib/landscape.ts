import { contourDensity, geoPath } from 'd3'
import type { ResearchPoint } from '../data/research'

const ink = [
  '#426b8c',
  '#a17b3a',
  '#806293',
  '#568074',
  '#ac6857',
  '#657ca1',
  '#a06b88',
  '#838a51',
  '#518c91',
  '#ab815a',
  '#6d8794',
  '#8c8071',
]
const chalk = [
  '#85b3d1',
  '#d3b176',
  '#b4a1cc',
  '#87b5a5',
  '#d2998a',
  '#9caed2',
  '#c5a2b9',
  '#bbc38e',
  '#8bc5c6',
  '#c9ac8e',
  '#9eb7c4',
  '#b9aea0',
]

export function landscapeColor(cluster: number, dark = false) {
  const colors = dark ? chalk : ink
  return colors[cluster % colors.length]
}

export function densityGeometry(points: ResearchPoint[]) {
  if (points.length < 30 || points.length > 50000) return null
  const x = points.map((p) => p.x),
    y = points.map((p) => p.y)
  const minX = Math.min(...x),
    minY = Math.min(...y)
  const spanX = Math.max(0.01, Math.max(...x) - minX)
  const spanY = Math.max(0.01, Math.max(...y) - minY)
  const resolution = 384
  const contours = contourDensity<ResearchPoint>()
    .x((p) => ((p.x - minX) / spanX) * resolution)
    .y((p) => ((p.y - minY) / spanY) * resolution)
    .size([resolution, resolution])
    .cellSize(4)
    .bandwidth(14)
    .thresholds(5)(points)
  const path = geoPath()
  return {
    minX,
    minY,
    spanX,
    spanY,
    resolution,
    paths: contours.map((c, i) => ({ path: path(c) || '', level: i })),
  }
}
