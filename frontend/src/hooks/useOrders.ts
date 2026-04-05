import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, unwrapApiList, unwrapApiData } from '@/services/api'

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
  /** DB: order_status — draft | scheduled | billed | cancelled */
  status: 'draft' | 'scheduled' | 'billed' | 'cancelled'
  scheduled_for: string | null
  total_amount: number | null
  created_by?: string
  created_at: string
  billed_at?: string | null
  /** Optional legacy / future API fields */
  customer_name?: string | null
  customer_phone?: string | null
  delivery_date?: string
  delivery_time?: string | null
  advance_paid?: number | null
  notes?: string | null
  updated_at?: string
  items?: OrderItem[]
}

/** Backend POST /orders currently accepts `scheduled_for`; items are added via separate routes. */
export type CreateOrder = {
  scheduled_for?: string | null
  items?: Array<{ product_id: string; quantity: number; unit_price: number }>
}
export type UpdateOrder = Partial<CreateOrder>

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      return unwrapApiList<Order>(await ordersApi.getAll())
    },
  })
}

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      return unwrapApiData<Order>(await ordersApi.getById(id))
    },
    enabled: !!id,
  })
}

export const useOrdersByStatus = (status: string) => {
  return useQuery({
    queryKey: ['orders', 'status', status],
    queryFn: async () => {
      return unwrapApiList<Order>(await ordersApi.getByStatus(status))
    },
    enabled: !!status,
  })
}

export const useTodaysOrders = () => {
  return useQuery({
    queryKey: ['orders', 'today'],
    queryFn: async () => {
      return unwrapApiList<Order>(await ordersApi.getToday())
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
