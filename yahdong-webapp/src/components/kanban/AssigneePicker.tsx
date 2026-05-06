import { useState } from 'react'
import { Users, X, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { useMembers } from '../../hooks/useMembers'
import type { TaskAssignee } from '../../api/tasks'

interface Props {
  projectId: string
  assignees: TaskAssignee[]
  onChange: (ids: string[]) => void
}

export default function AssigneePicker({ projectId, assignees, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const { data: members = [] } = useMembers(projectId)

  const selectedIds = new Set(assignees.map((a) => a.userId))

  const handleToggle = (userId: string) => {
    const next = new Set(selectedIds)
    if (next.has(userId)) next.delete(userId)
    else next.add(userId)
    onChange(Array.from(next))
  }

  const handleClearAll = () => {
    onChange([])
    setOpen(false)
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
        {assignees.length === 0 ? (
          <>
            <Users className="size-3 text-[var(--color-primary)]" />
            มอบหมาย
          </>
        ) : (
          <div className="flex items-center gap-1">
            {assignees.slice(0, 3).map((a) => (
              <Avatar key={a.userId} className="w-5 h-5 -ml-1 first:ml-0 border border-[var(--color-paper)]">
                <AvatarImage src={a.user.avatar ?? undefined} />
                <AvatarFallback style={{ background: 'var(--color-primary)', color: 'white', fontSize: '0.45rem' }}>
                  {a.user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {assignees.length > 3 && (
              <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                +{assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-0 border-[var(--color-border-forest)] bg-[var(--color-paper)] shadow-lg"
        align="start"
      >
        <div className="p-2 border-b border-[var(--color-border-forest)]/40">
          <p className="text-xs font-semibold" style={{ color: 'var(--color-muted-foreground)' }}>
            มอบหมายให้
          </p>
        </div>
        <div className="max-h-48 overflow-y-auto p-1">
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-red-500 hover:bg-black/5 mb-0.5"
            >
              <X className="size-3.5" />
              ยกเลิกทั้งหมด
            </button>
          )}
          {members.map((member) => {
            const selected = selectedIds.has(member.id)
            return (
              <div
                key={member.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-black/5"
                onClick={() => handleToggle(member.id)}
              >
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarImage src={member.avatar ?? undefined} />
                  <AvatarFallback style={{ background: 'var(--color-primary)', color: 'white', fontSize: '0.5rem' }}>
                    {member.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm truncate" style={{ color: 'var(--color-text)' }}>
                  {member.name}
                </span>
                {selected && <Check className="size-3.5 text-[var(--color-primary)]" />}
              </div>
            )
          })}
          {members.length === 0 && (
            <p className="text-xs text-center py-3" style={{ color: 'var(--color-muted-foreground)' }}>
              ไม่มีสมาชิก
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
