/**
 * CommentEditor — TipTap mini editor used inside CommentSection.
 *
 * Subset of `rich-text-editor.tsx`:
 *  - paragraph / bold / italic / link / hardBreak via StarterKit
 *  - Mention with two triggers: `@` (users) and `#` (tasks)
 *  - paste/drop image (uploads via /uploads endpoint)
 *  - Enter submits, Shift+Enter inserts a newline
 */
import { useCallback, useEffect, useImperativeHandle, useMemo, forwardRef, useRef } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Mention } from '@tiptap/extension-mention'
import { PluginKey } from '@tiptap/pm/state'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { cn } from '@/lib/utils'
import { makeMentionRenderer, type MentionItem } from './mention-menu'

export interface CommentEditorMember {
  id: string
  name: string
  email?: string
  avatar?: string | null
}

export interface CommentEditorTask {
  id: string
  title: string
  /** Optional sub-text — e.g. status name. */
  hint?: string
}

export interface CommentEditorRef {
  /** Imperatively focus the editor. */
  focus: () => void
  /** Clear the editor content. */
  clear: () => void
  /** Get current HTML content (matches `value` prop). */
  getHTML: () => string
}

interface CommentEditorProps {
  value: string
  onChange: (html: string) => void
  /**
   * Called when the user presses Enter (no shift). Receives the latest HTML.
   * Caller is responsible for clearing the editor afterwards.
   */
  onSubmit?: (html: string) => void
  /** Called while a paste-image upload is in flight. */
  onUploadingChange?: (uploading: boolean) => void
  members: CommentEditorMember[]
  tasks: CommentEditorTask[]
  /** User IDs to exclude from the @-mention list (e.g. current user). */
  excludeUserIds?: string[]
  placeholder?: string
  className?: string
  minHeight?: string
}

// Stable plugin keys per trigger — must NOT be recreated each render
// (the Mention extension only reads them when configured).
const userMentionKey = new PluginKey('mentionUser')
const taskMentionKey = new PluginKey('mentionTask')

export const CommentEditor = forwardRef<CommentEditorRef, CommentEditorProps>(function CommentEditor(
  {
    value,
    onChange,
    onSubmit,
    onUploadingChange,
    members,
    tasks,
    excludeUserIds,
    placeholder = 'เขียน comment… (Enter ส่ง, Shift+Enter ขึ้นบรรทัด, @ แท็กเพื่อน, # แท็กงาน)',
    className,
    minHeight = '52px',
  },
  ref,
) {
  // We use refs-via-closures rather than re-creating the editor each time
  // these change. Latest data is read via getters captured below.
  const membersRef = useLatest(members)
  const tasksRef = useLatest(tasks)
  const excludeRef = useLatest(excludeUserIds ?? [])
  const onSubmitRef = useLatest(onSubmit)
  const onUploadingChangeRef = useLatest(onUploadingChange)

  const uploadImage = useCallback(
    async (file: File): Promise<string | null> => {
      onUploadingChangeRef.current?.(true)
      const form = new FormData()
      form.append('file', file)
      try {
        const res = await api.post<{ url: string }>('/uploads', form)
        const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') as string
        return `${base}${res.data.url}`
      } catch {
        toast.error('อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้งค่ะ')
        return null
      } finally {
        onUploadingChangeRef.current?.(false)
      }
    },
    [onUploadingChangeRef],
  )

  // Build extensions once — internal callbacks read from refs.
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: {
            class: 'underline text-[var(--color-primary)] hover:opacity-80',
            rel: 'noopener noreferrer nofollow',
            target: '_blank',
          },
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
      Mention.configure({
        HTMLAttributes: {
          class:
            'inline-flex items-center px-1 rounded text-[var(--color-primary)] bg-[var(--color-primary)]/10 font-medium cursor-pointer',
        },
        suggestions: [
          {
            char: '@',
            pluginKey: userMentionKey,
            items: ({ query }) => {
              const q = query.toLowerCase().trim()
              const exclude = new Set(excludeRef.current)
              return membersRef.current
                .filter((m) => !exclude.has(m.id))
                .filter((m) => m.name.toLowerCase().includes(q))
                .slice(0, 8)
                .map<MentionItem>((m) => ({
                  id: m.id,
                  label: m.name,
                  hint: m.email,
                  avatar: m.avatar ?? null,
                }))
            },
            render: makeMentionRenderer('user'),
          },
          {
            char: '#',
            pluginKey: taskMentionKey,
            items: ({ query }) => {
              const q = query.toLowerCase().trim()
              return tasksRef.current
                .filter((t) => t.title.toLowerCase().includes(q))
                .slice(0, 8)
                .map<MentionItem>((t) => ({
                  id: t.id,
                  label: t.title,
                  hint: t.hint,
                }))
            },
            render: makeMentionRenderer('task'),
          },
        ],
      }),
    ],
    // membersRef/tasksRef/excludeRef/etc are stable refs — placeholder is the
    // only primitive we depend on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [placeholder],
  )

  const editor = useEditor({
    extensions,
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none w-full text-sm leading-relaxed',
        style: `min-height: ${minHeight}; color: var(--color-text);`,
      },
      handleKeyDown(_view, event) {
        // Enter (no shift) → submit. We let the Mention/Suggestion plugins
        // intercept Enter first (their plugin priority is higher) — when
        // a suggestion popup is open they return true and this handler
        // is never called.
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          const html = editor?.getHTML() ?? ''
          onSubmitRef.current?.(html)
          return true
        }
        return false
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items
        if (!items) return false
        const imageItems = Array.from(items).filter((i) => i.type.startsWith('image/'))
        if (imageItems.length === 0) return false
        event.preventDefault()
        imageItems.forEach(async (item) => {
          const file = item.getAsFile()
          if (!file) return
          const url = await uploadImage(file)
          if (!url) return
          const { schema } = view.state
          const node = schema.nodes.image.create({ src: url })
          const tr = view.state.tr.replaceSelectionWith(node)
          view.dispatch(tr)
        })
        return true
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
        if (imageFiles.length === 0) return false
        event.preventDefault()
        const { schema } = view.state
        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
        imageFiles.forEach(async (file) => {
          const url = await uploadImage(file)
          if (!url) return
          const node = schema.nodes.image.create({ src: url })
          const transaction = view.state.tr.insert(
            coordinates?.pos ?? view.state.doc.content.size,
            node,
          )
          view.dispatch(transaction)
        })
        return true
      },
    },
  })

  // Keep external `value` in sync when the editor isn't focused.
  useEffect(() => {
    if (!editor) return
    if (editor.isFocused) return
    const current = editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  useImperativeHandle(
    ref,
    () => ({
      focus: () => editor?.commands.focus(),
      clear: () => {
        editor?.commands.clearContent(false)
        // Force-sync upstream value (clearContent doesn't always emit).
        onChange('')
      },
      getHTML: () => editor?.getHTML() ?? '',
    }),
    [editor, onChange],
  )

  if (!editor) return null

  return (
    <div
      className={cn('rounded-xl border px-3 py-2', className)}
      style={{
        background: 'var(--color-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <EditorContent editor={editor as Editor} />
    </div>
  )
})

// ─────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────

function useLatest<T>(value: T) {
  const ref = useRef<T>(value)
  ref.current = value
  return ref
}
