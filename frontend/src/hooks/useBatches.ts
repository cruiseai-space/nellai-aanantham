import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { batchesApi } from '@/services/api'

export interface Batch {
  id: string
  ingredient_id: string
  quantity: number
  purchase_date: string
  expiry_date: string | null
  batch_number: string | null
  notes: string | null
  created_at: string
  ingredient?: {
    name: string
    unit: string
  }
}

export type CreateBatch = Omit<Batch, 'id' | 'created_at' | 'ingredient'>
export type UpdateBatch = Partial<CreateBatch>

export const useBatches = () => {
  return useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const { data } = await batchesApi.getAll()
      return data as Batch[]
    },
  })
}

export const useBatch = (id: string) => {
  return useQuery({
    queryKey: ['batches', id],
    queryFn: async () => {
      const { data } = await batchesApi.getById(id)
      return data as Batch
    },
    enabled: !!id,
  })
}

export const useBatchesByIngredient = (ingredientId: string) => {
  return useQuery({
    queryKey: ['batches', 'ingredient', ingredientId],
    queryFn: async () => {
      const { data } = await batchesApi.getByIngredient(ingredientId)
      return data as Batch[]
    },
    enabled: !!ingredientId,
  })
}

export const useExpiringSoonBatches = () => {
  return useQuery({
    queryKey: ['batches', 'expiring-soon'],
    queryFn: async () => {
      const { data } = await batchesApi.getExpiringSoon()
      return data as Batch[]
    },
  })
}

export const useCreateBatch = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (batch: CreateBatch) => batchesApi.create(batch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
  })
}

export const useUpdateBatch = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBatch }) => 
      batchesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['batches', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
  })
}

export const useDeleteBatch = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => batchesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
  })
}
