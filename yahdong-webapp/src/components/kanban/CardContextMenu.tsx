import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ExternalLinkIcon,
  UserIcon,
  FlagIcon,
  ArrowRightIcon,
  Trash2Icon,
  CheckIcon,
  ChevronRightIcon,
  XIcon,
} from 'lucide-react'
import type { Task, TaskPriority } from '../../api/tasks'
import type { Column } from '../../hooks/useBoard'
import { useMembers } from '../../hooks/useMembers'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'ต่ำ', color: '#94A3B8' },
  { value: 'medium', label: 'กลาง', color: '#F59E0B' },
  { value: 'high', label: 'สูง', color: '#EF4444' },
  { value: 'urgent', label: 'ด่วน! 🔥', color: '#DC2626' },
]

interface Props {
  task: Task
  x: number
  y: number
  columns: Column[]
  projectId: string
  onClose: () => void
  onOpen: () => void
  onAssign: (userId: string | null) => void
  onPriority: (priority: TaskPriority) => void
  onMoveTo: (statusId: string) => void
  onDelete: () => void
}

type SubMenu = 'assign' | 'priority' | 'move' | null

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  hasSubmenu,
  active,
}: {
  icon: React.ReactNode
  label: React.ReactNode
  onClick?: () => void
  danger?: boolean
  hasSubmenu?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors text-left"
      style={{
        color: danger ? '#EF4444' : active ? 'var(--color-primary)' : 'var(--color-text)',
        background: active ? 'var(--color-primary)12' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--color-border-forest)'
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      <span className="size-4 shrink-0 flex items-center justify-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {hasSubmenu && <ChevronRightIcon className="size-3.5 opacity-50" />}
    </button>
  )
}

export default function CardContextMenu({
  task, x, y, columns, projectId, onClose,
  onOpen, onAssign, onPriority, onMoveTo, onDelete,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [sub, setSub] = useState<SubMenu>(null)
  const { data: members = [] } = useMembers(projectId)

  // Adjust position so menu stays in viewport
  const [pos, setPos] = useState({ x, y })
  useEffect(() => {
    if (!ref.current) return
    const { offsetWidth: w, offsetHeight: h } = ref.current
    const vw = window.innerWidth, vh = window.innerHeight
    setPos({
      x: x + w > vw - 8 ? x - w : x,
      y: y + h > vh - 8 ? y - h : y,
    })
  }, [x, y])

  // Close on click outside / Escape
  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('keydown', key)
    }
  }, [onClose])

  const otherColumns = columns.filter((c) => c.id !== task.statusId)
  const assigneeIds = new Set(task.assignees?.map((a) => a.userId) ?? [])

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[9999] rounded-xl shadow-xl border overflow-hidden"
      style={{
        top: pos.y,
        left: pos.x,
        background: 'var(--color-paper)',
        borderColor: 'var(--color-border-forest)',
        minWidth: 200,
        maxWidth: 240,
      }}
    >
      {/* Main menu */}
      {sub === null && (
        <div className="p-1">
          <MenuItem
            icon={<ExternalLinkIcon className="size-3.5" />}
            label="เปิดรายละเอียด"
            onClick={() => { onOpen(); onClose() }}
          />

          <div className="my-1 h-px mx-2" style={{ background: 'var(--color-border-forest)' }} />

          <MenuItem
            icon={<UserIcon className="size-3.5" />}
            label={
              <span className="flex items-center gap-1.5">
                มอบหมาย
                {assigneeIds.size > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full ml-1"
                    style={{ background: 'var(--color-primary)20', color: 'var(--color-primary)' }}>
                    {assigneeIds.size}
                  </span>
                )}
              </span>
            }
            hasSubmenu
            onClick={() => setSub('assign')}
          />

          <MenuItem
            icon={<FlagIcon className="size-3.5" />}
            label="ความสำคัญ"
            hasSubmenu
            onClick={() => setSub('priority')}
          />

          {otherColumns.length > 0 && (
            <MenuItem
              icon={<ArrowRightIcon className="size-3.5" />}
              label="ย้ายไปคอลัมน์"
              hasSubmenu
              onClick={() => setSub('move')}
            />
          )}

          <div className="my-1 h-px mx-2" style={{ background: 'var(--color-border-forest)' }} />

          <MenuItem
            icon={<Trash2Icon className="size-3.5" />}
            label="ลบงาน"
            danger
            onClick={() => { onDelete(); onClose() }}
          />
        </div>
      )}

      {/* Assign submenu */}
      {sub === 'assign' && (
        <div className="p-1">
          <div className="flex items-center gap-1 px-2 py-1.5 mb-0.5">
            <button type="button" onClick={() => setSub(null)}
              className="p-0.5 rounded hover:bg-black/10 transition-colors">
              <ChevronRightIcon className="size-3.5 rotate-180" style={{ color: 'var(--color-muted-foreground)' }} />
            </button>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-muted-foreground)' }}>
              มอบหมายให้
            </span>
          </div>

          {assigneeIds.size > 0 && (
            <button
              type="button"
              onClick={() => { onAssign(null); onClose() }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md text-left transition-colors"
              style={{ color: '#EF4444' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-border-forest)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <XIcon className="size-3.5 shrink-0" />
              ยกเลิกทั้งหมด
            </button>
          )}

          {members.length === 0 ? (
            <p className="text-xs text-center py-3" style={{ color: 'var(--color-muted-foreground)' }}>
              ไม่มีสมาชิก
            </p>
          ) : (
            members.map((m) => {
              const isSelected = assigneeIds.has(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { onAssign(m.id) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md text-left transition-colors"
                  style={{ color: 'var(--color-text)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-border-forest)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <Avatar className="w-5 h-5 shrink-0">
                    <AvatarImage src={m.avatar ?? undefined} />
                    <AvatarFallback style={{ background: 'var(--color-primary)', color: 'white', fontSize: '0.5rem' }}>
                      {m.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate">{m.name}</span>
                  {isSelected && <CheckIcon className="size-3.5 text-[var(--color-primary)] shrink-0" />}
                </button>
              )
            })
          )}
        </div>
      )}

      {/* Priority submenu */}
      {sub === 'priority' && (
        <div className="p-1">
          <div className="flex items-center gap-1 px-2 py-1.5 mb-0.5">
            <button type="button" onClick={() => setSub(null)}
              className="p-0.5 rounded hover:bg-black/10 transition-colors">
              <ChevronRightIcon className="size-3.5 rotate-180" style={{ color: 'var(--color-muted-foreground)' }} />
            </button>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-muted-foreground)' }}>
              ความสำคัญ
            </span>
          </div>
          {PRIORITIES.map((p) => {
            const isSelected = task.priority === p.value
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => { onPriority(p.value); onClose() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md text-left transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-border-forest)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="flex-1">{p.label}</span>
                {isSelected && <CheckIcon className="size-3.5 shrink-0" style={{ color: p.color }} />}
              </button>
            )
          })}
        </div>
      )}

      {/* Move to submenu */}
      {sub === 'move' && (
        <div className="p-1">
          <div className="flex items-center gap-1 px-2 py-1.5 mb-0.5">
            <button type="button" onClick={() => setSub(null)}
              className="p-0.5 rounded hover:bg-black/10 transition-colors">
              <ChevronRightIcon className="size-3.5 rotate-180" style={{ color: 'var(--color-muted-foreground)' }} />
            </button>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-muted-foreground)' }}>
              ย้ายไปคอลัมน์
            </span>
          </div>
          {otherColumns.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => { onMoveTo(col.id); onClose() }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md text-left transition-colors"
              style={{ color: 'var(--color-text)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-border-forest)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.color }} />
              <span className="flex-1 truncate">{col.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}
