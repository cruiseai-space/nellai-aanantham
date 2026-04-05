import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi, unwrapApiList, unwrapApiData } from '@/services/api'

export interface Product {
  id: string
  name: string
  description: string | null
  recipe_id: string | null
  price: number
  category: string | null
  current_stock: number
  min_stock: number
  is_active: boolean
  created_at: string
  updated_at: string
  recipe?: {
    name: string
    yield_quantity: number
  }
}

export type CreateProductPayload = {
  name: string
  recipe_id: string
  sale_price: number
}

export type UpdateProductPayload = Partial<CreateProductPayload>

function mapProduct(raw: Record<string, unknown>): Product {
  const recipesJoin = raw.recipes
  const recipeObj = Array.isArray(recipesJoin)
    ? (recipesJoin[0] as Record<string, unknown> | undefined)
    : (recipesJoin as Record<string, unknown> | null | undefined)
  return {
    id: String(raw.id),
    name: String(raw.name),
    description: raw.description != null ? String(raw.description) : null,
    recipe_id: raw.recipe_id != null ? String(raw.recipe_id) : null,
    price: parseFloat(String(raw.sale_price ?? 0)),
    category: raw.category != null ? String(raw.category) : null,
    current_stock: raw.current_stock != null ? Number(raw.current_stock) : 0,
    min_stock: raw.min_stock != null ? Number(raw.min_stock) : 0,
    is_active: raw.is_active !== false,
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? raw.created_at ?? ''),
    recipe: recipeObj
      ? {
          name: String(recipeObj.name ?? ''),
          yield_quantity:
            recipeObj.yield_quantity != null ? Number(recipeObj.yield_quantity) : 1,
        }
      : undefined,
  }
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const list = unwrapApiList<Record<string, unknown>>(await productsApi.getAll())
      return list.map(mapProduct)
    },
  })
}

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const raw = unwrapApiData<Record<string, unknown>>(await productsApi.getById(id))
      return mapProduct(raw)
    },
    enabled: !!id,
  })
}

export const useLowStockProducts = () => {
  return useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: async () => {
      const list = unwrapApiList<Record<string, unknown>>(await productsApi.getLowStock())
      return list.map(mapProduct)
    },
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (product: CreateProductPayload) => {
      const res = await productsApi.create(product)
      return mapProduct(unwrapApiData<Record<string, unknown>>(res))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductPayload }) => {
      const res = await productsApi.update(id, data)
      return mapProduct(unwrapApiData<Record<string, unknown>>(res))
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] })
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await unwrapApiData<unknown>(await productsApi.delete(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
