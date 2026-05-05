import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import type { Task, TaskPriority } from '../../api/tasks'
import { useUpdateTask, useDeleteTask } from '../../hooks/useBoard'
import CommentSection from './CommentSection'

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'ต่ำ', color: '#94A3B8' },
  { value: 'medium', label: 'กลาง', color: '#F59E0B' },
  { value: 'high', label: 'สูง', color: '#EF4444' },
  { value: 'urgent', label: 'ด่วน', color: '#DC2626' },
]

interface Props {
  projectId: string
  task: Task
  onClose: () => void
}

export default function TaskDetailModal({ projectId, task, onClose }: Props) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.split('T')[0] : '',
  )

  const updateTask = useUpdateTask(projectId)
  const deleteTask = useDeleteTask(projectId)

  const isDirty =
    title !== task.title ||
    description !== (task.description ?? '') ||
    priority !== task.priority ||
    dueDate !== (task.dueDate ? task.dueDate.split('T')[0] : '')

  const handleSave = async () => {
    if (!title.trim()) return
    await updateTask.mutateAsync({
      taskId: task.id,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || null,
    })
    onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm('ลบงานนี้?')) return
    await deleteTask.mutateAsync(task.id)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        style={{ background: 'var(--color-paper)' }}
        className="max-w-xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--color-text)', fontFamily: 'var(--font-family-heading)' }}>
            รายละเอียดงาน
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <div className="space-y-1">
            <Label style={{ color: 'var(--color-text)' }}>ชื่องาน</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                background: 'var(--color-card)',
                borderColor: 'var(--color-border)',
              }}
            />
          </div>

          <div className="space-y-1">
            <Label style={{ color: 'var(--color-text)' }}>รายละเอียด</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="รายละเอียดงาน..."
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label style={{ color: 'var(--color-text)' }}>ความสำคัญ</Label>
            <div className="flex gap-2">
              {PRIORITIES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className="flex-1 py-1.5 text-xs rounded-lg border transition-all"
                  style={{
                    borderColor:
                      priority === opt.value ? opt.color : 'var(--color-border)',
                    background:
                      priority === opt.value ? `${opt.color}25` : 'transparent',
                    color:
                      priority === opt.value ? opt.color : 'var(--color-muted-foreground)',
                    fontWeight: priority === opt.value ? 600 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label style={{ color: 'var(--color-text)' }}>กำหนดส่ง</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                background: 'var(--color-card)',
                borderColor: 'var(--color-border)',
              }}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={!isDirty || updateTask.isPending}
              className="flex-1"
              style={{ background: 'var(--color-primary)', color: 'white' }}
            >
              {updateTask.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              ปิด
            </Button>
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={deleteTask.isPending}
              className="text-red-500 hover:text-red-600"
            >
              ลบ
            </Button>
          </div>

          <CommentSection taskId={task.id} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
