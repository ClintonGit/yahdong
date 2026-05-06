import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { publicBoardApi } from '../api/projects'

interface PublicTask {
  id: string
  title: string
  priority: string
  coverColor?: string | null
  coverImage?: string | null
}

interface PublicStatus {
  id: string
  name: string
  color: string
  tasks: PublicTask[]
}

interface PublicBoard {
  id: string
  name: string
  color: string
  coverImage?: string | null
  statuses: PublicStatus[]
}

export default function PublicBoardPage() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const [board, setBoard] = useState<PublicBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shareToken) return
    publicBoardApi
      .getBoard(shareToken)
      .then((r) => setBoard(r.data as PublicBoard))
      .catch(() => setError('ไม่พบบอร์ดนี้ หรือลิงก์หมดอายุแล้ว'))
      .finally(() => setLoading(false))
  }, [shareToken])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>กำลังโหลด...</p>
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center space-y-3">
          <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>ไม่พบบอร์ดนี้</p>
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{error}</p>
          <Link to="/login" className="text-sm underline" style={{ color: 'var(--color-primary)' }}>
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      {board.coverImage && (
        <div className="relative w-full h-28 shrink-0 overflow-hidden">
          <img src={board.coverImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
        </div>
      )}
      <div
        className="px-6 py-3 border-b flex items-center gap-2 shrink-0"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-paper)' }}
      >
        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: board.color }} />
        <span className="text-base font-semibold" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-family-heading)' }}>
          {board.name}
        </span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-border-forest)', color: 'var(--color-muted-foreground)' }}>
          ดูได้เท่านั้น
        </span>
      </div>

      {/* Board columns */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full items-start">
          {board.statuses.map((status) => (
            <div
              key={status.id}
              className="flex-shrink-0 w-64 rounded-xl overflow-hidden"
              style={{ background: 'var(--color-paper)', border: '1px solid var(--color-border-forest)' }}
            >
              {/* Column header */}
              <div className="px-3 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: 'var(--color-border-forest)' }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: status.color }} />
                <span className="text-sm font-semibold flex-1 truncate" style={{ color: 'var(--color-text)' }}>
                  {status.name}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {status.tasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="p-2 space-y-2 min-h-[2rem]">
                {status.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg overflow-hidden"
                    style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-forest)' }}
                  >
                    {task.coverColor && !task.coverImage && (
                      <div className="h-8 w-full" style={{ background: task.coverColor }} />
                    )}
                    <div className="px-3 py-2">
                      <p className="text-sm" style={{ color: 'var(--color-text)' }}>{task.title}</p>
                    </div>
                  </div>
                ))}
                {status.tasks.length === 0 && (
                  <p className="text-xs text-center py-2" style={{ color: 'var(--color-muted-foreground)' }}>ไม่มีงาน</p>
                )}
              </div>
            </div>
          ))}

          {board.statuses.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>ยังไม่มีคอลัมน์</p>
          )}
        </div>
      </div>
    </div>
  )
}
