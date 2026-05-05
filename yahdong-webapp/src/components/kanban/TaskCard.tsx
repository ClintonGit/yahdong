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
}

export default function TaskCard({ task, onClick }: Props) {
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
      className="rounded-xl border cursor-grab active:cursor-grabbing
                 select-none hover:shadow-sm transition-shadow relative overflow-hidden"
    >
      {/* Cover image */}
      {coverUrl && (
        <div className="w-full h-[100px] overflow-hidden">
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}

      <div className="p-3">
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
