/**
 * EditorToolbar — Trello-style toolbar with dropdown groups.
 *
 * Layout: [ Tt heading ▾ ] [ B I S U ] [ list ▾ ] [ link ] [ image ] [ + insert ▾ ]   [ undo redo ] [ md ]
 */
import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/core'
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
  CodeIcon,
  TypeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  ListChecksIcon,
  QuoteIcon,
  Link2Icon,
  ImageIcon,
  PlusIcon,
  Undo2Icon,
  Redo2Icon,
  MinusIcon,
  PilcrowIcon,
  CodeXmlIcon,
  EyeIcon,
  PencilIcon,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './dropdown-menu'
import { Popover, PopoverTrigger, PopoverContent } from './popover'
import { cn } from '@/lib/utils'

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
  className?: string
}

export function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
  className,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault()
        if (!disabled) onClick()
      }}
      className={cn(
        'flex items-center justify-center px-1.5 h-7 rounded-md transition-colors text-sm',
        active
          ? 'bg-[var(--color-primary)] text-white'
          : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-border-forest)]/40 hover:text-[var(--color-text)]',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className,
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return (
    <div
      className="w-px h-4 mx-1 shrink-0"
      style={{ background: 'var(--color-border-forest)' }}
    />
  )
}

interface EditorToolbarProps {
  editor: Editor
  onImageInsert: () => void
  isMarkdownPreview: boolean
  onToggleMarkdown: () => void
}

export function EditorToolbar({
  editor,
  onImageInsert,
  isMarkdownPreview,
  onToggleMarkdown,
}: EditorToolbarProps) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  // tick state to force re-render on editor selection/transaction changes
  const [, setTick] = useState(0)

  useEffect(() => {
    const update = () => setTick((t) => t + 1)
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  // Determine current heading label for Tt dropdown
  const currentHeading = (() => {
    if (editor.isActive('heading', { level: 1 })) return 'H1'
    if (editor.isActive('heading', { level: 2 })) return 'H2'
    if (editor.isActive('heading', { level: 3 })) return 'H3'
    return 'Tt'
  })()

  const openLinkPopover = () => {
    const prev = (editor.getAttributes('link') as { href?: string }).href ?? ''
    setLinkUrl(prev)
    setLinkOpen(true)
  }

  // Cmd/Ctrl+K from editor → open link popover
  useEffect(() => {
    const handler = () => openLinkPopover()
    window.addEventListener('rich-editor:open-link', handler)
    return () => window.removeEventListener('rich-editor:open-link', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  const applyLink = () => {
    const url = linkUrl.trim()
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    setLinkOpen(false)
    setLinkUrl('')
  }

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setLinkOpen(false)
    setLinkUrl('')
  }

  // disable everything but undo/redo + md toggle when in markdown preview
  const editingDisabled = isMarkdownPreview

  return (
    <div
      className="flex items-center gap-0.5 px-2 py-1.5 border-b overflow-x-auto"
      style={{ borderColor: 'var(--color-border-forest)', background: 'var(--color-paper)' }}
    >
      {/* Tt — heading dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={editingDisabled}
          className={cn(
            'flex items-center gap-1 px-2 h-7 rounded-md text-sm transition-colors',
            editor.isActive('heading')
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-border-forest)]/40 hover:text-[var(--color-text)]',
            editingDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
          )}
          title="หัวข้อ / ย่อหน้า"
        >
          <TypeIcon className="size-3.5" />
          <span className="text-xs font-medium">{currentHeading}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            <PilcrowIcon className="size-3.5" />
            <span>ย่อหน้า</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1Icon className="size-3.5" />
            <span>Heading 1</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2Icon className="size-3.5" />
            <span>Heading 2</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3Icon className="size-3.5" />
            <span>Heading 3</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Divider />

      {/* B I + more (S, U, code) */}
      <ToolbarButton
        title="ตัวหนา (Ctrl+B)"
        active={editor.isActive('bold')}
        disabled={editingDisabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="ตัวเอียง (Ctrl+I)"
        active={editor.isActive('italic')}
        disabled={editingDisabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="size-3.5" />
      </ToolbarButton>

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={editingDisabled}
          className={cn(
            'flex items-center justify-center px-1.5 h-7 rounded-md transition-colors text-[var(--color-muted-foreground)] hover:bg-[var(--color-border-forest)]/40 hover:text-[var(--color-text)]',
            editingDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
          )}
          title="รูปแบบเพิ่มเติม"
        >
          <span className="text-base leading-none -mt-1">…</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleStrike().run()}>
            <StrikethroughIcon className="size-3.5" />
            <span>ขีดทับ</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="size-3.5" />
            <span>ขีดเส้นใต้</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleCode().run()}>
            <CodeIcon className="size-3.5" />
            <span>โค้ดบรรทัด</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Divider />

      {/* List dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={editingDisabled}
          className={cn(
            'flex items-center gap-1 px-1.5 h-7 rounded-md text-sm transition-colors',
            editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList') || editor.isActive('blockquote')
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-border-forest)]/40 hover:text-[var(--color-text)]',
            editingDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
          )}
          title="รายการ / blockquote"
        >
          <ListIcon className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <ListIcon className="size-3.5" />
            <span>Bullet list</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrderedIcon className="size-3.5" />
            <span>Numbered list</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleTaskList().run()}>
            <ListChecksIcon className="size-3.5" />
            <span>Checklist</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <QuoteIcon className="size-3.5" />
            <span>Quote</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Divider />

      {/* Link */}
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger
          disabled={editingDisabled}
          onClick={(e) => {
            e.preventDefault()
            openLinkPopover()
          }}
          className={cn(
            'flex items-center justify-center px-1.5 h-7 rounded-md transition-colors',
            editor.isActive('link')
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-border-forest)]/40 hover:text-[var(--color-text)]',
            editingDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
          )}
          title="ลิงก์ (Ctrl+K)"
        >
          <Link2Icon className="size-3.5" />
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <div className="space-y-2">
            <label className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
              URL
            </label>
            <input
              type="url"
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyLink()
                }
                if (e.key === 'Escape') setLinkOpen(false)
              }}
              placeholder="https://example.com"
              className="w-full px-2 py-1.5 rounded-md text-sm outline-none border"
              style={{
                background: 'var(--color-paper)',
                borderColor: 'var(--color-border-forest)',
                color: 'var(--color-text)',
              }}
            />
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={applyLink}
                className="flex-1 px-2 py-1 rounded-md text-xs font-medium text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                บันทึก
              </button>
              {editor.isActive('link') && (
                <button
                  type="button"
                  onClick={removeLink}
                  className="px-2 py-1 rounded-md text-xs font-medium border"
                  style={{
                    borderColor: 'var(--color-border-forest)',
                    color: 'var(--color-muted-foreground)',
                  }}
                >
                  ลบลิงก์
                </button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Image */}
      <ToolbarButton
        title="แทรกรูปภาพ"
        disabled={editingDisabled}
        onClick={onImageInsert}
      >
        <ImageIcon className="size-3.5" />
      </ToolbarButton>

      <Divider />

      {/* + insert dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={editingDisabled}
          className={cn(
            'flex items-center justify-center px-1.5 h-7 rounded-md transition-colors text-[var(--color-muted-foreground)] hover:bg-[var(--color-border-forest)]/40 hover:text-[var(--color-text)]',
            editingDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
          )}
          title="แทรกเนื้อหา"
        >
          <PlusIcon className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <CodeXmlIcon className="size-3.5" />
            <span>Code block</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <QuoteIcon className="size-3.5" />
            <span>Quote</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <MinusIcon className="size-3.5" />
            <span>Divider</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onImageInsert}>
            <ImageIcon className="size-3.5" />
            <span>Image</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      {/* Undo / Redo */}
      <ToolbarButton
        title="ย้อนกลับ (Ctrl+Z)"
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2Icon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="ทำซ้ำ (Ctrl+Y)"
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2Icon className="size-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Markdown preview toggle */}
      <ToolbarButton
        title={isMarkdownPreview ? 'แสดงตัวแก้ไข' : 'พรีวิว Markdown'}
        active={isMarkdownPreview}
        onClick={onToggleMarkdown}
      >
        {isMarkdownPreview ? <PencilIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
      </ToolbarButton>
    </div>
  )
}
