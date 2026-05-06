import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/notifications'

const NOTIF_KEY = ['notifications'] as const
const UNREAD_KEY = ['notifications', 'unread-count'] as const

export function useNotifications() {
  return useQuery({
    queryKey: NOTIF_KEY,
    queryFn: () => notificationsApi.list().then((r) => r.data),
    refetchInterval: 30_000,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: () => notificationsApi.unreadCount().then((r) => r.data.count),
    refetchInterval: 15_000,
  })
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
