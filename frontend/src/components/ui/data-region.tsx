import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { ScrollArea } from './scroll-area'

type DataRegionProps = ComponentProps<typeof ScrollArea> & {
  density?: 'page' | 'panel' | 'compact'
}

/**
 * A predictable viewport for dense data. Page tables use available screen height;
 * embedded tables grow with their content before becoming scrollable.
 */
export function DataRegion({ className, density = 'panel', ...props }: DataRegionProps) {
  return (
    <ScrollArea
      className={cn(
        'w-full',
        density === 'page' && 'h-[clamp(24rem,calc(100dvh-17rem),54rem)]',
        density === 'panel' && 'max-h-[min(34rem,calc(100dvh-18rem))]',
        density === 'compact' && 'max-h-[min(26rem,calc(100dvh-20rem))]',
        className,
      )}
      {...props}
    />
  )
}
