/**
 * Slash command — / triggers a popover menu to insert nodes.
 * Uses TipTap @tiptap/suggestion plugin directly (no 3rd-party library).
 */
/* eslint-disable react-refresh/only-export-components */
import { useEffect, useImperativeHandle, useState, forwardRef, useRef } from 'react'
import { Extension, type Range } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import Suggestion, { type SuggestionOptions, type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion'
import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  ListChecksIcon,
  QuoteIcon,
  CodeIcon,
  MinusIcon,
  ImageIcon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────
// Item registry
// ─────────────────────────────────────────────────────────

export interface SlashCommandItem {
  title: string
  description: string
  icon: LucideIcon
  searchTerms: string[]
  command: (props: { editor: Editor; range: Range }) => void
}

interface SlashCommandOptions {
  suggestion: Omit<SuggestionOptions, 'editor'>
  onImageInsert?: () => void
}

function buildItems(onImageInsert?: () => void): SlashCommandItem[] {
  return [
    {
      title: 'Heading 1',
      description: 'หัวข้อใหญ่',
      icon: Heading1Icon,
      searchTerms: ['title', 'big', 'h1', 'หัวข้อ'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      },
    },
    {
      title: 'Heading 2',
      description: 'หัวข้อรอง',
      icon: Heading2Icon,
      searchTerms: ['subtitle', 'medium', 'h2'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      },
    },
    {
      title: 'Heading 3',
      description: 'หัวข้อย่อย',
      icon: Heading3Icon,
      searchTerms: ['small', 'h3'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
      },
    },
    {
      title: 'Bullet List',
      description: 'รายการแบบจุด',
      icon: ListIcon,
      searchTerms: ['unordered', 'bullet', 'point', 'รายการ'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      title: 'Numbered List',
      description: 'รายการแบบเลข',
      icon: ListOrderedIcon,
      searchTerms: ['ordered', 'numbered', 'เลข'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      title: 'To-do List',
      description: 'รายการเช็คบ็อกซ์',
      icon: ListChecksIcon,
      searchTerms: ['todo', 'task', 'checklist', 'check', 'งาน'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run()
      },
    },
    {
      title: 'Quote',
      description: 'ข้อความอ้างอิง',
      icon: QuoteIcon,
      searchTerms: ['blockquote', 'quote', 'อ้างอิง'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run()
      },
    },
    {
      title: 'Code Block',
      description: 'บล็อกโค้ด',
      icon: CodeIcon,
      searchTerms: ['code', 'codeblock', 'pre'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
      },
    },
    {
      title: 'Divider',
      description: 'เส้นคั่น',
      icon: MinusIcon,
      searchTerms: ['hr', 'divider', 'line', 'เส้น'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
      },
    },
    {
      title: 'Image',
      description: 'แทรกรูปภาพ',
      icon: ImageIcon,
      searchTerms: ['image', 'picture', 'photo', 'รูป'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run()
        onImageInsert?.()
      },
    },
  ]
}

// ─────────────────────────────────────────────────────────
// Popup component (ReactRenderer)
// ─────────────────────────────────────────────────────────

interface SlashMenuRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

const SlashMenu = forwardRef<SlashMenuRef, SuggestionProps<SlashCommandItem>>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => setSelectedIndex(0), [props.items])

  // auto-scroll selected item into view
  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) props.command(item)
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i + props.items.length - 1) % Math.max(props.items.length, 1))
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % Math.max(props.items.length, 1))
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  if (props.items.length === 0) {
    return (
      <div
        className="rounded-xl border shadow-lg p-3 text-xs"
        style={{
          background: 'var(--color-card)',
          borderColor: 'var(--color-border-forest)',
          color: 'var(--color-muted-foreground)',
        }}
      >
        ไม่พบคำสั่ง
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl border shadow-lg overflow-y-auto p-1 w-64 max-h-72"
      style={{
        background: 'var(--color-card)',
        borderColor: 'var(--color-border-forest)',
      }}
    >
      {props.items.map((item, index) => {
        const Icon = item.icon
        const active = index === selectedIndex
        return (
          <button
            key={item.title}
            type="button"
            data-index={index}
            onMouseDown={(e) => {
              e.preventDefault()
              selectItem(index)
            }}
            onMouseEnter={() => setSelectedIndex(index)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors',
              active
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-text)]'
                : 'text-[var(--color-text)] hover:bg-[var(--color-border-forest)]/30',
            )}
          >
            <span
              className="flex items-center justify-center size-7 rounded-md shrink-0"
              style={{
                background: active ? 'var(--color-primary)' : 'var(--color-paper)',
                color: active ? 'white' : 'var(--color-muted-foreground)',
              }}
            >
              <Icon className="size-3.5" />
            </span>
            <span className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{item.title}</span>
              <span
                className="text-xs truncate"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                {item.description}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
})
SlashMenu.displayName = 'SlashMenu'

// ─────────────────────────────────────────────────────────
// Floating positioner (no tippy.js — vanilla position-fixed)
// ─────────────────────────────────────────────────────────

function createFloatingContainer(): HTMLDivElement {
  const div = document.createElement('div')
  div.style.position = 'fixed'
  div.style.zIndex = '60'
  div.style.top = '0'
  div.style.left = '0'
  div.style.pointerEvents = 'auto'
  document.body.appendChild(div)
  return div
}

function positionContainer(container: HTMLDivElement, rect: DOMRect | null) {
  if (!rect) {
    container.style.display = 'none'
    return
  }
  const padding = 8
  const menuHeight = container.firstElementChild?.clientHeight ?? 280
  const menuWidth = container.firstElementChild?.clientWidth ?? 256

  let top = rect.bottom + padding
  let left = rect.left

  // flip up if not enough space below
  if (top + menuHeight > window.innerHeight - 8) {
    top = rect.top - padding - menuHeight
  }
  // clamp horizontal to viewport
  if (left + menuWidth > window.innerWidth - 8) {
    left = window.innerWidth - 8 - menuWidth
  }
  if (left < 8) left = 8

  container.style.display = ''
  container.style.top = `${Math.max(8, top)}px`
  container.style.left = `${left}px`
}

// ─────────────────────────────────────────────────────────
// Extension factory
// ─────────────────────────────────────────────────────────

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        // these get overridden in addProseMirrorPlugins
        items: () => [],
        command: () => {},
      },
      onImageInsert: undefined,
    }
  },

  addProseMirrorPlugins() {
    const onImageInsert = this.options.onImageInsert
    const allItems = buildItems(onImageInsert)

    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        items: ({ query }) => {
          const q = query.toLowerCase().trim()
          if (!q) return allItems
          return allItems.filter((item) => {
            if (item.title.toLowerCase().includes(q)) return true
            return item.searchTerms.some((t) => t.toLowerCase().includes(q))
          })
        },
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
        render: () => {
          let component: ReactRenderer<SlashMenuRef, SuggestionProps<SlashCommandItem>> | null = null
          let container: HTMLDivElement | null = null
          let lastClientRect: (() => DOMRect | null) | null | undefined = null

          const updatePosition = () => {
            if (!container) return
            positionContainer(container, lastClientRect?.() ?? null)
          }

          const onScroll = () => updatePosition()

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenu, {
                props,
                editor: props.editor,
              })
              container = createFloatingContainer()
              container.appendChild(component.element)
              lastClientRect = props.clientRect
              updatePosition()
              window.addEventListener('scroll', onScroll, true)
              window.addEventListener('resize', onScroll)
            },
            onUpdate: (props) => {
              component?.updateProps(props)
              lastClientRect = props.clientRect
              updatePosition()
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                container?.remove()
                container = null
                component?.destroy()
                component = null
                window.removeEventListener('scroll', onScroll, true)
                window.removeEventListener('resize', onScroll)
                return true
              }
              return component?.ref?.onKeyDown(props) ?? false
            },
            onExit: () => {
              window.removeEventListener('scroll', onScroll, true)
              window.removeEventListener('resize', onScroll)
              container?.remove()
              container = null
              component?.destroy()
              component = null
            },
          }
        },
      }),
    ]
  },
})

export type { SuggestionProps }
