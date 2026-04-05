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

export type CreateProduct = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'recipe'>
export type UpdateProduct = Partial<CreateProduct>

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      return unwrapApiList<Product>(await productsApi.getAll())
    },
  })
}

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      return unwrapApiData<Product>(await productsApi.getById(id))
    },
    enabled: !!id,
  })
}

export const useLowStockProducts = () => {
  return useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: async () => {
      return unwrapApiList<Product>(await productsApi.getLowStock())
    },
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (product: CreateProduct) => productsApi.create(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProduct }) => 
      productsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] })
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
