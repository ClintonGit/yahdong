import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../api/projects'

export function useMembers(projectId: string) {
  return useQuery({
    queryKey: ['members', projectId],
    queryFn: () => projectsApi.getMembers(projectId).then((r) => r.data),
    enabled: !!projectId,
  })
}
