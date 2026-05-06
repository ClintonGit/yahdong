import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { useNotifications, useMarkAllRead, useMarkRead } from '../hooks/useNotifications'
import { requestBrowserNotificationPermission } from '../hooks/useNotificationAlerts'
import type { Notification } from '../api/notifications'

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return 'เมื่อกี้'
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

function NotifItem({ notif, onNavigate }: { notif: Notification; onNavigate: () => void }) {
  const navigate = useNavigate()
  const markRead = useMarkRead()
  const isUnread = !notif.readAt

  const handleClick = () => {
    if (isUnread) markRead.mutate(notif.id)
    onNavigate()
    navigate(`/projects/${notif.task.projectId}`)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-left px-3 py-2.5 hover:bg-black/5 transition-colors flex gap-2.5"
    >
      {isUnread && (
        <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--color-primary)' }} />
      )}
      {!isUnread && <span className="w-2 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-snug" style={{ color: 'var(--color-text)', fontWeight: isUnread ? 600 : 400 }}>
          {notif.body}
        </p>
        <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--color-muted-foreground)' }}>
          {notif.task.title}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
          {formatTime(notif.createdAt)}
        </p>
      </div>
    </button>
  )
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data: notifications = [] } = useNotifications()
  const markAllRead = useMarkAllRead()

  const unreadCount = notifications.filter((n) => !n.readAt).length

  const handleOpenChange = (next: boolean) => {
    if (next) requestBrowserNotificationPermission()
    setOpen(next)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className="relative p-2 rounded-lg hover:bg-black/5 transition-colors"
        title="แจ้งเตือน"
      >
        <Bell className="size-4" style={{ color: 'var(--color-muted-foreground)' }} />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: '#EF4444', color: 'white' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 border-[var(--color-border-forest)] bg-[var(--color-paper)] shadow-xl"
        align="end"
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: 'var(--color-border-forest)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            แจ้งเตือน
          </p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="text-xs hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              อ่านทั้งหมด
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: 'var(--color-border-forest)' }}>
          {notifications.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: 'var(--color-muted-foreground)' }}>
              ไม่มีแจ้งเตือน
            </p>
          ) : (
            notifications.map((n) => (
              <NotifItem key={n.id} notif={n} onNavigate={() => setOpen(false)} />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
