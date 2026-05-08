import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/notifications'
import { useAuthStore } from '../stores/authStore'

const NOTIF_KEY = ['notifications'] as const
const UNREAD_KEY = ['notifications', 'unread-count'] as const

// Polling intervals are kept as a fallback for tabs that lose their SSE
// connection (browsers throttle EventSource after ~5min of inactivity, and
// some corporate proxies kill long-lived HTTP streams). The cadence is much
// lazier than before because SSE handles the "fresh" path now.
const NOTIF_FALLBACK_INTERVAL = 90_000
const UNREAD_FALLBACK_INTERVAL = 60_000

// Reconnect backoff: 1s → 2s → 4s → … capped at 30s.
const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

export function useNotifications() {
  return useQuery({
    queryKey: NOTIF_KEY,
    queryFn: () => notificationsApi.list().then((r) => r.data),
    refetchInterval: NOTIF_FALLBACK_INTERVAL,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: () => notificationsApi.unreadCount().then((r) => r.data.count),
    refetchInterval: UNREAD_FALLBACK_INTERVAL,
  })
}

/**
 * Subscribe to the server-sent notification stream.
 * Mount once (e.g. in AppShell) — invalidates the notification queries every
 * time the server pushes an event so React Query handles the actual fetch.
 */
export function useNotificationStream() {
  const qc = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)
  const reconnectAttempt = useRef(0)
  const reconnectTimer = useRef<number | null>(null)
  const sourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    const baseUrl =
      (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'
    let cancelled = false

    const cleanup = () => {
      if (reconnectTimer.current !== null) {
        window.clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
      if (sourceRef.current) {
        sourceRef.current.close()
        sourceRef.current = null
      }
    }

    const connect = () => {
      if (cancelled) return
      // Pull the freshest token at the moment of (re)connecting — axios may
      // have refreshed it while we were waiting on backoff.
      const token = useAuthStore.getState().accessToken
      if (!token) return

      const url = `${baseUrl}/notifications/stream?token=${encodeURIComponent(token)}`
      const es = new EventSource(url)
      sourceRef.current = es

      es.onopen = () => {
        // Successful handshake — reset the backoff counter.
        reconnectAttempt.current = 0
      }

      es.onmessage = () => {
        // We treat every server event as "something changed". The actual
        // payload is only used for debugging — invalidating the queries is
        // what drives the UI update via the existing React Query flow.
        qc.invalidateQueries({ queryKey: NOTIF_KEY })
        qc.invalidateQueries({ queryKey: UNREAD_KEY })
      }

      es.onerror = () => {
        // EventSource auto-reconnects on its own, but it does so without
        // backoff and keeps the same (possibly expired) token. Force-close
        // and reconnect with exponential backoff + a fresh token instead.
        es.close()
        sourceRef.current = null
        if (cancelled) return

        const attempt = reconnectAttempt.current
        const delay = Math.min(
          RECONNECT_BASE_MS * 2 ** attempt,
          RECONNECT_MAX_MS,
        )
        reconnectAttempt.current = attempt + 1
        reconnectTimer.current = window.setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      cancelled = true
      cleanup()
    }
  }, [isAuthenticated, accessToken, qc])
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIF_KEY })
      qc.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIF_KEY })
      qc.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })
}

export function useMarkTaskRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => notificationsApi.markTaskRead(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIF_KEY })
      qc.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })
}
