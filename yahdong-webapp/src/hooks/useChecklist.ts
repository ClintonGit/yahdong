import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { checklistApi, type ChecklistItem } from '../api/tasks'

const checklistKey = (taskId: string) => ['checklist', taskId] as const

export function useChecklist(taskId: string) {
  return useQuery({
    queryKey: checklistKey(taskId),
    queryFn: () => checklistApi.list(taskId).then((r) => r.data),
    enabled: !!taskId,
  })
}

export function useAddChecklistItem(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (text: string) =>
      checklistApi.create(taskId, text).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: checklistKey(taskId) }),
  })
}

export function useUpdateChecklistItem(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, ...data }: { itemId: string; text?: string; checked?: boolean }) =>
      checklistApi.update(itemId, data).then((r) => r.data),
    onMutate: async ({ itemId, ...data }) => {
      await qc.cancelQueries({ queryKey: checklistKey(taskId) })
      const prev = qc.getQueryData<ChecklistItem[]>(checklistKey(taskId))
      qc.setQueryData<ChecklistItem[]>(checklistKey(taskId), (old) =>
        old?.map((item) => (item.id === itemId ? { ...item, ...data } : item)) ?? [],
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(checklistKey(taskId), ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: checklistKey(taskId) }),
  })
}

export function useDeleteChecklistItem(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => checklistApi.delete(itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: checklistKey(taskId) }),
  })
}
