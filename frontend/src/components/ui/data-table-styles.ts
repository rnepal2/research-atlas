export const dataTableStyles = {
  table: 'min-w-[760px] border-collapse [&_strong]:font-[650] [&_strong]:text-foreground',
  head:
    'sticky top-0 z-[2] h-auto border-b border-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card-solid)_96%,transparent),color-mix(in_srgb,var(--card-solid)_90%,transparent))] px-2 py-[9px] text-left text-[0.66rem] font-bold tracking-[0] text-muted-foreground uppercase backdrop-blur-[14px]',
  cell:
    'border-b border-border px-2 py-[9px] text-[0.79rem] leading-[1.35] whitespace-normal text-[color-mix(in_srgb,var(--foreground)_82%,var(--muted-foreground))]',
  row: 'transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_5%,transparent)]',
  scorePill:
    'inline-flex h-[26px] min-w-11 items-center justify-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] px-[7px] text-[0.74rem] font-bold text-primary',
} as const
