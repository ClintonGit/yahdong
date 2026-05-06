import api from '../lib/axios'

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  coverImage?: string | null
  isPublic?: boolean
  shareToken?: string | null
  myRole: 'owner' | 'member' | 'viewer'
  starred?: boolean
  _count?: { members: number }
}

export interface ProjectMember {
  id: string
  name: string
  email: string
  avatar?: string | null
  role: 'owner' | 'member' | 'viewer'
}

export interface CreateProjectInput {
  name: string
  description?: string
  color?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  color?: string
  coverImage?: string | null
}

export const projectsApi = {
  list: () => api.get<Project[]>('/projects'),
  get: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: CreateProjectInput) => api.post<Project>('/projects', data),
  update: (id: string, data: UpdateProjectInput) =>
    api.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getMembers: (id: string) => api.get<ProjectMember[]>(`/projects/${id}/members`),
  toggleStar: (id: string) =>
    api.patch<{ starred: boolean }>(`/projects/${id}/star`),
  generateInviteLink: (id: string) =>
    api.post<{ token: string; expiresAt: string }>(`/projects/${id}/invite-link`),
  toggleShare: (id: string) =>
    api.patch<{ isPublic: boolean; shareToken: string | null }>(`/projects/${id}/share`),
}

export const inviteApi = {
  getInvite: (token: string) =>
    api.get<{ token: string; expiresAt: string; project: { id: string; name: string; color: string } }>(
      `/invite/${token}`,
    ),
  acceptInvite: (token: string) =>
    api.post<{ projectId: string; role: string }>(`/invite/${token}/accept`),
}

export interface PendingInvite {
  id: string
  email: string | null
  role: 'owner' | 'member' | 'viewer'
  expiresAt: string
  createdAt: string
}

export const pendingInvitesApi = {
  list: (projectId: string) => api.get<PendingInvite[]>(`/projects/${projectId}/invites`),
  cancel: (projectId: string, inviteId: string) =>
    api.delete(`/projects/${projectId}/invites/${inviteId}`),
}

export const publicBoardApi = {
  getBoard: (shareToken: string) => api.get(`/b/${shareToken}`),
}

export const labelsApi = {
  list: (projectId: string) =>
    api.get<{ id: string; name: string; color: string }[]>(`/projects/${projectId}/labels`),
  create: (projectId: string, data: { name: string; color: string }) =>
    api.post<{ id: string; name: string; color: string }>(`/projects/${projectId}/labels`, data),
  update: (labelId: string, data: { name?: string; color?: string }) =>
    api.patch(`/projects/labels/${labelId}`, data),
  delete: (labelId: string) => api.delete(`/projects/labels/${labelId}`),
}
