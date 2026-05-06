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
import { DatePicker } from '../ui/date-picker'
import { RichTextEditor } from '../ui/rich-text-editor'
import { PaletteIcon, XIcon, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
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
  highlightCommentId?: string
}

export default function TaskDetailModal({ projectId, task, onClose, highlightCommentId }: Props) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.split('T')[0] : '',
  )
  const [coverImage, setCoverImage] = useState<string | null | undefined>(task.coverImage)
  const [coverColor, setCoverColor] = useState<string | null | undefined>(task.coverColor)
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task.assignees?.map((a) => a.userId) ?? [])

  const updateTask = useUpdateTask(projectId)
  const deleteTask = useDeleteTask(projectId)
  const { data: comments } = useComments(task.id)

  const commentImages = (comments ?? []).filter((c) => c.imageUrl)

  const taskAssigneeIds = task.assignees?.map((a) => a.userId) ?? []
  const isDirty =
    title !== task.title ||
    description !== (task.description ?? '') ||
    priority !== task.priority ||
    dueDate !== (task.dueDate ? task.dueDate.split('T')[0] : '') ||
    coverImage !== task.coverImage ||
    coverColor !== task.coverColor ||
    JSON.stringify([...assigneeIds].sort()) !== JSON.stringify([...taskAssigneeIds].sort())

  const handleSave = async () => {
    if (!title.trim()) return
    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || null,
        coverImage: coverImage ?? null,
        coverColor: coverColor ?? null,
        assigneeIds,
      })
      onClose()
    } catch {
      toast.error('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('ลบงานนี้?')) return
    try {
      await deleteTask.mutateAsync(task.id)
      onClose()
    } catch {
      toast.error('ลบงานไม่สำเร็จ กรุณาลองใหม่')
    }
  }

  const hasCover = coverImage || coverColor

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        style={{ background: 'var(--color-paper)' }}
        className="!flex !flex-col w-full max-w-4xl sm:max-w-4xl max-h-[92vh] overflow-hidden p-0 gap-0"
      >
        {/* Cover */}
        {hasCover && (
          <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-t-xl">
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

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          <div className="px-6 pt-5 pb-6">
            <DialogHeader className="mb-4">
              <DialogTitle style={{ color: 'var(--color-text)', fontFamily: 'var(--font-family-heading)', fontSize: '1.1rem' }}>
                รายละเอียดงาน
              </DialogTitle>
            </DialogHeader>

            {/* 2-column layout */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-5">

              {/* LEFT — main content */}
              <div className="space-y-4 min-w-0">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    ชื่องาน
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-base font-medium"
                    style={{
                      background: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                    }}
                  />
                </div>

                {/* Description — rich text editor */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    รายละเอียด
                  </Label>
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="รายละเอียดงาน... ลากรูปภาพมาวางได้เลยค่ะ"
                    minHeight="200px"
                  />
                </div>

                {/* Checklist */}
                <div
                  className="rounded-xl p-3"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-forest)' }}
                >
                  <ChecklistSection taskId={task.id} />
                </div>
              </div>

              {/* RIGHT — meta */}
              <div className="space-y-4">
                {/* Quick action pills */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
                    มอบหมาย
                  </p>
                  <AssigneePicker
                    projectId={projectId}
                    assignees={task.assignees?.filter((a) =>
                      assigneeIds.includes(a.userId)
                    ) ?? []}
                    onChange={setAssigneeIds}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
                    Labels
                  </p>
                  <LabelPicker
                    projectId={projectId}
                    taskId={task.id}
                    taskLabels={task.labels ?? []}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
                    ความสำคัญ
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRIORITIES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPriority(opt.value)}
                        className="py-1 text-xs rounded-lg border transition-all"
                        style={{
                          borderColor: priority === opt.value ? opt.color : 'var(--color-border)',
                          background: priority === opt.value ? `${opt.color}25` : 'transparent',
                          color: priority === opt.value ? opt.color : 'var(--color-muted-foreground)',
                          fontWeight: priority === opt.value ? 600 : 400,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
                    กำหนดส่ง
                  </p>
                  <DatePicker
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder="เลือกวัน"
                  />
                </div>

                {/* Cover color */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--color-muted-foreground)' }}>
                    <PaletteIcon className="size-3" />
                    สีปกการ์ด
                  </p>
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

                {/* Cover image from comments */}
                {commentImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--color-muted-foreground)' }}>
                      <ImageIcon className="size-3" />
                      ปกจากคอมเมนต์
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {commentImages.map((c) => {
                        const url = getFileUrl(c.imageUrl)
                        if (!url) return null
                        const isSelected = coverImage === c.imageUrl
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setCoverImage(isSelected ? null : c.imageUrl); setCoverColor(null) }}
                            className="relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0"
                            style={{
                              borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                              transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                            }}
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-[var(--color-primary)]/20 flex items-center justify-center">
                                <span className="text-white text-[9px] font-bold bg-[var(--color-primary)] rounded-full w-4 h-4 flex items-center justify-center">✓</span>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border-forest)' }}>
                  <Button
                    onClick={handleSave}
                    disabled={!isDirty || updateTask.isPending}
                    className="w-full"
                    style={{ background: 'var(--color-primary)', color: 'white' }}
                  >
                    {updateTask.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1 text-sm"
                      onClick={onClose}
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      ปิด
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleDelete}
                      disabled={deleteTask.isPending}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      ลบ
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments — full width below */}
            <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--color-border-forest)' }}>
              <CommentSection taskId={task.id} projectId={projectId} highlightCommentId={highlightCommentId} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
