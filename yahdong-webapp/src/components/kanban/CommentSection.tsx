import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useComments, useAddComment, useDeleteComment } from '../../hooks/useComments'
import { useBoard } from '../../hooks/useBoard'
import { commentsApi } from '../../api/comments'
import { useAuthStore } from '../../stores/authStore'
import { useMembers } from '../../hooks/useMembers'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { CommentEditor, type CommentEditorRef } from '../ui/comment-editor'
import { fetchUnfurl, extractFirstUrl, type UnfurlData } from '../../lib/unfurl'
import { getFileUrl } from '../../lib/utils'
import type { Comment } from '../../api/comments'

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

/** Click-to-expand image used inside markdown render. */
function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  const [expanded, setExpanded] = useState(false)
  if (!src) return null
  const resolved = src.startsWith('http') || src.startsWith('data:') ? src : (getFileUrl(src) ?? src)
  return (
    <img
      src={resolved}
      alt={alt ?? 'image'}
      loading="lazy"
      onClick={() => setExpanded((v) => !v)}
      className="mt-1.5 rounded-lg border object-cover cursor-pointer hover:opacity-90 transition-opacity"
      style={{
        maxHeight: expanded ? 480 : 160,
        maxWidth: '100%',
        borderColor: 'var(--color-border)',
      }}
    />
  )
}

/** Renders a comment body that may be either TipTap HTML or legacy markdown. */
function CommentBody({
  body,
  onMentionTaskClick,
}: {
  body: string
  onMentionTaskClick: (taskId: string) => void
}) {
  const isHtml = /^\s*</.test(body)

  // Click handler — delegated to the wrapper div so we don't rebind per node.
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const span = target.closest<HTMLElement>('span[data-type="mention"]')
    if (!span) return
    const id = span.getAttribute('data-id')
    if (!id) return
    const char = span.getAttribute('data-mention-suggestion-char')
    if (char === '#') {
      // Task mention → open the task in this project.
      e.preventDefault()
      onMentionTaskClick(id)
    }
    // For user mentions (`@`), do nothing for now (future: open profile).
  }

  if (isHtml) {
    return (
      <div
        className={[
          'text-sm mt-1 break-words comment-md comment-html',
          // Style mention spans (class attr is stripped by sanitize, so target by data-type).
          '[&_span[data-type=mention]]:inline-flex',
          '[&_span[data-type=mention]]:items-center',
          '[&_span[data-type=mention]]:px-1',
          '[&_span[data-type=mention]]:rounded',
          '[&_span[data-type=mention]]:font-medium',
          '[&_span[data-type=mention]]:cursor-pointer',
          '[&_span[data-type=mention]]:text-[var(--color-primary)]',
          '[&_span[data-type=mention]]:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]',
          // Anchor styling.
          '[&_a]:text-[var(--color-primary)]',
          '[&_a]:underline',
          '[&_a]:hover:opacity-80',
          // Inline image styling.
          '[&_img]:mt-1.5',
          '[&_img]:rounded-lg',
          '[&_img]:border',
          '[&_img]:max-h-40',
          '[&_img]:max-w-full',
          // Paragraph spacing.
          '[&_p]:m-0',
          '[&_p]:whitespace-pre-wrap',
        ].join(' ')}
        style={{ color: 'var(--color-text)' }}
        onClick={handleClick}
        // Backend sanitizes via DOMPurify before persisting, so this is safe.
        dangerouslySetInnerHTML={{ __html: body }}
      />
    )
  }

  // Legacy markdown — preserved for older comments.
  return (
    <div
      className="text-sm mt-1 break-words comment-md"
      style={{ color: 'var(--color-text)' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt }) => (
            <MarkdownImage src={typeof src === 'string' ? src : undefined} alt={alt} />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code
              style={{
                background: 'var(--color-muted, rgba(0,0,0,0.06))',
                padding: '1px 4px',
                borderRadius: 4,
                fontSize: '0.85em',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              {children}
            </code>
          ),
          p: ({ children }) => (
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul style={{ margin: '4px 0', paddingLeft: 18, listStyle: 'disc' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: '4px 0', paddingLeft: 18, listStyle: 'decimal' }}>
              {children}
            </ol>
          ),
          li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote
              style={{
                borderLeft: '3px solid var(--color-border)',
                paddingLeft: 8,
                margin: '4px 0',
                color: 'var(--color-muted-foreground)',
              }}
            >
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: 600 }}>{children}</strong>
          ),
          em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}

/** Small unfurl card rendered below a comment body when its first URL has metadata. */
function UnfurlCard({ url }: { url: string }) {
  const q = useQuery<UnfurlData>({
    queryKey: ['unfurl', url],
    queryFn: () => fetchUnfurl(url),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })

  if (q.isLoading || q.isError || !q.data) return null
  const { title, description, image, favicon, siteName } = q.data
  if (!title && !description && !image) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex gap-3 p-2 rounded-lg border hover:bg-black/5 transition-colors"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-card)',
        textDecoration: 'none',
        color: 'var(--color-text)',
      }}
    >
      {image && (
        <img
          src={image}
          alt=""
          className="w-16 h-16 rounded-md object-cover shrink-0"
          loading="lazy"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          {favicon && <img src={favicon} alt="" className="w-3.5 h-3.5 rounded-sm" loading="lazy" />}
          <span className="truncate">{siteName ?? new URL(url).hostname}</span>
        </div>
        {title && (
          <div className="text-sm font-medium mt-0.5 line-clamp-1">{title}</div>
        )}
        {description && (
          <div
            className="text-xs mt-0.5 line-clamp-2"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            {description}
          </div>
        )}
      </div>
    </a>
  )
}

function CommentItem({
  comment,
  currentUserId,
  onDelete,
  onCopyLink,
  onMentionTaskClick,
}: {
  comment: Comment
  currentUserId?: string
  onDelete: () => void
  onCopyLink: () => void
  onMentionTaskClick: (taskId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const imgUrl = getFileUrl(comment.imageUrl)
  const firstUrl = useMemo(() => extractFirstUrl(comment.body), [comment.body])

  return (
    <div className="flex gap-3 group py-1">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5"
        style={{ background: 'var(--color-primary)', color: 'white' }}
      >
        {comment.user.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            {comment.user.name}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            {formatTime(comment.createdAt)}
          </span>
          <button
            type="button"
            onClick={onCopyLink}
            className="ml-auto p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/5"
            style={{ color: 'var(--color-muted-foreground)' }}
            title="คัดลอกลิงก์ comment"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          {comment.userId === currentUserId && (
            <button
              onClick={onDelete}
              className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              ลบ
            </button>
          )}
        </div>
        {comment.body && (
          <CommentBody
            body={comment.body}
            onMentionTaskClick={onMentionTaskClick}
          />
        )}
        {firstUrl && <UnfurlCard url={firstUrl} />}
        {imgUrl && (
          <img
            src={imgUrl}
            alt="attachment"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 rounded-lg border object-cover cursor-pointer hover:opacity-90 transition-opacity"
            style={{
              maxHeight: expanded ? 480 : 140,
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
  projectId: string
  highlightCommentId?: string
}

const COLLAPSE_THRESHOLD = 5
const VISIBLE_WHEN_COLLAPSED = 3
const EMPTY_HTML_REGEX = /^\s*(<p>(\s|<br\s*\/?>)*<\/p>\s*)*$/i

/** Returns true if the rich-text HTML has no real content (just empty <p> tags). */
function isEmptyHtml(html: string): boolean {
  if (!html) return true
  if (EMPTY_HTML_REGEX.test(html)) return true
  // Strip tags and check for any non-whitespace text or <img>.
  const hasImage = /<img\b/i.test(html)
  const text = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  return !hasImage && text.length === 0
}

export default function CommentSection({ taskId, projectId, highlightCommentId }: Props) {
  const { data: comments = [], isLoading } = useComments(taskId)
  const addComment = useAddComment(taskId)
  const deleteComment = useDeleteComment(taskId)
  const currentUser = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const params = useParams<{ projectId?: string }>()

  const { data: members = [] } = useMembers(projectId)
  const { columns } = useBoard(projectId)

  // Flatten board tasks for the # mention picker. Excludes the current task
  // so users don't link a task to itself.
  const tasksForMention = useMemo(() => {
    const all = columns.flatMap((c) =>
      c.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        hint: c.name,
      })),
    )
    return all.filter((t) => t.id !== taskId)
  }, [columns, taskId])

  const listRef = useRef<HTMLDivElement>(null)
  const flashedRef = useRef(false)

  // Smart auto-collapse: ถ้า comment เยอะ → แสดงแค่ล่าสุด N ตัว
  const [showAllOlder, setShowAllOlder] = useState(false)
  const shouldCollapse = comments.length > COLLAPSE_THRESHOLD && !showAllOlder
  const hiddenCount = shouldCollapse
    ? Math.max(0, comments.length - VISIBLE_WHEN_COLLAPSED)
    : 0
  const visibleComments = shouldCollapse
    ? comments.slice(-VISIBLE_WHEN_COLLAPSED)
    : comments

  // ถ้า highlightCommentId ตรงกับ comment ที่ถูก collapse → auto-expand
  useEffect(() => {
    if (!highlightCommentId || comments.length === 0) return
    const isVisible = comments.slice(-VISIBLE_WHEN_COLLAPSED).some(
      (c) => c.id === highlightCommentId,
    )
    const existsInHidden =
      comments.length > COLLAPSE_THRESHOLD &&
      comments.slice(0, -VISIBLE_WHEN_COLLAPSED).some(
        (c) => c.id === highlightCommentId,
      )
    if (existsInHidden && !isVisible) {
      setShowAllOlder(true)
    }
  }, [highlightCommentId, comments])

  // Editor state — `body` holds TipTap HTML; image still uploads via legacy form path.
  const [body, setBody] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pasteUploading, setPasteUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<CommentEditorRef>(null)

  const excludeUserIds = useMemo(
    () => (currentUser?.id ? [currentUser.id] : []),
    [currentUser?.id],
  )

  useEffect(() => {
    if (!highlightCommentId || comments.length === 0 || flashedRef.current) return
    const el = document.getElementById(`comment-${highlightCommentId}`)
    if (!el || !listRef.current) return
    flashedRef.current = true
    setTimeout(() => {
      const container = listRef.current!
      const top = el.offsetTop - container.offsetTop - 8
      container.scrollTo({ top, behavior: 'smooth' })
      setTimeout(() => {
        el.classList.add('comment-flash')
        el.addEventListener('animationend', () => el.classList.remove('comment-flash'), { once: true })
      }, 350)
    }, 300)
  }, [highlightCommentId, comments])

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

  const submitComment = async (rawHtml: string) => {
    const html = rawHtml.trim()
    const empty = isEmptyHtml(html)
    if (empty && !imageFile) return

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

    // Pass empty string (not whitespace HTML) when there's no real content
    // so the backend's `isHtml` heuristic never gets tripped on an empty body.
    const bodyToSend = empty ? '' : html
    await addComment.mutateAsync({ body: bodyToSend, imageUrl })
    setBody('')
    editorRef.current?.clear()
    clearImage()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitComment(editorRef.current?.getHTML() ?? body)
  }

  const handleCopyCommentLink = async (commentId: string) => {
    const url = `${window.location.origin}/projects/${projectId}?task=${taskId}&comment=${commentId}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('คัดลอกลิงก์ comment แล้ว')
    } catch {
      toast.error('คัดลอกไม่สำเร็จ')
    }
  }

  const handleMentionTaskClick = (mentionedTaskId: string) => {
    // If we're already on this project's page, just swap the task query param.
    const targetProject = params.projectId ?? projectId
    navigate(`/projects/${targetProject}?task=${mentionedTaskId}`)
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
        <div ref={listRef} className="max-h-72 overflow-y-auto mb-3 pr-1">
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllOlder(true)}
              className="w-full mb-3 py-1.5 text-xs rounded-lg border border-dashed transition-colors hover:bg-black/5"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-muted-foreground)',
              }}
            >
              แสดงเพิ่ม {hiddenCount} comment เก่า
            </button>
          )}
          {visibleComments.map((c, idx) => (
            <div
              key={c.id}
              id={`comment-${c.id}`}
              className={
                idx < visibleComments.length - 1
                  ? 'pb-4 mb-4 border-b'
                  : 'pb-1'
              }
              style={
                idx < visibleComments.length - 1
                  ? { borderColor: 'var(--color-border)' }
                  : undefined
              }
            >
              <CommentItem
                comment={c}
                currentUserId={currentUser?.id}
                onDelete={() => deleteComment.mutate(c.id)}
                onCopyLink={() => handleCopyCommentLink(c.id)}
                onMentionTaskClick={handleMentionTaskClick}
              />
            </div>
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

        <div className="relative">
          <CommentEditor
            ref={editorRef}
            value={body}
            onChange={setBody}
            onSubmit={(html) => void submitComment(html)}
            onUploadingChange={setPasteUploading}
            members={members}
            tasks={tasksForMention}
            excludeUserIds={excludeUserIds}
          />
          {pasteUploading && (
            <div
              className="absolute right-2 bottom-2 text-xs px-2 py-0.5 rounded-md"
              style={{
                background: 'var(--color-card)',
                color: 'var(--color-muted-foreground)',
                border: '1px solid var(--color-border)',
              }}
            >
              กำลังอัปโหลดรูป…
            </div>
          )}
        </div>

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
            disabled={(isEmptyHtml(body) && !imageFile) || isPending}
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            {isPending ? 'กำลังส่ง…' : 'ส่ง'}
          </Button>
        </div>
      </form>
    </div>
  )
}
