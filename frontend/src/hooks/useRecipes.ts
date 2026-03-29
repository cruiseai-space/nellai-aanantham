import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recipesApi } from '@/services/api'

export interface RecipeIngredient {
  ingredient_id: string
  quantity: number
  ingredient?: {
    name: string
    unit: string
    cost_per_unit: number
  }
}

export interface Recipe {
  id: string
  name: string
  description: string | null
  yield_quantity: number
  yield_unit: string
  category: string | null
  preparation_time: number | null
  instructions: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  ingredients?: RecipeIngredient[]
}

export type CreateRecipe = Omit<Recipe, 'id' | 'created_at' | 'updated_at'> & {
  ingredients?: Array<{ ingredient_id: string; quantity: number }>
}
export type UpdateRecipe = Partial<CreateRecipe>

export const useRecipes = () => {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data } = await recipesApi.getAll()
      return data as Recipe[]
    },
  })
}

export const useRecipe = (id: string) => {
  return useQuery({
    queryKey: ['recipes', id],
    queryFn: async () => {
      const { data } = await recipesApi.getById(id)
      return data as Recipe
    },
    enabled: !!id,
  })
}

export const useRecipeCost = (id: string) => {
  return useQuery({
    queryKey: ['recipes', id, 'cost'],
    queryFn: async () => {
      const { data } = await recipesApi.getCost(id)
      return data as { total_cost: number; cost_per_unit: number }
    },
    enabled: !!id,
  })
}

export const useCreateRecipe = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (recipe: CreateRecipe) => recipesApi.create(recipe),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecipe }) => 
      recipesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipes', variables.id] })
    },
  })
}

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => recipesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}
