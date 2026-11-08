import { Compass, Info, Network, TrendingUp, Users, Scan, Columns2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { label: 'Overview', path: '/', icon: Compass },
  { label: 'Explore', path: '/explore', icon: Scan },
  { label: 'Compare', path: '/compare', icon: Columns2 },
  { label: 'Trending', path: '/trending', icon: TrendingUp },
  { label: 'Researchers', path: '/researchers', icon: Users },
  { label: 'Networks', path: '/networks', icon: Network },
  { label: 'Methods & data', path: '/about', icon: Info },
]
