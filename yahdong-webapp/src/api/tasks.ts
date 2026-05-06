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

export interface Label {
  id: string
  projectId: string
  name: string
  color: string
}

export interface TaskLabel {
  taskId: string
  labelId: string
  label: Label
}

export interface ChecklistItem {
  id: string
  taskId: string
  text: string
  checked: boolean
  order: number
  createdAt: string
}

export interface TaskAssignee {
  userId: string
  user: TaskUser
}

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string | null
  statusId: string
  priority: TaskPriority
  dueDate?: string | null
  coverImage?: string | null
  coverColor?: string | null
  order: number
  createdBy: string
  createdAt: string
  assignees?: TaskAssignee[]
  status?: TaskStatus
  labels?: TaskLabel[]
  checklistItems?: ChecklistItem[]
  _count?: { checklistItems: number }
}

export interface CreateTaskInput {
  title: string
  statusId: string
  description?: string
  priority?: TaskPriority
  assigneeIds?: string[]
  dueDate?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  priority?: TaskPriority
  assigneeIds?: string[]
  dueDate?: string | null
  coverImage?: string | null
  coverColor?: string | null
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
  setLabels: (taskId: string, labelIds: string[]) =>
    api.patch(`/tasks/${taskId}/labels`, { labelIds }),
}

export const checklistApi = {
  list: (taskId: string) =>
    api.get<ChecklistItem[]>(`/tasks/${taskId}/checklist`),
  create: (taskId: string, text: string) =>
    api.post<ChecklistItem>(`/tasks/${taskId}/checklist`, { text }),
  update: (itemId: string, data: { text?: string; checked?: boolean }) =>
    api.patch<ChecklistItem>(`/checklist/${itemId}`, data),
  delete: (itemId: string) => api.delete(`/checklist/${itemId}`),
}
