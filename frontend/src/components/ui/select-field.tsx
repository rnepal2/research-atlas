import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  meta?: string
  disabled?: boolean
}

export function SelectField({
  className,
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select',
}: {
  className?: string
  label?: string
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
}) {
  const labelId = label ? `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-label` : undefined

  return (
    <div className={cn('grid min-w-0 gap-[7px]', className)}>
      {label && (
        <span id={labelId} className="min-h-0 text-[0.67rem] font-bold tracking-[0] text-muted-foreground uppercase">
          {label}
        </span>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          aria-labelledby={labelId}
          className="h-[38px] w-full min-w-0 rounded-card border-border bg-input px-[11px] text-[0.83rem] font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] data-[state=open]:border-border-strong data-[state=open]:ring-3 data-[state=open]:ring-ring/50 dark:bg-input dark:hover:bg-[color-mix(in_srgb,var(--input)_82%,var(--card-hover))]"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={7}
          className="w-[var(--radix-select-trigger-width)] border border-border-strong bg-popover text-popover-foreground shadow-[0_24px_70px_rgba(0,0,0,0.42)]"
        >
          <SelectGroup>
            {options.map((option) => (
              <SelectItem
                disabled={option.disabled}
                key={option.value}
                value={option.value}
                className="min-h-9 py-[7px] pr-8 pl-[9px] text-[0.8rem] leading-[1.2] focus:bg-muted focus:text-foreground data-[state=checked]:bg-[color-mix(in_srgb,var(--primary)_14%,transparent)]"
              >
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate font-semibold">{option.label}</span>
                  {option.meta && <span className="truncate text-[0.7rem] text-muted-foreground">{option.meta}</span>}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
