import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { CopyIcon, CheckIcon, LinkIcon, GlobeIcon, XIcon, ImageIcon, Trash2Icon, ClockIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { Project, ProjectMember } from '../api/projects'
import { pendingInvitesApi } from '../api/projects'
import { useMembers } from '../hooks/useMembers'
import { useUpdateProject, useDeleteProject, useGenerateInviteLink, useToggleShare } from '../hooks/useProjects'
import api from '../lib/axios'

const PROJECT_COLORS = [
  '#E8A030', '#4A7C5E', '#C8956A', '#8B6343',
  '#7A9E7E', '#6366F1', '#EC4899', '#F97316',
  '#06B6D4', '#8B5CF6', '#10B981', '#EF4444',
]

interface Props {
  project: Project
  onClose: () => void
}

export default function ProjectSettingsModal({ project, onClose }: Props) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'general' | 'members'>('general')
  const [name, setName] = useState(project.name)
  const [color, setColor] = useState(project.color)
  const [coverImage, setCoverImage] = useState<string | null | undefined>(project.coverImage)
  const [inviteEmail, setInviteEmail] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const { data: members = [] } = useMembers(project.id)
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  const generateInviteLink = useGenerateInviteLink()
  const toggleShare = useToggleShare()

  const isDirty =
    name !== project.name ||
    color !== project.color ||
    coverImage !== project.coverImage

  const handleSave = async () => {
    if (!name.trim()) return
    await updateProject.mutateAsync({ id: project.id, name: name.trim(), color, coverImage: coverImage ?? null })
    onClose()
  }

  const handleCoverUpload = async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post<{ url: string }>('/uploads', form)
      setCoverImage(res.data.url)
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateLink = async () => {
    const data = await generateInviteLink.mutateAsync(project.id)
    const link = `${window.location.origin}/invite/${data.token}`
    await navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleToggleShare = async () => {
    await toggleShare.mutateAsync(project.id)
  }

  const handleCopyShareLink = async () => {
    if (!project.shareToken) return
    await navigator.clipboard.writeText(`${window.location.origin}/b/${project.shareToken}`)
    setCopiedShare(true)
    setTimeout(() => setCopiedShare(false), 2500)
  }

  const handleDelete = async () => {
    if (!window.confirm(`ลบโปรเจค "${project.name}" ? ไม่สามารถย้อนกลับได้`)) return
    await deleteProject.mutateAsync(project.id)
    onClose()
    navigate('/projects')
  }

  const qc = useQueryClient()
  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['invites', project.id],
    queryFn: () => pendingInvitesApi.list(project.id).then((r) => r.data),
    enabled: tab === 'members',
  })

  const cancelInvite = useMutation({
    mutationFn: (inviteId: string) => pendingInvitesApi.cancel(project.id, inviteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invites', project.id] }),
  })

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    try {
      await api.post(`/projects/${project.id}/members`, { email: inviteEmail.trim(), role: 'member' })
      setInviteEmail('')
      toast.success('ส่งคำเชิญแล้ว รอฝั่งนั้นตอบรับค่ะ')
      qc.invalidateQueries({ queryKey: ['invites', project.id] })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'เกิดข้อผิดพลาด'
      toast.error(msg)
    }
  }

  const isOwner = project.myRole === 'owner'

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        style={{ background: 'var(--color-paper)' }}
        className="w-full max-w-2xl sm:max-w-2xl max-h-[88vh] overflow-hidden flex flex-col p-0 gap-0"
      >
        <DialogHeader className="px-6 pt-5 pb-0 shrink-0">
          <DialogTitle style={{ color: 'var(--color-text)', fontFamily: 'var(--font-family-heading)' }}>
            ตั้งค่าโปรเจค
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-0 px-6 pt-3 shrink-0 border-b" style={{ borderColor: 'var(--color-border-forest)' }}>
          {(['general', 'members'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
              style={{
                borderColor: tab === t ? 'var(--color-primary)' : 'transparent',
                color: tab === t ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
              }}
            >
              {t === 'general' ? 'ทั่วไป' : 'สมาชิก'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* ── General tab ── */}
          {tab === 'general' && (
            <>
              {/* Cover image */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'var(--color-muted-foreground)' }}>
                  <ImageIcon className="size-3" /> ปกโปรเจค
                </p>
                <div
                  className="relative w-full h-28 rounded-xl overflow-hidden border flex items-center justify-center cursor-pointer"
                  style={{
                    background: coverImage ? undefined : color,
                    borderColor: 'var(--color-border)',
                  }}
                  onClick={() => fileRef.current?.click()}
                >
                  {coverImage ? (
                    <img src={coverImage} alt="cover" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white/70 text-xs">คลิกเพื่ออัพโหลดรูปปก</span>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs">กำลังอัพโหลด...</span>
                    </div>
                  )}
                  {coverImage && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCoverImage(null) }}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleCoverUpload(f)
                    e.target.value = ''
                  }}
                />
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-sm" style={{ color: 'var(--color-text)' }}>ชื่อโปรเจค</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isOwner}
                  style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label className="text-sm" style={{ color: 'var(--color-text)' }}>สีโปรเจค</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      disabled={!isOwner}
                      className="w-7 h-7 rounded-full border-2 transition-transform"
                      style={{
                        background: c,
                        borderColor: color === c ? 'var(--color-text)' : 'transparent',
                        transform: color === c ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {isOwner && (
                <Button
                  onClick={handleSave}
                  disabled={!isDirty || updateProject.isPending}
                  className="w-full"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                >
                  {updateProject.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              )}

              {/* Invite link */}
              {isOwner && (
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--color-border-forest)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: 'var(--color-muted-foreground)' }}>
                    <LinkIcon className="size-3" /> Invite Link (7 วัน)
                  </p>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sm"
                    onClick={handleGenerateLink}
                    disabled={generateInviteLink.isPending}
                    style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  >
                    {copiedLink
                      ? <><CheckIcon className="size-4 text-green-500" /> คัดลอกแล้ว!</>
                      : <><CopyIcon className="size-4" /> สร้างและคัดลอก Invite Link</>
                    }
                  </Button>
                </div>
              )}

              {/* Public share */}
              {isOwner && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: 'var(--color-muted-foreground)' }}>
                    <GlobeIcon className="size-3" /> Public Board
                  </p>
                  <div className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {project.isPublic ? 'Board เป็น Public อยู่' : 'Board เป็น Private'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {project.isPublic ? 'ทุกคนที่มีลิ้งดูได้' : 'เฉพาะสมาชิกเท่านั้น'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleToggleShare}
                      disabled={toggleShare.isPending}
                      style={{
                        background: project.isPublic ? 'var(--color-primary)20' : 'var(--color-border)',
                        color: project.isPublic ? 'var(--color-primary)' : 'var(--color-text)',
                      }}
                    >
                      {project.isPublic ? 'ปิด' : 'เปิด'}
                    </Button>
                    {project.isPublic && project.shareToken && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyShareLink}
                        style={{ color: 'var(--color-muted-foreground)' }}
                      >
                        {copiedShare ? <CheckIcon className="size-4 text-green-500" /> : <CopyIcon className="size-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Danger zone */}
              {isOwner && (
                <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border-forest)' }}>
                  <Button
                    variant="ghost"
                    onClick={handleDelete}
                    disabled={deleteProject.isPending}
                    className="w-full gap-2 text-red-500 hover:text-red-600 text-sm"
                  >
                    <Trash2Icon className="size-4" /> ลบโปรเจค
                  </Button>
                </div>
              )}
            </>
          )}

          {/* ── Members tab ── */}
          {tab === 'members' && (
            <>
              {isOwner && (
                <form onSubmit={handleInvite} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="อีเมลสมาชิกใหม่"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 h-9 text-sm"
                    style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!inviteEmail.trim()}
                    style={{ background: 'var(--color-primary)', color: 'white' }}
                  >
                    เพิ่ม
                  </Button>
                </form>
              )}

              <div className="space-y-1">
                {members.map((m: ProjectMember) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    isOwner={isOwner}
                    projectId={project.id}
                  />
                ))}
              </div>

              {/* Pending invites */}
              {isOwner && pendingInvites.length > 0 && (
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--color-border-forest)' }}>
                  <p className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider"
                    style={{ color: 'var(--color-muted-foreground)' }}>
                    <ClockIcon className="size-3" /> รอตอบรับ ({pendingInvites.length})
                  </p>
                  {pendingInvites.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                      style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-forest)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{ background: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
                        ?
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: 'var(--color-text)' }}>{inv.email}</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                          หมดอายุ {new Date(inv.expiresAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
                        {inv.role}
                      </span>
                      <button
                        type="button"
                        onClick={() => cancelInvite.mutate(inv.id)}
                        className="p-1 rounded hover:bg-red-500/10 transition-colors shrink-0"
                        title="ยกเลิกคำเชิญ"
                      >
                        <XIcon className="size-3.5 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MemberRow({
  member, isOwner, projectId,
}: {
  member: ProjectMember
  isOwner: boolean
  projectId: string
}) {
  const qc = useQueryClient()
  const handleRemove = async () => {
    if (!window.confirm(`ลบ ${member.name} ออกจากโปรเจค?`)) return
    try {
      await api.delete(`/projects/${projectId}/members/${member.id}`)
      qc.invalidateQueries({ queryKey: ['members', projectId] })
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'เกิดข้อผิดพลาด')
    }
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
      style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-forest)' }}>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={member.avatar ?? undefined} />
        <AvatarFallback style={{ background: 'var(--color-primary)', color: 'white', fontSize: '0.65rem' }}>
          {member.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{member.name}</p>
        <p className="text-xs truncate" style={{ color: 'var(--color-muted-foreground)' }}>{member.email}</p>
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
        style={{
          background: member.role === 'owner' ? 'var(--color-primary)20' : 'var(--color-border)',
          color: member.role === 'owner' ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
        }}>
        {member.role === 'owner' ? 'Owner' : member.role === 'viewer' ? 'Viewer' : 'Member'}
      </span>
      {isOwner && member.role !== 'owner' && (
        <button
          type="button"
          onClick={handleRemove}
          className="p-1 rounded hover:bg-red-500/10 transition-colors shrink-0"
          title="ลบออก"
        >
          <XIcon className="size-3.5 text-red-400" />
        </button>
      )}
    </div>
  )
}
