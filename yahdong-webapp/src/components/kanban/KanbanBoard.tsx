import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Column } from '../../hooks/useBoard'
import type { Task, TaskStatus } from '../../api/tasks'
import {
  useBoard,
  useMoveTask,
  useCreateTask,
  useReorderStatuses,
  useCreateStatus,
} from '../../hooks/useBoard'
import KanbanColumn from './KanbanColumn'
import TaskDetailModal from './TaskDetailModal'
import GlitterEffect from './GlitterEffect'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

const COLUMN_COLORS = [
  '#E8A030', '#4A7C5E', '#C8956A', '#8B6343',
  '#7A9E7E', '#6366F1', '#EC4899', '#F97316',
]

interface Props {
  projectId: string
}

export default function KanbanBoard({ projectId }: Props) {
  const { columns: serverColumns, isLoading, isError } = useBoard(projectId)
  const [localColumns, setLocalColumns] = useState<Column[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeColumn, setActiveColumn] = useState<TaskStatus | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showAddCol, setShowAddCol] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [glitterPos, setGlitterPos] = useState<{ x: number; y: number } | null>(null)

  // track origin column เพื่อ detect cross-column drop สำหรับ glitter
  const dragOriginColId = useRef<string | null>(null)

  const moveTask = useMoveTask(projectId)
  const createTask = useCreateTask(projectId)
  const reorderStatuses = useReorderStatuses(projectId)
  const createStatus = useCreateStatus(projectId)

  useEffect(() => {
    if (!activeTask && !activeColumn) {
      setLocalColumns(serverColumns)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverColumns])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const findColOfTask = useCallback(
    (taskId: string, cols: Column[]) =>
      cols.find((c) => c.tasks.some((t) => t.id === taskId)),
    [],
  )

  const isColumnId = useCallback(
    (id: string, cols: Column[]) => cols.some((c) => c.id === id),
    [],
  )

  const onDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type as string | undefined
    if (type === 'task') {
      const task = event.active.data.current?.task as Task
      dragOriginColId.current = findColOfTask(task.id, localColumns)?.id ?? null
      setActiveTask(task)
    } else if (type === 'column') {
      setActiveColumn(event.active.data.current?.column as TaskStatus)
    }
  }

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeType = active.data.current?.type as string | undefined
    const overType = over.data.current?.type as string | undefined

    if (activeType !== 'task') return
    if (activeId === overId) return

    setLocalColumns((prev) => {
      const sourceCol = findColOfTask(activeId, prev)
      const targetColId =
        overType === 'task'
          ? findColOfTask(overId, prev)?.id
          : overType === 'column' && isColumnId(overId, prev)
            ? overId
            : undefined

      if (!sourceCol || !targetColId) return prev
      if (sourceCol.id === targetColId) return prev

      const cols = prev.map((c) => ({ ...c, tasks: [...c.tasks] }))
      const from = cols.find((c) => c.id === sourceCol.id)!
      const to = cols.find((c) => c.id === targetColId)!
      const task = from.tasks.find((t) => t.id === activeId)!

      from.tasks = from.tasks.filter((t) => t.id !== activeId)

      if (overType === 'task') {
        const overIdx = to.tasks.findIndex((t) => t.id === overId)
        to.tasks.splice(overIdx, 0, { ...task, statusId: targetColId })
      } else {
        to.tasks.push({ ...task, statusId: targetColId })
      }

      return cols
    })
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const originColId = dragOriginColId.current
    dragOriginColId.current = null

    setActiveTask(null)
    setActiveColumn(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeType = active.data.current?.type as string | undefined
    const overType = over.data.current?.type as string | undefined

    if (activeId === overId) return

    // ── Column reorder ──
    if (activeType === 'column') {
      setLocalColumns((prev) => {
        const fromIdx = prev.findIndex((c) => c.id === activeId)
        const toIdx = prev.findIndex((c) => c.id === overId)
        if (fromIdx === -1 || toIdx === -1) return prev
        const newCols = arrayMove(prev, fromIdx, toIdx)
        reorderStatuses.mutate(newCols.map((c) => c.id))
        return newCols
      })
      return
    }

    // ── Task move ──
    if (activeType !== 'task') return

    const targetColId =
      overType === 'task'
        ? findColOfTask(overId, localColumns)?.id
        : overType === 'column' && isColumnId(overId, localColumns)
          ? overId
          : findColOfTask(activeId, localColumns)?.id

    if (!targetColId) return

    // 🎉 Glitter เมื่อลากข้ามคอลัมน์
    if (originColId && targetColId !== originColId) {
      const rect = active.rect.current.translated
      if (rect) {
        setGlitterPos({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        })
      }
    }

    setLocalColumns((prev) => {
      const cols = prev.map((c) => ({ ...c, tasks: [...c.tasks] }))
      const targetCol = cols.find((c) => c.id === targetColId)!

      if (overType === 'task') {
        const fromIdx = targetCol.tasks.findIndex((t) => t.id === activeId)
        const toIdx = targetCol.tasks.findIndex((t) => t.id === overId)
        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
          targetCol.tasks = arrayMove(targetCol.tasks, fromIdx, toIdx)
        }
      }

      const taskIdx = targetCol.tasks.findIndex((t) => t.id === activeId)
      if (taskIdx === -1) return prev

      const prevOrder = targetCol.tasks[taskIdx - 1]?.order ?? 0
      const nextOrder = targetCol.tasks[taskIdx + 1]?.order
      const newOrder =
        nextOrder != null ? (prevOrder + nextOrder) / 2 : prevOrder + 1000

      moveTask.mutate({ taskId: activeId, statusId: targetColId, order: newOrder })
      return cols
    })
  }

  const handleAddTask = (statusId: string, title: string) => {
    createTask.mutate({ title, statusId })
  }

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newColName.trim()
    if (!name) return
    const color = COLUMN_COLORS[localColumns.length % COLUMN_COLORS.length]
    createStatus.mutate({ name, color })
    setNewColName('')
    setShowAddCol(false)
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 p-6 overflow-x-auto h-full">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-68 h-80 rounded-2xl shrink-0 animate-pulse"
            style={{ background: 'var(--color-card)' }}
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className="flex items-center justify-center h-full text-sm"
        style={{ color: 'var(--color-muted-foreground)' }}
      >
        เกิดข้อผิดพลาด กรุณาลองใหม่
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={localColumns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4 h-full px-6 pb-6 pt-3 overflow-x-auto items-start">
            {localColumns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                onTaskClick={setSelectedTask}
                onAddTask={handleAddTask}
              />
            ))}

            {/* Add column */}
            <div className="shrink-0 w-64">
              {showAddCol ? (
                <form
                  onSubmit={handleAddColumn}
                  className="rounded-2xl p-3 space-y-2"
                  style={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <Input
                    autoFocus
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && setShowAddCol(false)}
                    placeholder="ชื่อคอลัมน์..."
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-1.5">
                    <Button
                      type="submit"
                      size="sm"
                      className="flex-1 text-sm"
                      style={{ background: 'var(--color-primary)', color: 'white' }}
                    >
                      เพิ่ม
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddCol(false)}
                    >
                      ยกเลิก
                    </Button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddCol(true)}
                  className="w-full py-3 rounded-2xl text-sm border border-dashed
                             hover:border-solid transition-all"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-muted-foreground)',
                  }}
                >
                  + เพิ่มคอลัมน์
                </button>
              )}
            </div>
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <div
              className="p-3 rounded-xl border shadow-xl rotate-1"
              style={{
                background: 'var(--color-paper)',
                borderColor: 'var(--color-border)',
                width: 256,
              }}
            >
              <p
                className="text-sm line-clamp-2"
                style={{ color: 'var(--color-text)' }}
              >
                {activeTask.title}
              </p>
            </div>
          )}
          {activeColumn && (
            <div
              className="px-3 py-2.5 rounded-2xl border shadow-xl"
              style={{
                background: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                width: 272,
              }}
            >
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--color-text)' }}
              >
                {activeColumn.name}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailModal
          projectId={projectId}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* 🎉 Glitter snap effect */}
      {glitterPos && (
        <GlitterEffect
          x={glitterPos.x}
          y={glitterPos.y}
          onDone={() => setGlitterPos(null)}
        />
      )}
    </>
  )
}
