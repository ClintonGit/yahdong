import api from '../lib/axios'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskStatus {
  id: string
  projectId: string
  name: string
  color: string
  order: number
}

export interface TaskUser {
  id: string
  name: string
  avatar?: string | null
}

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string | null
  statusId: string
  priority: TaskPriority
  assigneeId?: string | null
  dueDate?: string | null
  coverImage?: string | null
  order: number
  createdBy: string
  createdAt: string
  assignee?: TaskUser | null
}

export interface CreateTaskInput {
  title: string
  statusId: string
  description?: string
  priority?: TaskPriority
  assigneeId?: string
  dueDate?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  priority?: TaskPriority
  assigneeId?: string
  dueDate?: string | null
  coverImage?: string | null
  statusId?: string
}

export const statusApi = {
  list: (projectId: string) =>
    api.get<TaskStatus[]>(`/projects/${projectId}/statuses`),
  create: (projectId: string, data: { name: string; color: string }) =>
    api.post<TaskStatus>(`/projects/${projectId}/statuses`, data),
  update: (statusId: string, data: { name?: string; color?: string }) =>
    api.patch<TaskStatus>(`/statuses/${statusId}`, data),
  delete: (statusId: string) => api.delete(`/statuses/${statusId}`),
  reorder: (projectId: string, orderedIds: string[]) =>
    api.patch(`/projects/${projectId}/statuses/reorder`, { orderedIds }),
}

export const taskApi = {
  list: (projectId: string) =>
    api.get<Task[]>(`/projects/${projectId}/tasks`),
  create: (projectId: string, data: CreateTaskInput) =>
    api.post<Task>(`/projects/${projectId}/tasks`, data),
  update: (taskId: string, data: UpdateTaskInput) =>
    api.patch<Task>(`/tasks/${taskId}`, data),
  delete: (taskId: string) => api.delete(`/tasks/${taskId}`),
  move: (taskId: string, data: { statusId: string; order: number }) =>
    api.patch<Task>(`/tasks/${taskId}/move`, data),
}
