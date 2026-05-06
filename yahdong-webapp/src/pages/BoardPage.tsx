import { useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Settings2Icon } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import KanbanBoard from '../components/kanban/KanbanBoard'
import ProjectSettingsModal from '../components/ProjectSettingsModal'

export default function BoardPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { data: projects } = useProjects()
  const project = projects?.find((p) => p.id === id)
  const [showSettings, setShowSettings] = useState(false)

  const deepLinkTaskId = searchParams.get('task') ?? undefined
  const deepLinkCommentId = searchParams.get('comment') ?? undefined

  if (!id) return null

  const coverUrl = project?.coverImage

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Project cover image */}
      {coverUrl && (
        <div className="relative w-full h-24 shrink-0 overflow-hidden">
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        </div>
      )}

      {/* Breadcrumb header */}
      <div
        className="px-6 py-2.5 border-b flex items-center gap-1.5 shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <Link
          to="/projects"
          className="text-sm hover:underline"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          โปรเจค
        </Link>
        <ChevronRight
          className="w-3.5 h-3.5"
          style={{ color: 'var(--color-muted-foreground)' }}
        />
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {project && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: project.color }}
            />
          )}
          <span
            className="text-sm font-semibold truncate"
            style={{
              fontFamily: 'var(--font-family-heading)',
              color: 'var(--color-text)',
            }}
          >
            {project?.name ?? '...'}
          </span>
        </div>

        {project && (
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors shrink-0"
            title="ตั้งค่าโปรเจค"
          >
            <Settings2Icon
              className="size-4"
              style={{ color: 'var(--color-muted-foreground)' }}
            />
          </button>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <KanbanBoard projectId={id} deepLinkTaskId={deepLinkTaskId} deepLinkCommentId={deepLinkCommentId} />
      </div>

      {showSettings && project && (
        <ProjectSettingsModal
          project={project}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
