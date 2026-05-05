import { useState, useRef } from 'react'
import { CheckSquareIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useChecklist, useAddChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem } from '../../hooks/useChecklist'

interface Props {
  taskId: string
}

export default function ChecklistSection({ taskId }: Props) {
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: items = [] } = useChecklist(taskId)
  const addItem = useAddChecklistItem(taskId)
  const updateItem = useUpdateChecklistItem(taskId)
  const deleteItem = useDeleteChecklistItem(taskId)

  const checkedCount = items.filter((i) => i.checked).length
  const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0

  const handleAdd = async () => {
    if (!newText.trim()) return
    await addItem.mutateAsync(newText.trim())
    setNewText('')
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-2">
      {/* Header + progress */}
      <div className="flex items-center gap-2">
        <CheckSquareIcon className="size-3.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
        <span className="text-sm font-medium flex-1" style={{ color: 'var(--color-text)' }}>
          Checklist
        </span>
        {items.length > 0 && (
          <span className="text-xs tabular-nums" style={{ color: 'var(--color-muted-foreground)' }}>
            {checkedCount}/{items.length}
          </span>
        )}
      </div>

      {items.length > 0 && (
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border-forest)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: progress === 100 ? '#22C55E' : 'var(--color-primary)',
            }}
          />
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group rounded-lg px-1 py-0.5 hover:bg-black/5">
            <button
              type="button"
              onClick={() => updateItem.mutate({ itemId: item.id, checked: !item.checked })}
              className="w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors"
              style={{
                borderColor: item.checked ? '#22C55E' : 'var(--color-border-forest)',
                background: item.checked ? '#22C55E' : 'transparent',
              }}
            >
              {item.checked && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span
              className="flex-1 text-sm"
              style={{
                color: item.checked ? 'var(--color-muted-foreground)' : 'var(--color-text)',
                textDecoration: item.checked ? 'line-through' : 'none',
              }}
            >
              {item.text}
            </span>
            <button
              type="button"
              onClick={() => deleteItem.mutate(item.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 transition-opacity"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              <Trash2Icon className="size-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add item */}
      {adding ? (
        <div className="flex gap-1.5">
          <Input
            ref={inputRef}
            autoFocus
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="รายการใหม่..."
            className="h-8 text-sm flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') { setAdding(false); setNewText('') }
            }}
          />
          <Button
            size="sm"
            className="h-8 text-xs"
            style={{ background: 'var(--color-primary)', color: 'white' }}
            onClick={handleAdd}
            disabled={!newText.trim() || addItem.isPending}
          >
            เพิ่ม
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setAdding(false); setNewText('') }}
          >
            ยกเลิก
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-1.5 h-7 text-xs"
          style={{ color: 'var(--color-muted-foreground)' }}
          onClick={() => setAdding(true)}
        >
          <PlusIcon className="size-3" />
          เพิ่มรายการ
        </Button>
      )}
    </div>
  )
}
