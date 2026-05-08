import * as React from "react"
import { format, parse, isValid, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { th } from "date-fns/locale"
import { CalendarIcon, XIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface DateRangeValue {
  from?: string  // "YYYY-MM-DD" or ""
  to?: string    // "YYYY-MM-DD" or ""
}

interface DateRangePickerProps {
  value?: DateRangeValue
  onChange: (value: DateRangeValue) => void
  placeholder?: string
  className?: string
}

const toISO = (d: Date | undefined): string => (d ? format(d, "yyyy-MM-dd") : "")

const fromISO = (s: string | undefined): Date | undefined => {
  if (!s) return undefined
  const d = parse(s, "yyyy-MM-dd", new Date())
  return isValid(d) ? d : undefined
}

const SHORTCUTS: { label: string; getRange: () => DateRange }[] = [
  {
    label: "วันนี้",
    getRange: () => {
      const t = new Date()
      return { from: t, to: t }
    },
  },
  {
    label: "พรุ่งนี้",
    getRange: () => {
      const t = addDays(new Date(), 1)
      return { from: t, to: t }
    },
  },
  {
    label: "อาทิตย์นี้",
    getRange: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    label: "อาทิตย์หน้า",
    getRange: () => {
      const next = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7)
      return {
        from: next,
        to: addDays(next, 6),
      }
    },
  },
  {
    label: "เดือนนี้",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
]

export function DateRangePicker({
  value,
  onChange,
  placeholder = "เลือกช่วงวันที่",
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selected = React.useMemo<DateRange | undefined>(() => {
    const from = fromISO(value?.from)
    const to = fromISO(value?.to)
    if (!from && !to) return undefined
    return { from, to }
  }, [value?.from, value?.to])

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChange({ from: "", to: "" })
      return
    }
    onChange({
      from: toISO(range.from),
      to: toISO(range.to),
    })
  }

  const handleShortcut = (range: DateRange) => {
    handleSelect(range)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange({ from: "", to: "" })
  }

  // Display label
  const displayLabel = React.useMemo(() => {
    if (!selected?.from && !selected?.to) return placeholder
    if (selected?.from && selected?.to) {
      const sameDay = toISO(selected.from) === toISO(selected.to)
      if (sameDay) {
        return format(selected.from, "d MMM yyyy", { locale: th })
      }
      const sameYear = selected.from.getFullYear() === selected.to.getFullYear()
      if (sameYear) {
        return `${format(selected.from, "d MMM", { locale: th })} - ${format(selected.to, "d MMM yyyy", { locale: th })}`
      }
      return `${format(selected.from, "d MMM yyyy", { locale: th })} - ${format(selected.to, "d MMM yyyy", { locale: th })}`
    }
    if (selected?.from) {
      return `${format(selected.from, "d MMM yyyy", { locale: th })} - ?`
    }
    return placeholder
  }, [selected, placeholder])

  const hasValue = !!(selected?.from || selected?.to)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-lg border px-3 text-sm transition-colors text-left",
          "border-[var(--color-border-forest)] bg-[var(--color-card)]",
          "hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40",
          !hasValue ? "text-[var(--color-muted-foreground)]" : "text-[var(--color-text)]",
          className
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-[var(--color-primary)]" />
        <span className="flex-1 truncate">{displayLabel}</span>
        {hasValue && (
          <span
            role="button"
            onClick={handleClear}
            className="rounded p-0.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-text)] hover:bg-[var(--color-border-forest)]/40"
          >
            <XIcon className="size-3.5" />
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 border-[var(--color-border-forest)] bg-[var(--color-paper)] shadow-lg"
        align="start"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Quick shortcuts */}
        <div className="flex gap-1 p-2 border-b border-[var(--color-border-forest)]/40 flex-wrap">
          {SHORTCUTS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleShortcut(s.getRange())}
              className="px-2.5 py-1 text-xs rounded-full border transition-colors"
              style={{
                borderColor: "var(--color-border-forest)",
                color: "var(--color-text)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = "var(--color-primary)"
                ;(e.currentTarget as HTMLButtonElement).style.color = "white"
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-primary)"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = "transparent"
                ;(e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)"
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border-forest)"
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <Calendar
          mode="range"
          selected={selected}
          onSelect={handleSelect}
          locale={th}
          numberOfMonths={1}
        />

        <div className="border-t border-[var(--color-border-forest)]/50 p-2 flex justify-between gap-1">
          {hasValue ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-red-500 h-7 hover:text-red-600"
              onClick={() => onChange({ from: "", to: "" })}
            >
              ล้าง
            </Button>
          ) : (
            <span />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-[var(--color-muted-foreground)] h-7"
            onClick={() => setOpen(false)}
          >
            ปิด
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
