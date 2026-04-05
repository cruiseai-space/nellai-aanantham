import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { batchesApi, unwrapApiList, unwrapApiData } from '@/services/api'

export interface Batch {
  id: string
  ingredient_id: string
  /** Remaining quantity (from `qty_remaining`) */
  quantity: number
  qty_remaining: number
  qty_total: number
  unit_cost: number
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

export type CreateBatchPayload = {
  ingredient_id: string
  qty_total: number
  unit_cost: number
  purchase_date?: string
  expiry_date?: string | null
}

export type UpdateBatchPayload = Partial<{
  qty_total: number
  qty_remaining: number
  unit_cost: number
  purchase_date: string
  expiry_date: string | null
}>

function mapApiBatch(raw: Record<string, unknown>): Batch {
  const ing = raw.ingredients as { name?: string; unit?: string } | null | undefined
  const qtyRem = parseFloat(String(raw.qty_remaining ?? 0))
  return {
    id: String(raw.id),
    ingredient_id: String(raw.ingredient_id),
    quantity: qtyRem,
    qty_remaining: qtyRem,
    qty_total: parseFloat(String(raw.qty_total ?? qtyRem)),
    unit_cost: parseFloat(String(raw.unit_cost ?? 0)),
    purchase_date: String(raw.purchase_date ?? ''),
    expiry_date: raw.expiry_date != null ? String(raw.expiry_date) : null,
    batch_number: null,
    notes: null,
    created_at: String(raw.created_at ?? ''),
    ingredient: ing
      ? { name: String(ing.name ?? ''), unit: String(ing.unit ?? '') }
      : undefined,
  }
}

export const useBatches = () => {
  return useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const list = unwrapApiList<Record<string, unknown>>(await batchesApi.getAll())
      return list.map(mapApiBatch)
    },
  })
}

export const useBatch = (id: string) => {
  return useQuery({
    queryKey: ['batches', id],
    queryFn: async () => {
      const raw = unwrapApiData<Record<string, unknown>>(await batchesApi.getById(id))
      return mapApiBatch(raw)
    },
    enabled: !!id,
  })
}

export const useBatchesByIngredient = (ingredientId: string) => {
  return useQuery({
    queryKey: ['batches', 'ingredient', ingredientId],
    queryFn: async () => {
      const list = unwrapApiList<Record<string, unknown>>(
        await batchesApi.getByIngredient(ingredientId)
      )
      return list.map(mapApiBatch)
    },
    enabled: !!ingredientId,
  })
}

export const useExpiringSoonBatches = () => {
  return useQuery({
    queryKey: ['batches', 'expiring-soon'],
    queryFn: async () => {
      const list = unwrapApiList<Record<string, unknown>>(await batchesApi.getExpiringSoon())
      return list.map(mapApiBatch)
    },
  })
}

export const useCreateBatch = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (batch: CreateBatchPayload) => {
      const res = await batchesApi.create(batch)
      return mapApiBatch(unwrapApiData<Record<string, unknown>>(res))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
  })
}

export const useUpdateBatch = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBatchPayload }) => {
      const res = await batchesApi.update(id, data)
      return mapApiBatch(unwrapApiData<Record<string, unknown>>(res))
    },
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
    mutationFn: async (id: string) => {
      await unwrapApiData<unknown>(await batchesApi.delete(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
  })
}
