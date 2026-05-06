import api from '../lib/axios'

export interface Notification {
  id: string
  userId: string
  taskId: string
  commentId?: string | null
  type: string
  body: string
  readAt?: string | null
  createdAt: string
  task: { id: string; title: string; projectId: string }
}

export const notificationsApi = {
  list: () => api.get<Notification[]>('/notifications'),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  markTaskRead: (taskId: string) => api.patch(`/notifications/tasks/${taskId}/read`),
}
