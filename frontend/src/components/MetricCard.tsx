import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from './ui'

interface MetricCardProps {
  label: string
  value: string
  note: string
  icon: LucideIcon
}

export function MetricCard({ label, value, note, icon: Icon }: MetricCardProps) {
  return (
    <Card className="bg-[linear-gradient(145deg,var(--card-soft),transparent_58%),var(--card)]">
      <CardContent className="min-h-[92px]">
        <div className="flex items-center justify-between gap-2 text-[0.69rem] font-semibold text-muted-foreground [&_svg]:size-4 [&_svg]:text-[color-mix(in_srgb,var(--foreground)_58%,transparent)]">
          <span>{label}</span>
          <Icon aria-hidden="true" />
        </div>
        <div className="mt-2 mb-1 font-ui text-[clamp(1.28rem,1.7vw,1.68rem)] leading-none font-[710]">{value}</div>
        <div className="text-[0.7rem] leading-[1.3] text-muted-foreground">{note}</div>
      </CardContent>
    </Card>
  )
}
