import { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { DateRangePicker } from '../ui/date-range-picker'
import { RichTextEditor } from '../ui/rich-text-editor'
import {
  PaletteIcon,
  XIcon,
  ImageIcon,
  LinkIcon,
  MessageSquareIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  usePanelRef,
} from 'react-resizable-panels'
import type { Task, TaskPriority } from '../../api/tasks'
import { useUpdateTask, useDeleteTask } from '../../hooks/useBoard'
import { useConfirm } from '../ui/confirm-dialog'
import { useComments } from '../../hooks/useComments'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { getFileUrl } from '../../lib/utils'
import CommentSection from './CommentSection'
import LabelPicker from './LabelPicker'
import ChecklistSection from './ChecklistSection'
import AssigneePicker from './AssigneePicker'
import { useMembers } from '../../hooks/useMembers'

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

const SPLIT_LAYOUT_ID = 'yahdong:task-modal-split'
const PANEL_MAIN_ID = 'main'
const PANEL_COMMENTS_ID = 'comments'

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
  const [startDate, setStartDate] = useState(
    task.startDate ? task.startDate.split('T')[0] : '',
  )
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.split('T')[0] : '',
  )
  const [coverImage, setCoverImage] = useState<string | null | undefined>(task.coverImage)
  const [coverColor, setCoverColor] = useState<string | null | undefined>(task.coverColor)
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task.assignees?.map((a) => a.userId) ?? [])

  const updateTask = useUpdateTask(projectId)
  const deleteTask = useDeleteTask(projectId)
  const { data: comments } = useComments(task.id)
  const { data: members } = useMembers(projectId)

  // Responsive: desktop = split panel, mobile = single column + drawer
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // Panel ref + collapsed state for desktop
  const commentsPanelRef = usePanelRef()
  const [commentsCollapsed, setCommentsCollapsed] = useState(false)
  const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false)

  // ถ้า deep-link มี highlightCommentId ใน mobile → auto-open drawer
  // เพื่อให้ CommentSection ติด scroll/flash ใน DOM ของ Sheet ทันที
  useEffect(() => {
    if (highlightCommentId && !isDesktop) {
      setMobileCommentsOpen(true)
    }
  }, [highlightCommentId, isDesktop])

  // ถ้า deep-link มี highlightCommentId ใน desktop และ panel ถูก collapse → expand
  useEffect(() => {
    if (highlightCommentId && isDesktop) {
      const ref = commentsPanelRef.current
      if (ref?.isCollapsed()) ref.expand()
    }
  }, [highlightCommentId, isDesktop, commentsPanelRef])

  // Persist split layout to localStorage (Vite CSR — window always available)
  // ใช้ onLayoutChanged (เรียกตอน release pointer) ไม่ใช่ onLayoutChange (deprecated, flood ขณะลาก)
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: SPLIT_LAYOUT_ID,
  })

  // Preview ของ assignee — ต้อง derive จาก project members ไม่ใช่จาก task.assignees
  // เพราะ user เพิ่งคลิกเลือกคนใหม่ที่ยังไม่อยู่ใน task.assignees → avatar จะหาย
  const previewAssignees = useMemo(() => {
    if (!members) return [] as { userId: string; user: { id: string; name: string; avatar?: string | null } }[]
    return members
      .filter((m) => assigneeIds.includes(m.id))
      .map((m) => ({
        userId: m.id,
        user: { id: m.id, name: m.name, avatar: m.avatar ?? null },
      }))
  }, [members, assigneeIds])

  const commentImages = (comments ?? []).filter((c) => c.imageUrl)
  const commentCount = comments?.length ?? 0

  const taskAssigneeIds = task.assignees?.map((a) => a.userId) ?? []
  const isDirty =
    title !== task.title ||
    description !== (task.description ?? '') ||
    priority !== task.priority ||
    startDate !== (task.startDate ? task.startDate.split('T')[0] : '') ||
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
        startDate: startDate || null,
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

  const confirm = useConfirm()

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'ลบงานนี้?',
      description: 'การลบจะไม่สามารถย้อนกลับได้',
      confirmText: 'ลบ',
      variant: 'destructive',
    })
    if (!ok) return
    try {
      await deleteTask.mutateAsync(task.id)
      onClose()
    } catch {
      toast.error('ลบงานไม่สำเร็จ กรุณาลองใหม่')
    }
  }

  const hasCover = coverImage || coverColor

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/projects/${projectId}?task=${task.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('คัดลอกลิงก์งานแล้ว')
    } catch {
      toast.error('คัดลอกไม่สำเร็จ')
    }
  }

  const handleClose = async () => {
    if (isDirty) {
      const ok = await confirm({
        title: 'ออกโดยไม่บันทึก?',
        description: 'การเปลี่ยนแปลงที่ยังไม่บันทึกจะหายไป',
        confirmText: 'ออก',
        cancelText: 'ทำต่อ',
        variant: 'destructive',
      })
      if (!ok) return
    }
    onClose()
  }

  const handleToggleComments = () => {
    const ref = commentsPanelRef.current
    if (!ref) return
    if (ref.isCollapsed()) {
      ref.expand()
    } else {
      ref.collapse()
    }
  }

  // Detect collapse via onResize (v4 removed onCollapse/onExpand)
  const handleCommentsResize = (
    nextSize: { asPercentage: number; inPixels: number },
    _id: string | number | undefined,
    prevSize: { asPercentage: number; inPixels: number } | undefined,
  ) => {
    const isCollapsed = nextSize.asPercentage === 0
    const wasCollapsed = prevSize ? prevSize.asPercentage === 0 : isCollapsed
    if (isCollapsed !== wasCollapsed || prevSize === undefined) {
      setCommentsCollapsed(isCollapsed)
    }
  }

  /** Header: title + dirty badge + (collapse comments | open comments drawer) + copy link */
  const renderHeader = () => (
    <DialogHeader className="px-6 pt-5 pb-3 shrink-0">
      <div className="flex items-center gap-2.5 flex-wrap">
        <DialogTitle style={{ color: 'var(--color-text)', fontFamily: 'var(--font-family-heading)', fontSize: '1.1rem' }}>
          รายละเอียดงาน
        </DialogTitle>
        {isDirty && (
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase shrink-0"
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              animation: 'badge-appear 0.18s ease-out',
            }}
          >
            ยังไม่บันทึก
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 shrink-0">
          {/* Mobile: open comments drawer */}
          {!isDesktop && (
            <button
              type="button"
              onClick={() => setMobileCommentsOpen(true)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg
                         hover:bg-black/5 transition-colors"
              style={{ color: 'var(--color-muted-foreground)' }}
              title="ดูคอมเมนต์"
            >
              <MessageSquareIcon className="size-3.5" />
              <span>คอมเมนต์{commentCount > 0 ? ` (${commentCount})` : ''}</span>
            </button>
          )}

          {/* Desktop: toggle comments panel */}
          {isDesktop && (
            <button
              type="button"
              onClick={handleToggleComments}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg
                         hover:bg-black/5 transition-colors"
              style={{ color: 'var(--color-muted-foreground)' }}
              title={commentsCollapsed ? 'แสดงคอมเมนต์' : 'ซ่อนคอมเมนต์'}
            >
              {commentsCollapsed ? (
                <>
                  <PanelRightOpenIcon className="size-3.5" />
                  <span>คอมเมนต์{commentCount > 0 ? ` (${commentCount})` : ''}</span>
                </>
              ) : (
                <>
                  <PanelRightCloseIcon className="size-3.5" />
                  <span>ซ่อนคอมเมนต์</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg
                       hover:bg-black/5 transition-colors"
            style={{ color: 'var(--color-muted-foreground)' }}
            title="คัดลอกลิงก์งาน"
          >
            <LinkIcon className="size-3.5" />
            <span>คัดลอกลิงก์</span>
          </button>
        </div>
      </div>
    </DialogHeader>
  )

  /** Main content (left): title input + description + checklist + meta sidebar (200px) */
  const renderMainContent = () => (
    <div className="px-6 pt-1 pb-6">
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
              assignees={previewAssignees}
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
              ช่วงเวลา
            </p>
            <DateRangePicker
              value={{ from: startDate, to: dueDate }}
              onChange={(range) => {
                setStartDate(range.from ?? '')
                setDueDate(range.to ?? '')
              }}
              placeholder="วันเริ่มต้น - วันสิ้นสุด"
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
                onClick={handleClose}
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
    </div>
  )

  /** Comments inside a panel/drawer wrapper */
  const renderComments = () => (
    <div className="px-5 pb-6 pt-3">
      <CommentSection taskId={task.id} projectId={projectId} highlightCommentId={highlightCommentId} />
    </div>
  )

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent
        style={{ background: 'var(--color-paper)' }}
        className="!flex !flex-col w-full max-w-6xl sm:max-w-6xl max-h-[92vh] overflow-hidden p-0 gap-0"
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

        {renderHeader()}

        {/* Body — desktop split panel | mobile single column */}
        {isDesktop ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <Group
              orientation="horizontal"
              defaultLayout={defaultLayout}
              onLayoutChanged={onLayoutChanged}
              style={{ height: '100%' }}
            >
              <Panel id={PANEL_MAIN_ID} defaultSize={70} minSize={50}>
                <div className="h-full overflow-y-auto">
                  {renderMainContent()}
                </div>
              </Panel>
              <Separator
                className="group/sep relative flex items-center justify-center transition-colors"
                style={{
                  width: 6,
                  background: 'var(--color-border)',
                  cursor: 'col-resize',
                }}
              />
              <Panel
                id={PANEL_COMMENTS_ID}
                panelRef={commentsPanelRef}
                defaultSize={30}
                minSize={20}
                maxSize={50}
                collapsible
                collapsedSize={0}
                onResize={handleCommentsResize}
              >
                <div
                  className="h-full overflow-y-auto border-l"
                  style={{ borderColor: 'var(--color-border-forest)' }}
                >
                  {renderComments()}
                </div>
              </Panel>
            </Group>
          </div>
        ) : (
          // Mobile: single column with own scroll, comments via Sheet drawer
          <div className="flex-1 overflow-y-auto">
            {renderMainContent()}
          </div>
        )}

        {/* Mobile comments drawer */}
        {!isDesktop && (
          <Sheet open={mobileCommentsOpen} onOpenChange={setMobileCommentsOpen}>
            <SheetContent
              side="right"
              className="w-full sm:max-w-md p-0 flex flex-col"
              style={{ background: 'var(--color-paper)' }}
            >
              <SheetHeader className="border-b px-4 py-3 shrink-0" style={{ borderColor: 'var(--color-border-forest)' }}>
                <SheetTitle>คอมเมนต์{commentCount > 0 ? ` (${commentCount})` : ''}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                {renderComments()}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </DialogContent>
    </Dialog>
  )
}
