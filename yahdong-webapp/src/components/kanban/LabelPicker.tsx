import { useState } from 'react'
import { Tag, Plus, X, Check, Pencil } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover'
import { useLabels, useCreateLabel, useDeleteLabel, useSetTaskLabels, useUpdateLabel } from '../../hooks/useLabels'
import type { TaskLabel } from '../../api/tasks'

const LABEL_COLORS = [
  '#E8A030', '#4A7C5E', '#C8956A', '#EF4444', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#6B7280',
]

interface Props {
  projectId: string
  taskId: string
  taskLabels: TaskLabel[]
}

export default function LabelPicker({ projectId, taskId, taskLabels }: Props) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(LABEL_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const { data: labels = [] } = useLabels(projectId)
  const createLabel = useCreateLabel(projectId)
  const deleteLabel = useDeleteLabel(projectId)
  const updateLabel = useUpdateLabel(projectId)
  const setLabels = useSetTaskLabels(projectId)

  const selectedIds = new Set(taskLabels.map((tl) => tl.labelId))

  const handleToggle = (labelId: string) => {
    if (editingId) return
    const next = new Set(selectedIds)
    if (next.has(labelId)) next.delete(labelId)
    else next.add(labelId)
    setLabels.mutate({ taskId, labelIds: Array.from(next) })
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    await createLabel.mutateAsync({ name: newName.trim(), color: newColor })
    setNewName('')
    setCreating(false)
  }

  const startEdit = (e: React.MouseEvent, label: { id: string; name: string; color: string }) => {
    e.stopPropagation()
    setEditingId(label.id)
    setEditName(label.name)
    setEditColor(label.color)
    setCreating(false)
  }

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editingId) return
    await updateLabel.mutateAsync({ labelId: editingId, name: editName.trim(), color: editColor })
    setEditingId(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border transition-colors"
        style={{
          borderColor: 'var(--color-border-forest)',
          color: 'var(--color-text)',
          background: 'transparent',
        }}
      >
        <Tag className="size-3 text-[var(--color-primary)]" />
        {taskLabels.length === 0 ? 'เพิ่ม Label' : `${taskLabels.length} Label`}
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0 border-[var(--color-border-forest)] bg-[var(--color-paper)] shadow-lg"
        align="start"
      >
        <div className="p-2 border-b border-[var(--color-border-forest)]/40">
          <p className="text-xs font-semibold" style={{ color: 'var(--color-muted-foreground)' }}>
            Labels
          </p>
        </div>

        <div className="max-h-52 overflow-y-auto p-1">
          {labels.map((label) => {
            const selected = selectedIds.has(label.id)
            const isEditing = editingId === label.id

            if (isEditing) {
              return (
                <div key={label.id} className="px-2 py-2 space-y-2 rounded-lg bg-black/5">
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                  <div className="flex gap-1 flex-wrap">
                    {LABEL_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className="w-5 h-5 rounded-full border-2 transition-transform"
                        style={{
                          background: c,
                          borderColor: editColor === c ? 'var(--color-text)' : 'transparent',
                          transform: editColor === c ? 'scale(1.2)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      style={{ background: 'var(--color-primary)', color: 'white' }}
                      onClick={handleSaveEdit}
                      disabled={!editName.trim() || updateLabel.isPending}
                    >
                      บันทึก
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={label.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-black/5 group"
                onClick={() => handleToggle(label.id)}
              >
                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: label.color }} />
                <span className="flex-1 text-sm truncate" style={{ color: 'var(--color-text)' }}>
                  {label.name}
                </span>
                <div className="flex items-center gap-1">
                  {selected && <Check className="size-3.5 text-[var(--color-primary)]" />}
                  <button
                    type="button"
                    onClick={(e) => startEdit(e, label)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-[var(--color-primary)] transition-opacity"
                    style={{ color: 'var(--color-muted-foreground)' }}
                    title="แก้ไข"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteLabel.mutate(label.id) }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 transition-opacity"
                    style={{ color: 'var(--color-muted-foreground)' }}
                    title="ลบ"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            )
          })}
          {labels.length === 0 && (
            <p className="text-xs text-center py-3" style={{ color: 'var(--color-muted-foreground)' }}>
              ยังไม่มี label
            </p>
          )}
        </div>

        <div className="p-2 border-t border-[var(--color-border-forest)]/40">
          {!creating ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs gap-1.5 h-7"
              onClick={() => { setCreating(true); setEditingId(null) }}
              style={{ color: 'var(--color-text)' }}
            >
              <Plus className="size-3" />
              สร้าง label ใหม่
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ชื่อ label"
                className="h-7 text-xs"
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
              />
              <div>
                <Label className="text-xs mb-1 block" style={{ color: 'var(--color-muted-foreground)' }}>สี</Label>
                <div className="flex gap-1 flex-wrap">
                  {LABEL_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className="w-5 h-5 rounded-full border-2 transition-transform"
                      style={{
                        background: c,
                        borderColor: newColor === c ? 'var(--color-text)' : 'transparent',
                        transform: newColor === c ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                  onClick={handleCreate}
                  disabled={!newName.trim() || createLabel.isPending}
                >
                  สร้าง
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCreating(false)}>
                  ยกเลิก
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
