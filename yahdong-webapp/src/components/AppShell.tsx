import { useState } from 'react'
import { MenuIcon } from 'lucide-react'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'
import { useNotificationAlerts } from '../hooks/useNotificationAlerts'

export default function AppShell({ children }: { children: React.ReactNode }) {
  useNotificationAlerts()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex items-center px-4 py-1.5 shrink-0 border-b gap-2"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-paper)' }}
        >
          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="เปิดเมนู"
            className="md:hidden p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          >
            <MenuIcon className="size-5" style={{ color: 'var(--color-text)' }} />
          </button>
          <div className="flex-1" />
          <NotificationBell />
        </div>
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
