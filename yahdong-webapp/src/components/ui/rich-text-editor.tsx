import { useCallback, useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'
import { EditorToolbar } from './editor-toolbar'
import { SlashCommand } from './slash-command'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'รายละเอียดงาน... พิมพ์ "/" เพื่อเรียกเมนู',
  className,
  minHeight = '180px',
}: RichTextEditorProps) {
  const [uploadingCount, setUploadingCount] = useState(0)
  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false)

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    setUploadingCount((c) => c + 1)
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
      setUploadingCount((c) => Math.max(0, c - 1))
    }
  }, [])

  const handleImagePick = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const url = await uploadImage(file)
      // editor reference set after useEditor; we use a dispatched custom event to keep this stable
      window.dispatchEvent(new CustomEvent('rich-editor:insert-image', { detail: { url } }))
    }
    input.click()
  }, [uploadImage])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // StarterKit v3 includes link + underline by default; tweak link options
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
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
      TaskList.configure({
        HTMLAttributes: { class: 'task-list space-y-1 list-none pl-0' },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: 'task-item flex items-start gap-2' },
      }),
      SlashCommand.configure({
        onImageInsert: () => handleImagePick(),
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none w-full max-w-none',
        style: `min-height: ${minHeight}; color: var(--color-text); font-family: var(--font-family-body, inherit);`,
      },
      handleKeyDown(_view, event) {
        // Ctrl/Cmd+K → open link popover via toolbar event
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault()
          window.dispatchEvent(new CustomEvent('rich-editor:open-link'))
          return true
        }
        return false
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
          const transaction = view.state.tr.insert(coordinates?.pos ?? view.state.doc.content.size, node)
          view.dispatch(transaction)
        })
        return true
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
    },
  })

  // sync external value back when not focused (for prop-driven updates)
  useEffect(() => {
    if (!editor) return
    if (editor.isFocused) return
    const current = editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  // listen for slash-command/toolbar image-pick result
  useEffect(() => {
    if (!editor) return
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ url: string | null }>).detail
      if (detail?.url) {
        editor.chain().focus().setImage({ src: detail.url }).run()
      }
    }
    window.addEventListener('rich-editor:insert-image', handler)
    return () => window.removeEventListener('rich-editor:insert-image', handler)
  }, [editor])

  if (!editor) return null

  // Lightweight HTML→markdown-ish preview (visual only, not authoritative)
  const renderMarkdownPreview = () => {
    const html = editor.getHTML()
    return html
  }

  return (
    <div
      className={cn('rounded-xl border overflow-hidden relative', className)}
      style={{
        borderColor: 'var(--color-border-forest)',
        background: 'var(--color-card)',
      }}
    >
      <EditorToolbar
        editor={editor}
        onImageInsert={handleImagePick}
        isMarkdownPreview={isMarkdownPreview}
        onToggleMarkdown={() => setIsMarkdownPreview((v) => !v)}
      />

      {/* Editor area */}
      <div className="px-3 py-2 relative">
        {isMarkdownPreview ? (
          <div
            className="prose prose-sm max-w-none"
            style={{ minHeight, color: 'var(--color-text)' }}
            dangerouslySetInnerHTML={{ __html: renderMarkdownPreview() }}
          />
        ) : (
          <EditorContent editor={editor} />
        )}

        {uploadingCount > 0 && (
          <div
            className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs shadow"
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border-forest)',
              color: 'var(--color-muted-foreground)',
            }}
          >
            <Loader2Icon className="size-3.5 animate-spin" />
            <span>กำลังอัปโหลด {uploadingCount > 1 ? `${uploadingCount} รูป` : ''}</span>
          </div>
        )}
      </div>
    </div>
  )
}
