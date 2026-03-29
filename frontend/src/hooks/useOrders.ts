import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/services/api'

export interface OrderItem {
  product_id: string
  quantity: number
  unit_price: number
  product?: {
    name: string
    price: number
  }
}

export interface Order {
  id: string
  customer_name: string
  customer_phone: string | null
  delivery_date: string
  delivery_time: string | null
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  total_amount: number
  advance_paid: number
  notes: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export type CreateOrder = Omit<Order, 'id' | 'created_at' | 'updated_at'> & {
  items: Array<{ product_id: string; quantity: number; unit_price: number }>
}
export type UpdateOrder = Partial<CreateOrder>

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await ordersApi.getAll()
      return data as Order[]
    },
  })
}

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data } = await ordersApi.getById(id)
      return data as Order
    },
    enabled: !!id,
  })
}

export const useOrdersByStatus = (status: string) => {
  return useQuery({
    queryKey: ['orders', 'status', status],
    queryFn: async () => {
      const { data } = await ordersApi.getByStatus(status)
      return data as Order[]
    },
    enabled: !!status,
  })
}

export const useTodaysOrders = () => {
  return useQuery({
    queryKey: ['orders', 'today'],
    queryFn: async () => {
      const { data } = await ordersApi.getToday()
      return data as Order[]
    },
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (order: CreateOrder) => ordersApi.create(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useUpdateOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrder }) => 
      ordersApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders', variables.id] })
    },
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useDeleteOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
