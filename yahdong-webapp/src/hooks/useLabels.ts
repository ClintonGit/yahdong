import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { labelsApi } from '../api/projects'
import { taskApi } from '../api/tasks'

const labelsKey = (projectId: string) => ['labels', projectId] as const
const tasksKey = (projectId: string) => ['tasks', projectId] as const

export function useLabels(projectId: string) {
  return useQuery({
    queryKey: labelsKey(projectId),
    queryFn: () => labelsApi.list(projectId).then((r) => r.data),
    enabled: !!projectId,
  })
}

export function useCreateLabel(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      labelsApi.create(projectId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: labelsKey(projectId) }),
  })
}

export function useDeleteLabel(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (labelId: string) => labelsApi.delete(labelId),
    onSuccess: () => qc.invalidateQueries({ queryKey: labelsKey(projectId) }),
  })
}

export function useSetTaskLabels(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, labelIds }: { taskId: string; labelIds: string[] }) =>
      taskApi.setLabels(taskId, labelIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(projectId) }),
  })
}
