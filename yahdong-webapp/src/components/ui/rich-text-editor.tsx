import { useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import {
  BoldIcon,
  ItalicIcon,
  Heading1Icon,
  Heading2Icon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  Undo2Icon,
  Redo2Icon,
  ImageIcon,
  MinusIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        active
          ? 'bg-[var(--color-primary)] text-white'
          : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-border-forest)]/40 hover:text-[var(--color-text)]',
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'รายละเอียดงาน...',
  className,
  minHeight = '180px',
}: RichTextEditorProps) {
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await api.post<{ url: string }>('/uploads', form)
      const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') as string
      return `${base}${res.data.url}`
    } catch {
      return null
    }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
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

  if (!editor) return null

  const handleImageClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const url = await uploadImage(file)
      if (url) editor.chain().focus().setImage({ src: url }).run()
    }
    input.click()
  }

  return (
    <div
      className={cn('rounded-xl border overflow-hidden', className)}
      style={{
        borderColor: 'var(--color-border-forest)',
        background: 'var(--color-card)',
      }}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b"
        style={{ borderColor: 'var(--color-border-forest)', background: 'var(--color-paper)' }}
      >
        <ToolbarButton
          title="หัวข้อใหญ่ (H1)"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1Icon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="หัวข้อรอง (H2)"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2Icon className="size-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 mx-1" style={{ background: 'var(--color-border-forest)' }} />

        <ToolbarButton
          title="ตัวหนา (Ctrl+B)"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="ตัวเอียง (Ctrl+I)"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon className="size-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 mx-1" style={{ background: 'var(--color-border-forest)' }} />

        <ToolbarButton
          title="รายการ (bullet)"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="รายการ (ordered)"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrderedIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="blockquote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <QuoteIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="เส้นคั่น"
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <MinusIcon className="size-3.5" />
        </ToolbarButton>

        <div className="w-px h-4 mx-1" style={{ background: 'var(--color-border-forest)' }} />

        <ToolbarButton
          title="แทรกรูปภาพ"
          active={false}
          onClick={handleImageClick}
        >
          <ImageIcon className="size-3.5" />
        </ToolbarButton>

        <div className="flex-1" />

        <ToolbarButton
          title="ย้อนกลับ (Ctrl+Z)"
          active={false}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2Icon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="ทำซ้ำ (Ctrl+Y)"
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2Icon className="size-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <div className="px-3 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
