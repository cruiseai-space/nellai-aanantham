import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { batchesApi, ingredientsApi, unwrapApiList, unwrapApiData } from '@/services/api'

const DEFAULT_MIN_STOCK = 5

export interface Ingredient {
  id: string
  name: string
  category: string | null
  unit: string
  current_stock: number
  min_stock: number
  cost_per_unit: number
  supplier: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/** Backend POST/PUT only accept `name` and `unit`. */
export type CreateIngredient = { name: string; unit: string }
export type UpdateIngredient = Partial<CreateIngredient>

function mergeStockFromBatches(
  rows: Array<Record<string, unknown>>,
  batches: Array<Record<string, unknown>>
): Ingredient[] {
  const byIng: Record<string, number> = {}
  const costByIng: Record<string, { sum: number; qty: number }> = {}
  for (const b of batches) {
    const iid = String(b.ingredient_id)
    const qr = parseFloat(String(b.qty_remaining ?? 0))
    byIng[iid] = (byIng[iid] ?? 0) + qr
    const uc = parseFloat(String(b.unit_cost ?? 0))
    if (!costByIng[iid]) costByIng[iid] = { sum: 0, qty: 0 }
    costByIng[iid].sum += uc * qr
    costByIng[iid].qty += qr
  }

  return rows.map((row) => {
    const id = String(row.id)
    const current = byIng[id] ?? 0
    const c = costByIng[id]
    const costPerUnit = c && c.qty > 0 ? c.sum / c.qty : 0
    const minStock =
      row.min_stock != null ? Number(row.min_stock) : DEFAULT_MIN_STOCK
    return {
      id,
      name: String(row.name),
      category: row.category != null ? String(row.category) : null,
      unit: String(row.unit),
      current_stock: current,
      min_stock: minStock,
      cost_per_unit: costPerUnit,
      supplier: row.supplier != null ? String(row.supplier) : null,
      notes: row.notes != null ? String(row.notes) : null,
      created_at: String(row.created_at ?? ''),
      updated_at: String(row.updated_at ?? row.created_at ?? ''),
    }
  })
}

export const useIngredients = () => {
  return useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const [ingsRes, batchesRes] = await Promise.all([
        ingredientsApi.getAll(),
        batchesApi.getAll(),
      ])
      const rows = unwrapApiList<Record<string, unknown>>(ingsRes)
      const batchRows = unwrapApiList<Record<string, unknown>>(batchesRes)
      return mergeStockFromBatches(rows, batchRows)
    },
  })
}

export const useIngredient = (id: string) => {
  return useQuery({
    queryKey: ['ingredients', id],
    queryFn: async () => {
      const data = unwrapApiData<Record<string, unknown>>(await ingredientsApi.getById(id))
      const batches = (data.batches as Array<Record<string, unknown>> | undefined) ?? []
      const row = {
        id: data.id,
        name: data.name,
        unit: data.unit,
        min_stock: data.min_stock,
        category: data.category,
        supplier: data.supplier,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }
      return mergeStockFromBatches([row as Record<string, unknown>], batches)[0]
    },
    enabled: !!id,
  })
}

export const useLowStockIngredients = () => {
  return useQuery({
    queryKey: ['ingredients', 'low-stock'],
    queryFn: async () => {
      return unwrapApiList<Ingredient>(await ingredientsApi.getLowStock())
    },
  })
}

export const useCreateIngredient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ingredient: CreateIngredient) => {
      const res = await ingredientsApi.create({
        name: ingredient.name,
        unit: ingredient.unit,
      })
      return unwrapApiData<Record<string, unknown>>(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
  })
}

export const useUpdateIngredient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateIngredient }) => {
      const body: Record<string, string> = {}
      if (data.name !== undefined) body.name = data.name
      if (data.unit !== undefined) body.unit = data.unit
      const res = await ingredientsApi.update(id, body)
      return unwrapApiData<Record<string, unknown>>(res)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients', variables.id] })
    },
  })
}

export const useDeleteIngredient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await unwrapApiData<unknown>(await ingredientsApi.delete(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
  })
}
