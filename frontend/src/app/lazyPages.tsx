import { lazy } from 'react'

export const AtlasPage = lazy(() => import('../pages/AtlasPage').then((module) => ({ default: module.AtlasPage })))
export const MethodologyPage = lazy(() => import('../pages/MethodologyPage').then((module) => ({ default: module.MethodologyPage })))
export const NetworksPage = lazy(() => import('../pages/NetworksPage').then((module) => ({ default: module.NetworksPage })))
export const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
export const ResearchersPage = lazy(() => import('../pages/ResearchersPage').then((module) => ({ default: module.ResearchersPage })))
export const TrendingPage = lazy(() => import('../pages/TrendingPage').then((module) => ({ default: module.TrendingPage })))
