import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  statusApi,
  taskApi,
  type Task,
  type TaskStatus,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '../api/tasks'

export type Column = TaskStatus & { tasks: Task[] }

const statusesKey = (projectId: string) => ['statuses', projectId] as const
const tasksKey = (projectId: string) => ['tasks', projectId] as const

export function useBoard(projectId: string) {
  const statusesQ = useQuery({
    queryKey: statusesKey(projectId),
    queryFn: () => statusApi.list(projectId).then((r) => r.data),
    enabled: !!projectId,
  })

  const tasksQ = useQuery({
    queryKey: tasksKey(projectId),
    queryFn: () => taskApi.list(projectId).then((r) => r.data),
    enabled: !!projectId,
  })

  const columns: Column[] = (statusesQ.data ?? []).map((s) => ({
    ...s,
    tasks: (tasksQ.data ?? [])
      .filter((t) => t.statusId === s.id)
      .sort((a, b) => a.order - b.order),
  }))

  return {
    columns,
    isLoading: statusesQ.isLoading || tasksQ.isLoading,
    isError: statusesQ.isError || tasksQ.isError,
  }
}

export function useMoveTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      taskId,
      statusId,
      order,
    }: {
      taskId: string
      statusId: string
      order: number
    }) => taskApi.move(taskId, { statusId, order }),
    onSettled: () => qc.invalidateQueries({ queryKey: tasksKey(projectId) }),
  })
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaskInput) =>
      taskApi.create(projectId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(projectId) }),
  })
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, ...data }: { taskId: string } & UpdateTaskInput) =>
      taskApi.update(taskId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(projectId) }),
  })
}

export function useDeleteTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => taskApi.delete(taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(projectId) }),
  })
}

export function useCreateStatus(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      statusApi.create(projectId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: statusesKey(projectId) }),
  })
}

export function useDeleteStatus(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (statusId: string) => statusApi.delete(statusId),
    onSuccess: () => qc.invalidateQueries({ queryKey: statusesKey(projectId) }),
  })
}

export function useReorderStatuses(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      statusApi.reorder(projectId, orderedIds),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: statusesKey(projectId) }),
  })
}
