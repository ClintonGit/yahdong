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
import { DatePicker } from '../ui/date-picker'
import { PaletteIcon, XIcon, ImageIcon } from 'lucide-react'
import type { Task, TaskPriority } from '../../api/tasks'
import { useUpdateTask, useDeleteTask } from '../../hooks/useBoard'
import { useComments } from '../../hooks/useComments'
import { getFileUrl } from '../../lib/utils'
import CommentSection from './CommentSection'
import LabelPicker from './LabelPicker'
import ChecklistSection from './ChecklistSection'
import AssigneePicker from './AssigneePicker'

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'ต่ำ', color: '#94A3B8' },
  { value: 'medium', label: 'กลาง', color: '#F59E0B' },
  { value: 'high', label: 'สูง', color: '#EF4444' },
  { value: 'urgent', label: 'ด่วน', color: '#DC2626' },
]

const COVER_COLORS = [
  '#E8A030', '#4A7C5E', '#C8956A', '#B8D4C0', '#F5EDE0',
  '#DDBEA9', '#89B4A0', '#E8C49A', '#7FA685', '#D4956A',
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
  const [coverImage, setCoverImage] = useState<string | null | undefined>(task.coverImage)
  const [coverColor, setCoverColor] = useState<string | null | undefined>(task.coverColor)
  const [assigneeId, setAssigneeId] = useState<string | null | undefined>(task.assigneeId)

  const updateTask = useUpdateTask(projectId)
  const deleteTask = useDeleteTask(projectId)
  const { data: comments } = useComments(task.id)

  const commentImages = (comments ?? []).filter((c) => c.imageUrl)

  const isDirty =
    title !== task.title ||
    description !== (task.description ?? '') ||
    priority !== task.priority ||
    dueDate !== (task.dueDate ? task.dueDate.split('T')[0] : '') ||
    coverImage !== task.coverImage ||
    coverColor !== task.coverColor ||
    assigneeId !== task.assigneeId

  const handleSave = async () => {
    if (!title.trim()) return
    await updateTask.mutateAsync({
      taskId: task.id,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || null,
      coverImage: coverImage ?? null,
      coverColor: coverColor ?? null,
      assigneeId: assigneeId ?? null,
    })
    onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm('ลบงานนี้?')) return
    await deleteTask.mutateAsync(task.id)
    onClose()
  }

  const hasCover = coverImage || coverColor

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        style={{ background: 'var(--color-paper)' }}
        className="max-w-xl max-h-[90vh] overflow-y-auto p-0"
      >
        {/* Cover section */}
        {hasCover && (
          <div className="relative h-36 w-full overflow-hidden rounded-t-xl">
            {coverImage ? (
              <img
                src={getFileUrl(coverImage) ?? ''}
                alt="cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full" style={{ background: coverColor ?? undefined }} />
            )}
            <button
              type="button"
              onClick={() => { setCoverImage(null); setCoverColor(null) }}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        )}

        <div className="px-5 pt-4 pb-5 space-y-4">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--color-text)', fontFamily: 'var(--font-family-heading)' }}>
              รายละเอียดงาน
            </DialogTitle>
          </DialogHeader>

          {/* Quick actions row */}
          <div className="flex flex-wrap gap-2">
            <LabelPicker
              projectId={projectId}
              taskId={task.id}
              taskLabels={task.labels ?? []}
            />
            <AssigneePicker
              projectId={projectId}
              assigneeId={assigneeId}
              assignee={task.assignee}
              onChange={setAssigneeId}
            />
          </div>

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
            <DatePicker
              value={dueDate}
              onChange={setDueDate}
              placeholder="เลือกวันกำหนดส่ง"
            />
          </div>

          {/* Cover color picker */}
          <div className="space-y-1.5">
            <Label style={{ color: 'var(--color-text)' }} className="flex items-center gap-1.5">
              <PaletteIcon className="size-3.5" />
              สีปกการ์ด
            </Label>
            <div className="flex gap-1.5 flex-wrap">
              {COVER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCoverColor(coverColor === c ? null : c); setCoverImage(null) }}
                  className="w-6 h-6 rounded-full border-2 transition-transform"
                  style={{
                    background: c,
                    borderColor: coverColor === c ? 'var(--color-text)' : 'transparent',
                    transform: coverColor === c ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Cover image picker */}
          {commentImages.length > 0 && (
            <div className="space-y-2">
              <Label style={{ color: 'var(--color-text)' }} className="flex items-center gap-1.5">
                <ImageIcon className="size-3.5" />
                ปกจากรูปในคอมเมนต์
              </Label>
              <div className="flex gap-2 flex-wrap">
                {commentImages.map((c) => {
                  const url = getFileUrl(c.imageUrl)
                  if (!url) return null
                  const isSelected = coverImage === c.imageUrl
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setCoverImage(isSelected ? null : c.imageUrl); setCoverColor(null) }}
                      className="relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0"
                      style={{
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[var(--color-primary)]/20 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold">✓</span>
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Checklist */}
          <div
            className="rounded-xl p-3"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-forest)' }}
          >
            <ChecklistSection taskId={task.id} />
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
