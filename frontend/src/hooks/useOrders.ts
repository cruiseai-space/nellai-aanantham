import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, unwrapApiList, unwrapApiData, unwrapBillOrder } from '@/services/api'

export interface OrderItem {
  id?: string
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
  /** DB: `order_status` — draft | scheduled | billed | cancelled */
  status: 'draft' | 'scheduled' | 'billed' | 'cancelled'
  scheduled_for: string | null
  total_amount: number | null
  created_by?: string
  created_at: string
  billed_at?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  delivery_date?: string
  delivery_time?: string | null
  advance_paid?: number | null
  notes?: string | null
  updated_at?: string
  items?: OrderItem[]
}

/** Backend POST /orders accepts `scheduled_for` only. */
export type CreateOrder = {
  scheduled_for?: string | null
}

export type UpdateOrder = {
  status?: Order['status']
  scheduled_for?: string | null
}

function normalizeOrder(raw: Record<string, unknown>): Order {
  const orderItems = (raw.order_items as Array<Record<string, unknown>> | undefined) ?? []
  const items: OrderItem[] = orderItems.map((oi) => {
    const prod = oi.products as Record<string, unknown> | undefined
    const salePrice = prod?.sale_price
    const priceAtSale = oi.price_at_sale
    const unit = parseFloat(
      String(priceAtSale ?? salePrice ?? 0)
    )
    return {
      id: oi.id != null ? String(oi.id) : undefined,
      product_id: String(oi.product_id),
      quantity: Number(oi.quantity ?? 0),
      unit_price: unit,
      product: prod
        ? {
            name: String(prod.name ?? ''),
            price: parseFloat(String(prod.sale_price ?? 0)),
          }
        : undefined,
    }
  })
  return {
    id: String(raw.id),
    status: raw.status as Order['status'],
    scheduled_for: raw.scheduled_for != null ? String(raw.scheduled_for) : null,
    total_amount: raw.total_amount != null ? Number(raw.total_amount) : null,
    created_by: raw.created_by != null ? String(raw.created_by) : undefined,
    created_at: String(raw.created_at ?? ''),
    billed_at: raw.billed_at != null ? String(raw.billed_at) : undefined,
    customer_name:
      raw.customer_name != null ? String(raw.customer_name) : undefined,
    customer_phone:
      raw.customer_phone != null ? String(raw.customer_phone) : undefined,
    delivery_date:
      raw.delivery_date != null
        ? String(raw.delivery_date)
        : undefined,
    delivery_time:
      raw.delivery_time != null ? String(raw.delivery_time) : undefined,
    advance_paid:
      raw.advance_paid != null ? Number(raw.advance_paid) : undefined,
    notes: raw.notes != null ? String(raw.notes) : undefined,
    updated_at: raw.updated_at != null ? String(raw.updated_at) : undefined,
    items,
  }
}

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const list = unwrapApiList<Record<string, unknown>>(await ordersApi.getAll())
      return list.map(normalizeOrder)
    },
  })
}

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const raw = unwrapApiData<Record<string, unknown>>(await ordersApi.getById(id))
      return normalizeOrder(raw)
    },
    enabled: !!id,
  })
}

export const useOrdersByStatus = (status: string) => {
  return useQuery({
    queryKey: ['orders', 'status', status],
    queryFn: async () => {
      const list = unwrapApiList<Record<string, unknown>>(
        await ordersApi.getByStatus(status)
      )
      return list.map(normalizeOrder)
    },
    enabled: !!status,
  })
}

export const useTodaysOrders = () => {
  return useQuery({
    queryKey: ['orders', 'today'],
    queryFn: async () => {
      const list = unwrapApiList<Record<string, unknown>>(await ordersApi.getToday())
      return list.map(normalizeOrder)
    },
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (order: CreateOrder) => {
      const res = await ordersApi.create(order)
      return normalizeOrder(unwrapApiData<Record<string, unknown>>(res))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useUpdateOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOrder }) =>
      ordersApi.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      await queryClient.invalidateQueries({ queryKey: ['orders', variables.id] })
    },
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      await queryClient.invalidateQueries({ queryKey: ['orders', variables.id] })
    },
  })
}

export const useDeleteOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await unwrapApiData<unknown>(await ordersApi.delete(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useAddOrderItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      orderId,
      product_id,
      quantity,
    }: {
      orderId: string
      product_id: string
      quantity: number
    }) => {
      const res = await ordersApi.addItem(orderId, { product_id, quantity })
      return unwrapApiData<Record<string, unknown>>(res)
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      await queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] })
    },
  })
}

export const useRemoveOrderItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      orderId,
      itemId,
    }: {
      orderId: string
      itemId: string
    }) => {
      await unwrapApiData<unknown>(await ordersApi.removeItem(orderId, itemId))
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      await queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] })
    },
  })
}

export const useBillOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await ordersApi.bill(orderId)
      return unwrapBillOrder(res)
    },
    onSuccess: async (_, orderId) => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      await queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
      await queryClient.invalidateQueries({ queryKey: ['batches'] })
      await queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
  })
}
