import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recipesApi, unwrapApiList, unwrapApiData } from '@/services/api'

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

export type RecipeItemPayload = {
  ingredient_id: string
  quantity_required: number
}

export type RecipeCreatePayload = {
  name: string
  items?: RecipeItemPayload[]
}

export type RecipeUpdatePayload = {
  name?: string
  items?: RecipeItemPayload[]
}

function mapRecipe(raw: Record<string, unknown>): Recipe {
  const items = (raw.recipe_items as Array<Record<string, unknown>> | undefined) ?? []
  const ingredients: RecipeIngredient[] = items.map((ri) => {
    const nested = ri.ingredients as { name?: string; unit?: string } | undefined
    return {
      ingredient_id: String(ri.ingredient_id),
      quantity: Number(ri.quantity_required ?? 0),
      ingredient: nested
        ? {
            name: String(nested.name ?? ''),
            unit: String(nested.unit ?? ''),
            cost_per_unit: 0,
          }
        : undefined,
    }
  })
  return {
    id: String(raw.id),
    name: String(raw.name),
    description: raw.description != null ? String(raw.description) : null,
    yield_quantity:
      raw.yield_quantity != null ? Number(raw.yield_quantity) : 1,
    yield_unit: raw.yield_unit != null ? String(raw.yield_unit) : 'batch',
    category: raw.category != null ? String(raw.category) : null,
    preparation_time:
      raw.preparation_time != null ? Number(raw.preparation_time) : null,
    instructions: raw.instructions != null ? String(raw.instructions) : null,
    is_active: raw.is_active !== false,
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? raw.created_at ?? ''),
    ingredients,
  }
}

export const useRecipes = () => {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const list = unwrapApiList<Record<string, unknown>>(await recipesApi.getAll())
      return list.map(mapRecipe)
    },
  })
}

export const useRecipe = (id: string) => {
  return useQuery({
    queryKey: ['recipes', id],
    queryFn: async () => {
      const raw = unwrapApiData<Record<string, unknown>>(await recipesApi.getById(id))
      return mapRecipe(raw)
    },
    enabled: !!id,
  })
}

export const useRecipeCost = (id: string) => {
  return useQuery({
    queryKey: ['recipes', id, 'cost'],
    queryFn: async () => {
      return unwrapApiData<{ total_cost: number; cost_per_unit: number }>(
        await recipesApi.getCost(id)
      )
    },
    enabled: !!id,
  })
}

export const useCreateRecipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recipe: RecipeCreatePayload) => {
      const res = await recipesApi.create(recipe)
      return mapRecipe(unwrapApiData<Record<string, unknown>>(res))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RecipeUpdatePayload }) => {
      const body: Record<string, unknown> = {}
      if (data.name !== undefined) body.name = data.name
      if (data.items !== undefined) body.items = data.items
      const res = await recipesApi.update(id, body)
      return mapRecipe(unwrapApiData<Record<string, unknown>>(res))
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipes', variables.id] })
    },
  })
}

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await unwrapApiData<unknown>(await recipesApi.delete(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
