import { Compass, Info, Network, TrendingUp, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { label: 'Atlas', path: '/', icon: Compass },
  { label: 'Trending', path: '/trending', icon: TrendingUp },
  { label: 'Researchers', path: '/researchers', icon: Users },
  { label: 'Networks', path: '/networks', icon: Network },
  { label: 'About', path: '/about', icon: Info },
]
