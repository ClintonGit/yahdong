import { useParams, Link } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import KanbanBoard from '../components/kanban/KanbanBoard'
import { ChevronRight } from 'lucide-react'

export default function BoardPage() {
  const { id } = useParams<{ id: string }>()
  const { data: projects } = useProjects()
  const project = projects?.find((p) => p.id === id)

  if (!id) return null

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
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
        <div className="flex items-center gap-1.5">
          {project && (
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: project.color }}
            />
          )}
          <span
            className="text-sm font-semibold"
            style={{
              fontFamily: 'var(--font-family-heading)',
              color: 'var(--color-text)',
            }}
          >
            {project?.name ?? '...'}
          </span>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <KanbanBoard projectId={id} />
      </div>
    </div>
  )
}
