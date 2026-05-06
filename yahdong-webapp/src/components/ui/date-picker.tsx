import * as React from "react"
import { format, parse, isValid, addDays, startOfWeek, addWeeks } from "date-fns"
import { th } from "date-fns/locale"
import { CalendarIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string        // "YYYY-MM-DD" or ""
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const SHORTCUTS = [
  { label: 'วันนี้', getDate: () => new Date() },
  { label: 'พรุ่งนี้', getDate: () => addDays(new Date(), 1) },
  { label: 'อาทิตย์หน้า', getDate: () => addDays(startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }), 0) },
  { label: '2 สัปดาห์', getDate: () => addDays(new Date(), 14) },
]

export function DatePicker({
  value,
  onChange,
  placeholder = "เลือกวันที่",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selected = React.useMemo(() => {
    if (!value) return undefined
    const d = parse(value, "yyyy-MM-dd", new Date())
    return isValid(d) ? d : undefined
  }, [value])

  const handleSelect = (date: Date | undefined) => {
    onChange(date ? format(date, "yyyy-MM-dd") : "")
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-lg border px-3 text-sm transition-colors text-left",
          "border-[var(--color-border-forest)] bg-[var(--color-card)]",
          "hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40",
          !selected ? "text-[var(--color-muted-foreground)]" : "text-[var(--color-text)]",
          className
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-[var(--color-primary)]" />
        <span className="flex-1">
          {selected ? format(selected, "d MMM yyyy", { locale: th }) : placeholder}
        </span>
        {selected && (
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
              onClick={() => handleSelect(s.getDate())}
              className="px-2.5 py-1 text-xs rounded-full border transition-colors"
              style={{
                borderColor: 'var(--color-border-forest)',
                color: 'var(--color-text)',
                background: 'transparent',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'white'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border-forest)'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          locale={th}
        />

        <div className="border-t border-[var(--color-border-forest)]/50 p-2 flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-[var(--color-muted-foreground)] h-7"
            onClick={() => setOpen(false)}
          >
            ปิด
          </Button>
          {selected && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-red-500 h-7 hover:text-red-600"
              onClick={() => handleSelect(undefined)}
            >
              ล้างวันที่
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
