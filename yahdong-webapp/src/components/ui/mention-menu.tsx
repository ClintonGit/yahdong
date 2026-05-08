/**
 * MentionMenu — floating popup that the TipTap Mention extension renders
 * via @tiptap/suggestion. Shared between user (@) and task (#) triggers.
 *
 * Uses the same vanilla position-fixed approach as `slash-command.tsx` so
 * we don't pull in tippy.js / floating-ui just for two extensions.
 */
/* eslint-disable react-refresh/only-export-components */
import {
  useEffect,
  useImperativeHandle,
  useState,
  forwardRef,
  useRef,
} from 'react'
import { ReactRenderer } from '@tiptap/react'
import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from '@tiptap/suggestion'
import { AtSignIcon, HashIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────
// Item shape
// ─────────────────────────────────────────────────────────

export interface MentionItem {
  id: string
  label: string
  /** Optional sub-text — e.g. email for users, status name for tasks. */
  hint?: string
  /** Optional avatar URL — falls back to first-letter circle. */
  avatar?: string | null
}

export type MentionKind = 'user' | 'task'

export interface MentionListProps extends SuggestionProps<MentionItem> {
  kind: MentionKind
}

export interface MentionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

// ─────────────────────────────────────────────────────────
// Popup component
// ─────────────────────────────────────────────────────────

const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => setSelectedIndex(0), [props.items])

  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLElement>(
      `[data-index="${selectedIndex}"]`,
    )
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (!item) return
    // The Mention extension's `command` callback expects { id, label }.
    props.command({ id: item.id, label: item.label } as unknown as MentionItem)
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex(
          (i) => (i + props.items.length - 1) % Math.max(props.items.length, 1),
        )
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
        {props.kind === 'user' ? 'ไม่พบสมาชิก' : 'ไม่พบงาน'}
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
        const active = index === selectedIndex
        return (
          <button
            key={`${props.kind}-${item.id}`}
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
            {props.kind === 'user' ? (
              <UserAvatar item={item} active={active} />
            ) : (
              <TaskBadge active={active} />
            )}
            <span className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate">
                {trim(item.label, 30)}
              </span>
              {item.hint && (
                <span
                  className="text-xs truncate"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {trim(item.hint, 40)}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
})
MentionList.displayName = 'MentionList'

function trim(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

function UserAvatar({ item, active }: { item: MentionItem; active: boolean }) {
  if (item.avatar) {
    return (
      <img
        src={item.avatar}
        alt=""
        className="size-7 rounded-full object-cover shrink-0"
      />
    )
  }
  return (
    <span
      className="flex items-center justify-center size-7 rounded-full shrink-0 text-xs font-semibold"
      style={{
        background: active ? 'var(--color-primary)' : 'var(--color-paper)',
        color: active ? 'white' : 'var(--color-text)',
      }}
    >
      {item.label.slice(0, 1).toUpperCase()}
    </span>
  )
}

function TaskBadge({ active }: { active: boolean }) {
  return (
    <span
      className="flex items-center justify-center size-7 rounded-md shrink-0"
      style={{
        background: active ? 'var(--color-primary)' : 'var(--color-paper)',
        color: active ? 'white' : 'var(--color-muted-foreground)',
      }}
    >
      <HashIcon className="size-3.5" />
    </span>
  )
}

// Keep export so consumers can render the icon next to a placeholder if they want.
export { AtSignIcon }

// ─────────────────────────────────────────────────────────
// Floating positioner — copied pattern from slash-command.tsx
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

  if (top + menuHeight > window.innerHeight - 8) {
    top = rect.top - padding - menuHeight
  }
  if (left + menuWidth > window.innerWidth - 8) {
    left = window.innerWidth - 8 - menuWidth
  }
  if (left < 8) left = 8

  container.style.display = ''
  container.style.top = `${Math.max(8, top)}px`
  container.style.left = `${left}px`
}

// ─────────────────────────────────────────────────────────
// Renderer factory — used as the `render()` for a Mention suggestion.
// ─────────────────────────────────────────────────────────

export function makeMentionRenderer(kind: MentionKind) {
  return () => {
    let component: ReactRenderer<MentionListRef, MentionListProps> | null = null
    let container: HTMLDivElement | null = null
    let lastClientRect: (() => DOMRect | null) | null | undefined = null

    const updatePosition = () => {
      if (!container) return
      positionContainer(container, lastClientRect?.() ?? null)
    }

    const onScroll = () => updatePosition()

    return {
      onStart: (props: SuggestionProps<MentionItem>) => {
        component = new ReactRenderer<MentionListRef, MentionListProps>(MentionList, {
          props: { ...props, kind },
          editor: props.editor,
        })
        container = createFloatingContainer()
        container.appendChild(component.element)
        lastClientRect = props.clientRect
        updatePosition()
        window.addEventListener('scroll', onScroll, true)
        window.addEventListener('resize', onScroll)
      },
      onUpdate: (props: SuggestionProps<MentionItem>) => {
        component?.updateProps({ ...props, kind })
        lastClientRect = props.clientRect
        updatePosition()
      },
      onKeyDown: (props: SuggestionKeyDownProps) => {
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
  }
}
