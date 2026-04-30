import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { useProjects } from '../hooks/useProjects'
import CreateProjectModal from '../components/CreateProjectModal'

const ROLE_LABEL: Record<string, string> = {
  owner: 'เจ้าของ',
  member: 'สมาชิก',
  viewer: 'ดูอย่างเดียว',
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { data: projects, isLoading } = useProjects()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily: 'var(--font-family-heading)',
            color: 'var(--color-text)',
          }}
        >
          โปรเจคของฉัน
        </h1>
        <Button
          onClick={() => setShowCreate(true)}
          style={{ background: 'var(--color-primary)', color: 'white' }}
        >
          + โปรเจคใหม่
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p
            className="text-lg opacity-60"
            style={{ color: 'var(--color-text)' }}
          >
            ยังไม่มีโปรเจค
          </p>
          <Button
            onClick={() => setShowCreate(true)}
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            สร้างโปรเจคแรก
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              style={{
                background: 'var(--color-card)',
                borderColor: 'var(--color-border)',
              }}
              onClick={() => navigate(`/projects/${p.id}`)}
            >
              <div className="h-1.5" style={{ background: p.color }} />
              <CardHeader className="pb-2">
                <CardTitle
                  className="text-base"
                  style={{ color: 'var(--color-text)' }}
                >
                  {p.name}
                </CardTitle>
                {p.description && (
                  <p
                    className="text-xs opacity-60 line-clamp-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {p.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {ROLE_LABEL[p.myRole]}
                </Badge>
                <span
                  className="text-xs opacity-50"
                  style={{ color: 'var(--color-text)' }}
                >
                  {p._count?.members ?? 1} คน
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
    </div>
  )
}
