import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectsApi, type CreateProjectInput, type UpdateProjectInput } from '../api/projects'

export const PROJECT_KEYS = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
}

export function useProjects() {
  return useQuery({
    queryKey: PROJECT_KEYS.all,
    queryFn: () => projectsApi.list().then((r) => r.data),
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProjectInput) =>
      projectsApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.all }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateProjectInput) =>
      projectsApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.all }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.all }),
  })
}

export function useToggleStar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) =>
      projectsApi.toggleStar(projectId).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.all }),
  })
}

export function useGenerateInviteLink() {
  return useMutation({
    mutationFn: (projectId: string) =>
      projectsApi.generateInviteLink(projectId).then((r) => r.data),
  })
}

export function useToggleShare() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) =>
      projectsApi.toggleShare(projectId).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.all }),
  })
}
