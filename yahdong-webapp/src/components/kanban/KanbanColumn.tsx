import { useState } from 'react'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Column } from '../../hooks/useBoard'
import type { Task } from '../../api/tasks'
import TaskCard from './TaskCard'
import { Input } from '../ui/input'

interface Props {
  column: Column
  onTaskClick: (task: Task) => void
  onAddTask: (statusId: string, title: string) => void
  onTaskContextMenu: (e: React.MouseEvent, task: Task) => void
  unreadTaskIds?: Set<string>
}

export default function KanbanColumn({ column, onTaskClick, onAddTask, onTaskContextMenu, unreadTaskIds }: Props) {
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: 'column', column } })

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newTitle.trim()
    if (!trimmed) return
    onAddTask(column.id, trimmed)
    setNewTitle('')
    setAdding(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        width: 272,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
      }}
    >
      {/* Header — drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center gap-2 px-3 py-2.5 rounded-t-2xl
                   cursor-grab active:cursor-grabbing select-none border-b"
        style={{
          background: 'var(--color-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ background: column.color }}
        />
        <span
          className="text-sm font-semibold flex-1 truncate"
          style={{ color: 'var(--color-text)' }}
        >
          {column.name}
        </span>
        <span
          className="text-xs shrink-0"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          {column.tasks.length}
        </span>
      </div>

      {/* Task list */}
      <div
        className="flex-1 overflow-y-auto px-2 py-2 space-y-2 min-h-[60px]"
        style={{ background: 'var(--color-card)' }}
      >
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onContextMenu={onTaskContextMenu}
              hasUnread={unreadTaskIds?.has(task.id)}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add task */}
      <div
        className="px-2 pb-2 pt-1 rounded-b-2xl"
        style={{ background: 'var(--color-card)' }}
      >
        {adding ? (
          <form onSubmit={handleAddSubmit} className="space-y-1.5">
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
              placeholder="ชื่องาน..."
              className="h-8 text-sm"
            />
            <div className="flex gap-1.5">
              <button
                type="submit"
                className="flex-1 py-1 text-xs rounded-lg font-medium"
                style={{ background: 'var(--color-primary)', color: 'white' }}
              >
                เพิ่ม
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="px-2 py-1 text-xs rounded-lg"
                style={{
                  background: 'var(--color-muted)',
                  color: 'var(--color-muted-foreground)',
                }}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full text-left px-2 py-1.5 text-sm rounded-lg
                       hover:bg-black/5 transition-colors"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            + เพิ่มงาน
          </button>
        )}
      </div>
    </div>
  )
}
