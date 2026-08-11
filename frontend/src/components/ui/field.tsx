import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FieldProps {
  className?: string
  label?: ReactNode
  labelId?: string
  children: ReactNode
}

/** Keeps labels and form controls aligned across filter bars and detail forms. */
export function Field({ className, label, labelId, children }: FieldProps) {
  return (
    <div className={cn('grid min-w-0 gap-[7px]', className)}>
      {label && (
        <span id={labelId} className="min-h-0 text-[0.67rem] font-bold uppercase text-muted-foreground">
          {label}
        </span>
      )}
      {children}
    </div>
  )
}
