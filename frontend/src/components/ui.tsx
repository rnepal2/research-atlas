import type React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react'

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'default' | 'sm' | 'icon'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return <button className={cx('ui-button', `ui-button-${variant}`, `ui-button-${size}`, className)} {...props} />
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cx('ui-card', className)} {...props} />
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('ui-card-header', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cx('ui-card-title', className)} {...props} />
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx('ui-card-description', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('ui-card-content', className)} {...props} />
}

export function Badge({
  className,
  variant = 'secondary',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning'
}) {
  return <span className={cx('ui-badge', `ui-badge-${variant}`, className)} {...props} />
}

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
    <div className={cx('ui-select-wrap', className)}>
      {label && (
        <span id={labelId} className="ui-field-label">
          {label}
        </span>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger className="ui-select-trigger" aria-labelledby={labelId}>
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown aria-hidden="true" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content className="ui-select-content" position="popper" sideOffset={7}>
            <SelectPrimitive.ScrollUpButton className="ui-select-scroll-button">
              <ChevronUp aria-hidden="true" />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="ui-select-viewport">
              <SelectPrimitive.Group>
                {options.map((option) => (
                  <SelectPrimitive.Item className="ui-select-item" disabled={option.disabled} key={option.value} value={option.value}>
                    <SelectPrimitive.ItemText>
                      <span className="ui-select-item-main">{option.label}</span>
                      {option.meta && <span className="ui-select-item-meta">{option.meta}</span>}
                    </SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator className="ui-select-item-indicator">
                      <Check aria-hidden="true" />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Group>
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="ui-select-scroll-button">
              <ChevronDown aria-hidden="true" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  )
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('ui-input', className)} {...props} />
}

export function Tabs({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="ui-tabs" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cx('ui-tab', value === option.value && 'is-active')}
          onClick={() => onChange(option.value)}
          role="tab"
          aria-selected={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Separator() {
  return <div className="ui-separator" role="separator" />
}

export function ScrollArea({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <ScrollAreaPrimitive.Root className={cx('ui-scroll-area', className)}>
      <ScrollAreaPrimitive.Viewport className="ui-scroll-viewport">{children}</ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar className="ui-scrollbar" orientation="vertical">
        <ScrollAreaPrimitive.Thumb className="ui-scroll-thumb" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Scrollbar className="ui-scrollbar" orientation="horizontal">
        <ScrollAreaPrimitive.Thumb className="ui-scroll-thumb" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner className="ui-scroll-corner" />
    </ScrollAreaPrimitive.Root>
  )
}

export function Accordion({
  items,
  defaultValue,
  className,
}: {
  items: Array<{ value: string; title: string; content: React.ReactNode }>
  defaultValue?: string
  className?: string
}) {
  return (
    <AccordionPrimitive.Root className={cx('ui-accordion', className)} defaultValue={defaultValue} type="single" collapsible>
      {items.map((item) => (
        <AccordionPrimitive.Item className="ui-accordion-item" value={item.value} key={item.value}>
          <AccordionPrimitive.Header className="ui-accordion-header">
            <AccordionPrimitive.Trigger className="ui-accordion-trigger">
              {item.title}
              <ChevronRight aria-hidden="true" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="ui-accordion-content">
            <div className="ui-accordion-content-inner">{item.content}</div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  )
}
