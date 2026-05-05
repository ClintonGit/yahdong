import api from '../lib/axios'

export interface CommentUser {
  id: string
  name: string
  avatar?: string | null
}

export interface Comment {
  id: string
  taskId: string
  userId: string
  body: string
  imageUrl?: string | null
  createdAt: string
  user: CommentUser
}

export const commentsApi = {
  list: (taskId: string) =>
    api.get<Comment[]>(`/tasks/${taskId}/comments`).then((r) => r.data),

  create: (taskId: string, body: string, imageUrl?: string) =>
    api
      .post<Comment>(`/tasks/${taskId}/comments`, { body, imageUrl })
      .then((r) => r.data),

  remove: (commentId: string) =>
    api.delete(`/comments/${commentId}`),

  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ url: string }>('/uploads', form).then((r) => r.data)
  },
}
