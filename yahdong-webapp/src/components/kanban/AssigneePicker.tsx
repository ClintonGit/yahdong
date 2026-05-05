import { UserIcon, XIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { useMembers } from '../../hooks/useMembers'

interface Props {
  projectId: string
  assigneeId?: string | null
  assignee?: { id: string; name: string; avatar?: string | null } | null
  onChange: (userId: string | null) => void
}

export default function AssigneePicker({ projectId, assigneeId, assignee, onChange }: Props) {
  const { data: members = [] } = useMembers(projectId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border transition-colors"
        style={{
          borderColor: 'var(--color-border-forest)',
          color: 'var(--color-text)',
          background: 'transparent',
        }}
      >
        {assignee ? (
          <>
            <Avatar className="w-4 h-4">
              <AvatarImage src={assignee.avatar ?? undefined} />
              <AvatarFallback
                style={{ background: 'var(--color-primary)', color: 'white', fontSize: '0.5rem' }}
              >
                {assignee.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[100px]">{assignee.name}</span>
          </>
        ) : (
          <>
            <UserIcon className="size-3 text-[var(--color-primary)]" />
            มอบหมาย
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        style={{ background: 'var(--color-paper)' }}
        className="w-48 border-[var(--color-border-forest)]"
      >
        {assigneeId && (
          <DropdownMenuItem
            onClick={() => onChange(null)}
            className="gap-2 text-red-500 cursor-pointer"
          >
            <XIcon className="size-3.5" />
            ยกเลิกการมอบหมาย
          </DropdownMenuItem>
        )}
        {members.map((member) => (
          <DropdownMenuItem
            key={member.id}
            onClick={() => onChange(member.id)}
            className="gap-2 cursor-pointer"
            style={{ color: 'var(--color-text)' }}
          >
            <Avatar className="w-5 h-5">
              <AvatarImage src={member.avatar ?? undefined} />
              <AvatarFallback
                style={{ background: 'var(--color-primary)', color: 'white', fontSize: '0.55rem' }}
              >
                {member.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{member.name}</span>
            {member.id === assigneeId && (
              <span className="ml-auto text-[var(--color-primary)]">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
