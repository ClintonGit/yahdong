import { useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../api/tasks'
import { getFileUrl } from '../../lib/utils'
import dong02 from '../../assets/dong/dong-sticker-02-เลยกำหนด.png'

const PRIORITY_COLOR: Record<string, string> = {
  low: '#94A3B8',
  medium: '#F59E0B',
  high: '#EF4444',
  urgent: '#DC2626',
}

interface Props {
  task: Task
  onClick: () => void
  onContextMenu: (e: React.MouseEvent, task: Task) => void
}

export default function TaskCard({ task, onClick, onContextMenu }: Props) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'task', task } })

  const wasDragging = useRef(false)
  useEffect(() => {
    if (isDragging) wasDragging.current = true
  }, [isDragging])

  const handleClick = () => {
    if (wasDragging.current) {
      wasDragging.current = false
      return
    }
    onClick()
  }

  const isOverdue = task.dueDate != null && new Date(task.dueDate) < new Date()
  const prioColor = PRIORITY_COLOR[task.priority] ?? '#94A3B8'
  const coverUrl = getFileUrl(task.coverImage)
  const hasCover = coverUrl || task.coverColor

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        background: 'var(--color-paper)',
        borderColor: isOverdue ? '#EF444440' : 'var(--color-border)',
      }}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, task) }}
      className="rounded-xl border cursor-grab active:cursor-grabbing
                 select-none hover:shadow-sm transition-shadow relative overflow-hidden"
    >
      {/* Cover: image or color */}
      {hasCover && (
        <div className="w-full h-[90px] overflow-hidden">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full" style={{ background: task.coverColor ?? undefined }} />
          )}
        </div>
      )}

      <div className="p-3">
        {/* Label chips */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {task.labels.map((tl) => (
              <span
                key={tl.labelId}
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  background: `${tl.label.color}25`,
                  color: tl.label.color,
                  border: `1px solid ${tl.label.color}40`,
                }}
              >
                {tl.label.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2">
          <span
            className="mt-1.5 w-2 h-2 rounded-full shrink-0"
            style={{ background: prioColor }}
          />
          <p
            className="text-sm leading-snug line-clamp-2 flex-1"
            style={{ color: 'var(--color-text)' }}
          >
            {task.title}
          </p>
        </div>

        {/* Checklist progress mini */}
        {task._count && task._count.checklistItems > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border-forest)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: '0%',
                  background: 'var(--color-primary)',
                }}
              />
            </div>
            <span className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
              0/{task._count.checklistItems}
            </span>
          </div>
        )}

        {(task.assignee || task.dueDate) && (
          <div
            className="flex items-center justify-between mt-2 pt-2 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {task.dueDate ? (
              <span
                className="text-xs"
                style={{ color: isOverdue ? '#EF4444' : 'var(--color-muted-foreground)' }}
              >
                {new Date(task.dueDate).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            ) : (
              <span />
            )}
            {task.assignee && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center
                           text-xs font-semibold shrink-0"
                style={{ background: 'var(--color-primary)', color: 'white' }}
                title={task.assignee.name}
              >
                {task.assignee.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dong-02: overdue badge */}
      {isOverdue && (
        <img
          src={dong02}
          alt="เลยกำหนด"
          className="absolute bottom-1 right-1 w-8 h-8 object-contain pointer-events-none"
          draggable={false}
        />
      )}
    </div>
  )
}
