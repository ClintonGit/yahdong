import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex items-center justify-end px-4 py-1.5 shrink-0 border-b"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-paper)' }}
        >
          <NotificationBell />
        </div>
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
