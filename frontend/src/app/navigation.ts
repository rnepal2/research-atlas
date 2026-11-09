import { Compass, Info, TrendingUp, Users, Scan } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { label: 'Overview', path: '/', icon: Compass },
  { label: 'Explore', path: '/explore', icon: Scan },
  { label: 'Trends', path: '/trending', icon: TrendingUp },
  { label: 'People & collaboration', path: '/connections', icon: Users },
  { label: 'Methods & data', path: '/about', icon: Info },
]
