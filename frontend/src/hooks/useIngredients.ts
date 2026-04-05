import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ingredientsApi, unwrapApiList, unwrapApiData } from '@/services/api'

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

export type CreateIngredient = Omit<Ingredient, 'id' | 'created_at' | 'updated_at'>
export type UpdateIngredient = Partial<CreateIngredient>

export const useIngredients = () => {
  return useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      return unwrapApiList<Ingredient>(await ingredientsApi.getAll())
    },
  })
}

export const useIngredient = (id: string) => {
  return useQuery({
    queryKey: ['ingredients', id],
    queryFn: async () => {
      return unwrapApiData<Ingredient>(await ingredientsApi.getById(id))
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
    mutationFn: (ingredient: CreateIngredient) => ingredientsApi.create(ingredient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
  })
}

export const useUpdateIngredient = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIngredient }) => 
      ingredientsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients', variables.id] })
    },
  })
}

export const useDeleteIngredient = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => ingredientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
  })
}
