import { useRef, useState } from 'react'
import { useComments, useAddComment, useDeleteComment } from '../../hooks/useComments'
import { commentsApi } from '../../api/comments'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { getFileUrl } from '../../lib/utils'
import type { Comment } from '../../api/comments'

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

function CommentItem({
  comment,
  currentUserId,
  onDelete,
}: {
  comment: Comment
  currentUserId?: string
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const imgUrl = getFileUrl(comment.imageUrl)

  return (
    <div className="flex gap-2.5 group">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5"
        style={{ background: 'var(--color-primary)', color: 'white' }}
      >
        {comment.user.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {comment.user.name}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            {formatTime(comment.createdAt)}
          </span>
          {comment.userId === currentUserId && (
            <button
              onClick={onDelete}
              className="ml-auto text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              ลบ
            </button>
          )}
        </div>
        {comment.body && (
          <p className="text-sm mt-0.5 whitespace-pre-wrap break-words" style={{ color: 'var(--color-text)' }}>
            {comment.body}
          </p>
        )}
        {imgUrl && (
          <img
            src={imgUrl}
            alt="attachment"
            onClick={() => setExpanded(!expanded)}
            className="mt-1.5 rounded-lg border object-cover cursor-pointer hover:opacity-90 transition-opacity"
            style={{
              maxHeight: expanded ? 480 : 120,
              maxWidth: '100%',
              borderColor: 'var(--color-border)',
            }}
          />
        )}
      </div>
    </div>
  )
}

interface Props {
  taskId: string
}

export default function CommentSection({ taskId }: Props) {
  const { data: comments = [], isLoading } = useComments(taskId)
  const addComment = useAddComment(taskId)
  const deleteComment = useDeleteComment(taskId)
  const currentUser = useAuthStore((s) => s.user)

  const [body, setBody] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const clearImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() && !imageFile) return

    let imageUrl: string | undefined
    if (imageFile) {
      setUploading(true)
      try {
        const res = await commentsApi.upload(imageFile)
        imageUrl = res.url
      } finally {
        setUploading(false)
      }
    }

    await addComment.mutateAsync({ body: body.trim(), imageUrl })
    setBody('')
    clearImage()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const isPending = uploading || addComment.isPending

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
        <span className="text-xs px-1" style={{ color: 'var(--color-muted-foreground)' }}>
          {isLoading ? '...' : `${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
        </span>
        <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
      </div>

      {comments.length > 0 && (
        <div className="space-y-3 max-h-56 overflow-y-auto mb-3 pr-1">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={currentUser?.id}
              onDelete={() => deleteComment.mutate(c.id)}
            />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        {imagePreview && (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="preview"
              className="h-20 w-auto rounded-lg border object-cover"
              style={{ borderColor: 'var(--color-border)' }}
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center leading-none"
            >
              ×
            </button>
          </div>
        )}

        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="เขียน comment… (Enter ส่ง, Shift+Enter ขึ้นบรรทัด)"
          rows={2}
          className="text-sm resize-none"
          style={{
            background: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors text-base"
            style={{ color: 'var(--color-muted-foreground)' }}
            title="แนบรูป"
          >
            📎
          </button>
          <Input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImagePick}
          />
          <Button
            type="submit"
            size="sm"
            disabled={(!body.trim() && !imageFile) || isPending}
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            {isPending ? 'กำลังส่ง…' : 'ส่ง'}
          </Button>
        </div>
      </form>
    </div>
  )
}
