import api from '../lib/axios'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<UserProfile>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthTokens & { user: UserProfile }>('/auth/login', data),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),

  logout: () => api.delete('/auth/logout'),
}
