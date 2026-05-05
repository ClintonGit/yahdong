import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { StarIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Skeleton } from './ui/skeleton'
import { useAuthStore } from '../stores/authStore'
import { useProjects, useToggleStar } from '../hooks/useProjects'
import { authApi } from '../api/auth'
import CreateProjectModal from './CreateProjectModal'
import dongDefault from '../assets/dong/dong-sticker-01-เห็นอยู่นะ.png'
import dongEmpty from '../assets/dong/dong-sticker-05-ว่างอยู่.png'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const { data: projects, isLoading } = useProjects()
  const toggleStar = useToggleStar()
  const [showCreate, setShowCreate] = useState(false)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {}
    clearAuth()
    navigate('/login')
  }

  const starred = (projects ?? []).filter((p) => p.starred)
  const rest = (projects ?? []).filter((p) => !p.starred)

  const ProjectLink = ({ p }: { p: NonNullable<typeof projects>[number] }) => {
    const active = location.pathname === `/projects/${p.id}`
    return (
      <div className="group relative flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
        style={{
          background: active ? 'var(--color-primary)20' : 'transparent',
        }}
      >
        <Link
          to={`/projects/${p.id}`}
          className="flex items-center gap-2 flex-1 min-w-0 text-sm"
          style={{
            color: active ? 'var(--color-primary)' : 'var(--color-text)',
            fontWeight: active ? 600 : 400,
          }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: p.color }}
          />
          <span className="truncate">{p.name}</span>
        </Link>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); toggleStar.mutate(p.id) }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity shrink-0"
          title={p.starred ? 'เอาออกจาก Starred' : 'เพิ่มใน Starred'}
        >
          <StarIcon
            className="size-3.5 transition-colors"
            style={{
              fill: p.starred ? 'var(--color-primary)' : 'none',
              color: p.starred ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
            }}
          />
        </button>
      </div>
    )
  }

  return (
    <>
      <aside
        className="w-60 h-screen flex flex-col border-r shrink-0"
        style={{
          background: 'var(--color-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Logo */}
        <div
          className="px-4 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h1
            className="text-xl font-bold"
            style={{
              fontFamily: 'var(--font-family-heading)',
              color: 'var(--color-primary)',
            }}
          >
            อย่าดอง
          </h1>
          <p
            className="text-xs opacity-60"
            style={{ color: 'var(--color-text)' }}
          >
            yahdong
          </p>
        </div>

        {/* Projects list */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {isLoading ? (
            <>
              <p className="text-xs font-semibold px-2 pb-1 opacity-50 uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
                โปรเจค
              </p>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg mb-1" />
              ))}
            </>
          ) : (
            <>
              {/* Starred section */}
              {starred.length > 0 && (
                <>
                  <p className="text-xs font-semibold px-2 pb-1 opacity-50 uppercase tracking-wider flex items-center gap-1"
                    style={{ color: 'var(--color-text)' }}>
                    <StarIcon className="size-3" style={{ fill: 'var(--color-primary)', color: 'var(--color-primary)' }} />
                    Starred
                  </p>
                  {starred.map((p) => <ProjectLink key={p.id} p={p} />)}
                  <div className="h-px my-2" style={{ background: 'var(--color-border-forest)' }} />
                </>
              )}

              {/* All projects */}
              <p className="text-xs font-semibold px-2 pb-1 opacity-50 uppercase tracking-wider"
                style={{ color: 'var(--color-text)' }}>
                โปรเจค
              </p>
              {rest.map((p) => <ProjectLink key={p.id} p={p} />)}
            </>
          )}
        </nav>

        {/* New project button */}
        <div className="px-2 pb-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sm"
            style={{ color: 'var(--color-text)' }}
            onClick={() => setShowCreate(true)}
          >
            <span className="text-lg leading-none">+</span> โปรเจคใหม่
          </Button>
        </div>

        {/* ดอง mascot */}
        <div className="px-3 pb-2 flex items-end gap-2">
          <img
            src={projects && projects.length === 0 ? dongEmpty : dongDefault}
            alt="ดอง"
            className="w-16 h-16 object-contain shrink-0"
          />
          <div
            className="relative rounded-2xl rounded-bl-none px-3 py-1.5 text-xs leading-snug mb-1"
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              maxWidth: 120,
            }}
          >
            {projects && projects.length === 0 ? 'ว่างอยู่เลย' : 'ดองเห็นอยู่นะ'}
          </div>
        </div>

        {/* User menu */}
        <div
          className="px-2 pb-3 border-t pt-2"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 transition-colors border-0 bg-transparent cursor-pointer"
            >
              <Avatar className="w-7 h-7">
                <AvatarFallback
                  style={{
                    background: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '0.7rem',
                  }}
                >
                  {user?.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                className="text-sm truncate flex-1 text-left"
                style={{ color: 'var(--color-text)' }}
              >
                {user?.name}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              style={{ background: 'var(--color-card)' }}
            >
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-500 cursor-pointer"
              >
                ออกจากระบบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </>
  )
}
