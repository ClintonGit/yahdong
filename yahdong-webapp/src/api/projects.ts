import api from '../lib/axios'

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  myRole: 'owner' | 'member' | 'viewer'
  _count?: { members: number }
}

export interface CreateProjectInput {
  name: string
  description?: string
  color?: string
}

export const projectsApi = {
  list: () => api.get<Project[]>('/projects'),
  get: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: CreateProjectInput) => api.post<Project>('/projects', data),
  update: (id: string, data: Partial<CreateProjectInput>) =>
    api.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
}
