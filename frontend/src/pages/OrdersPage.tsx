import { useState } from 'react'
import { Plus, Search, ClipboardList, Phone, Calendar, IndianRupee } from 'lucide-react'
import {
  useOrders,
  useOrder,
  useCreateOrder,
  useUpdateOrder,
  useUpdateOrderStatus,
  useDeleteOrder,
  useAddOrderItem,
  useRemoveOrderItem,
  useBillOrder,
} from '@/hooks/useOrders'
import { useProducts } from '@/hooks/useProducts'
import type { Order } from '@/hooks/useOrders'
import { SimpleModal } from '@/components/admin/SimpleModal'
import { withAdminToast } from '@/lib/adminToast'
import { toast } from 'sonner'

type OrderStatus = 'draft' | 'scheduled' | 'billed' | 'cancelled'

const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-on-surface-tertiary/20', text: 'text-on-surface-secondary' },
  scheduled: { bg: 'bg-info/20', text: 'text-info' },
  billed: { bg: 'bg-success/20', text: 'text-success' },
  cancelled: { bg: 'bg-error/20', text: 'text-error' },
}

function orderDisplayTitle(order: Order): string {
  const name = order.customer_name?.trim()
  if (name) return name
  return `Order ${order.id.slice(0, 8)}…`
}

function orderWhenIso(order: Order): string {
  return order.scheduled_for ?? order.delivery_date ?? order.created_at
}

function toLocalDatetimeValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders()
  const { data: products = [] } = useProducts()
  const createOrder = useCreateOrder()
  const updateOrder = useUpdateOrder()
  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()
  const addItem = useAddOrderItem()
  const removeItem = useRemoveOrderItem()
  const billOrder = useBillOrder()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [detailId, setDetailId] = useState<string | null>(null)
  const { data: detailOrder, refetch: refetchDetail } = useOrder(detailId ?? '')

  const [newScheduled, setNewScheduled] = useState('')
  const [showNewOrder, setShowNewOrder] = useState(false)

  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [editScheduled, setEditScheduled] = useState('')

  const [statusOrder, setStatusOrder] = useState<Order | null>(null)
  const [nextStatus, setNextStatus] = useState<OrderStatus>('draft')

  const [addProductId, setAddProductId] = useState('')
  const [addQty, setAddQty] = useState('1')

  const q = searchQuery.trim().toLowerCase()

  const filteredOrders = orders.filter((order) => {
    const title = orderDisplayTitle(order).toLowerCase()
    const phone = (order.customer_phone ?? '').toLowerCase()
    const idPart = (order.id ?? '').toLowerCase()
    const matchesSearch = !q || title.includes(q) || phone.includes(q) || idPart.includes(q)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const closeDetail = () => {
    setDetailId(null)
    setAddProductId('')
    setAddQty('1')
  }

  const handleNewOrder = async () => {
    try {
      const payload =
        newScheduled.trim() === ''
          ? {}
          : { scheduled_for: new Date(newScheduled).toISOString() }
      const created = await withAdminToast(createOrder.mutateAsync(payload), 'Draft order created')
      setShowNewOrder(false)
      setNewScheduled('')
      setDetailId(created.id)
    } catch {
      /* error toasted */
    }
  }

  const handleSaveEdit = async () => {
    if (!editOrder) return
    try {
      const iso =
        editScheduled.trim() === '' ? null : new Date(editScheduled).toISOString()
      await withAdminToast(
        updateOrder.mutateAsync({
          id: editOrder.id,
          data: { scheduled_for: iso },
        }),
        'Order schedule updated'
      )
      setEditOrder(null)
      if (detailId === editOrder.id) await refetchDetail()
    } catch {
      /* error toasted */
    }
  }

  const handleStatusSave = async () => {
    if (!statusOrder) return
    try {
      await withAdminToast(
        updateStatus.mutateAsync({ id: statusOrder.id, status: nextStatus }),
        'Order status updated'
      )
      setStatusOrder(null)
      if (detailId === statusOrder.id) await refetchDetail()
    } catch {
      /* error toasted */
    }
  }

  const handleDeleteOrder = async (order: Order) => {
    if (!confirm('Delete this order? Billed orders cannot be deleted.')) return
    try {
      await withAdminToast(deleteOrder.mutateAsync(order.id), 'Order deleted')
      if (detailId === order.id) closeDetail()
    } catch {
      /* error toasted */
    }
  }

  const handleAddLine = async () => {
    if (!detailId || !detailOrder) return
    const pid = addProductId.trim()
    const qn = parseInt(addQty, 10)
    if (!pid || !Number.isFinite(qn) || qn <= 0) {
      toast.warning('Select a product and enter a valid quantity.')
      return
    }
    try {
      await withAdminToast(
        addItem.mutateAsync({ orderId: detailId, product_id: pid, quantity: qn }),
        'Line item added'
      )
      setAddQty('1')
      await refetchDetail()
    } catch {
      /* error toasted */
    }
  }

  const handleRemoveLine = async (itemId: string) => {
    if (!detailId) return
    try {
      await withAdminToast(
        removeItem.mutateAsync({ orderId: detailId, itemId }),
        'Line item removed'
      )
      await refetchDetail()
    } catch {
      /* error toasted */
    }
  }

  const handleBill = async () => {
    if (!detailId) return
    if (!confirm('Bill this order? This will consume inventory (FIFO).')) return
    try {
      const out = await withAdminToast(billOrder.mutateAsync(detailId), 'Order billed successfully')
      await refetchDetail()
      const s = out?.summary as { profit?: number } | undefined
      if (s && typeof s.profit === 'number' && Number.isFinite(s.profit)) {
        toast.info(`Profit: ₹${s.profit.toFixed(2)}`, { duration: 5000 })
      }
    } catch {
      /* error toasted */
    }
  }

  const busy =
    createOrder.isPending ||
    updateOrder.isPending ||
    updateStatus.isPending ||
    deleteOrder.isPending ||
    addItem.isPending ||
    removeItem.isPending ||
    billOrder.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-on-surface">Orders</h1>
          <p className="text-on-surface-secondary mt-1">Manage customer orders and deliveries</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setNewScheduled('')
            setShowNewOrder(true)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-md gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          New Order
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-tertiary" size={20} />
          <input
            type="text"
            placeholder="Search by name, phone, or order id..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-md bg-surface text-on-surface placeholder:text-on-surface-tertiary focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="billed">Billed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList className="mx-auto mb-4 text-on-surface-tertiary" size={48} />
          <h3 className="text-lg font-semibold mb-2">No orders found</h3>
          <p className="text-on-surface-secondary">
            {searchQuery || statusFilter !== 'all' ? 'Try different filters' : 'Create your first order to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = order.status as OrderStatus
            const colors = statusColors[status] ?? statusColors.draft
            const when = orderWhenIso(order)
            const total = Number(order.total_amount ?? 0)
            const advance = order.advance_paid != null ? Number(order.advance_paid) : null

            return (
              <div key={order.id} className="card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{orderDisplayTitle(order)}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${colors.bg} ${colors.text}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-on-surface-secondary">
                      {order.customer_phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {order.customer_phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(when).toLocaleString()}
                        {order.delivery_time && ` · ${order.delivery_time}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-on-surface-secondary">Total</p>
                      <p className="text-xl font-bold text-primary flex items-center justify-end">
                        <IndianRupee size={18} />
                        {total.toFixed(2)}
                      </p>
                    </div>
                    {advance != null && (
                      <div className="text-right">
                        <p className="text-sm text-on-surface-secondary">Advance</p>
                        <p className="text-lg font-semibold flex items-center justify-end">
                          <IndianRupee size={16} />
                          {advance}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {order.notes && (
                  <p className="mt-3 text-sm text-on-surface-secondary bg-surface p-3 rounded-md">Note: {order.notes}</p>
                )}
                <div className="mt-4 pt-4 border-t border-surface-container flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDetailId(order.id)
                    }}
                    className="py-2 px-4 text-sm font-medium rounded-md bg-surface hover:bg-surface-container transition-colors"
                  >
                    View Details
                  </button>
                  {order.status !== 'billed' && order.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusOrder(order)
                        setNextStatus(order.status as OrderStatus)
                      }}
                      className="py-2 px-4 text-sm font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      Update Status
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditOrder(order)
                      setEditScheduled(toLocalDatetimeValue(order.scheduled_for))
                    }}
                    className="py-2 px-4 text-sm font-medium rounded-md bg-surface hover:bg-surface-container transition-colors"
                  >
                    Edit
                  </button>
                  {order.status !== 'billed' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order)}
                      className="py-2 px-4 text-sm font-medium rounded-md text-error hover:bg-error/10 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <SimpleModal
        open={showNewOrder}
        title="New order"
        onClose={() => setShowNewOrder(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewOrder(false)}
              className="px-4 py-2 rounded-md bg-surface hover:bg-surface-container text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleNewOrder}
              disabled={busy}
              className="px-4 py-2 rounded-md gradient-primary text-on-primary text-sm font-medium disabled:opacity-50"
            >
              Create draft
            </button>
          </>
        }
      >
        <p className="text-sm text-on-surface-secondary mb-3">
          Creates POST /api/orders (draft). Add line items from order details.
        </p>
        <label className="block text-sm font-medium text-on-surface-secondary">Scheduled for (optional)</label>
        <input
          type="datetime-local"
          value={newScheduled}
          onChange={(e) => setNewScheduled(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-md bg-surface border border-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </SimpleModal>

      <SimpleModal
        open={!!editOrder}
        title="Edit order"
        onClose={() => setEditOrder(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditOrder(null)}
              className="px-4 py-2 rounded-md bg-surface hover:bg-surface-container text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={busy}
              className="px-4 py-2 rounded-md gradient-primary text-on-primary text-sm font-medium disabled:opacity-50"
            >
              Save
            </button>
          </>
        }
      >
        <p className="text-sm text-on-surface-secondary mb-3">PUT /api/orders/:id — scheduled_for only.</p>
        <label className="block text-sm font-medium text-on-surface-secondary">Scheduled for</label>
        <input
          type="datetime-local"
          value={editScheduled}
          onChange={(e) => setEditScheduled(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-md bg-surface border border-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </SimpleModal>

      <SimpleModal
        open={!!statusOrder}
        title="Update status"
        onClose={() => setStatusOrder(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setStatusOrder(null)}
              className="px-4 py-2 rounded-md bg-surface hover:bg-surface-container text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStatusSave}
              disabled={busy}
              className="px-4 py-2 rounded-md gradient-primary text-on-primary text-sm font-medium disabled:opacity-50"
            >
              Save
            </button>
          </>
        }
      >
        <label className="block text-sm font-medium text-on-surface-secondary">Status</label>
        <select
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
          className="mt-1 w-full px-3 py-2 rounded-md bg-surface border border-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
        >
          <option value="draft">draft</option>
          <option value="scheduled">scheduled</option>
          <option value="cancelled">cancelled</option>
        </select>
        <p className="text-xs text-on-surface-tertiary mt-2">
          Use “Bill order” in details to set billed (consumes inventory).
        </p>
      </SimpleModal>

      <SimpleModal
        open={!!detailId}
        title={detailOrder ? orderDisplayTitle(detailOrder) : 'Order'}
        onClose={closeDetail}
        footer={
          <button
            type="button"
            onClick={closeDetail}
            className="px-4 py-2 rounded-md bg-surface hover:bg-surface-container text-sm font-medium"
          >
            Close
          </button>
        }
      >
        {!detailOrder ? (
          <p className="text-sm text-on-surface-secondary">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div className="text-sm">
              <span className="text-on-surface-secondary">Status:</span>{' '}
              <span className="font-medium capitalize">{detailOrder.status}</span>
              <span className="mx-2 text-on-surface-tertiary">·</span>
              <span className="text-on-surface-secondary">Total:</span>{' '}
              <span className="font-medium">₹{Number(detailOrder.total_amount ?? 0).toFixed(2)}</span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-on-surface-secondary mb-2">Line items</h4>
              <ul className="text-sm space-y-2">
                {(detailOrder.items ?? []).map((line) => (
                  <li key={line.id ?? line.product_id} className="flex justify-between gap-2 items-center">
                    <span>
                      {line.product?.name ?? line.product_id} × {line.quantity} @ ₹
                      {line.unit_price.toFixed(2)}
                    </span>
                    {detailOrder.status !== 'billed' && line.id && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id!)}
                        disabled={busy}
                        className="text-error text-xs font-medium hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
                {(detailOrder.items?.length ?? 0) === 0 && (
                  <li className="text-on-surface-tertiary">No items yet.</li>
                )}
              </ul>
            </div>

            {detailOrder.status !== 'billed' && detailOrder.status !== 'cancelled' && (
              <div className="border-t border-surface-container pt-3 space-y-2">
                <h4 className="text-sm font-medium text-on-surface-secondary">Add item (POST /orders/:id/items)</h4>
                <div className="flex flex-wrap gap-2 items-end">
                  <select
                    value={addProductId}
                    onChange={(e) => setAddProductId(e.target.value)}
                    className="flex-1 min-w-[8rem] px-2 py-2 rounded-md bg-surface border border-surface-container text-sm"
                  >
                    <option value="">Product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={addQty}
                    onChange={(e) => setAddQty(e.target.value)}
                    className="w-20 px-2 py-2 rounded-md bg-surface border border-surface-container text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddLine}
                    disabled={busy}
                    className="px-3 py-2 rounded-md bg-primary/10 text-primary text-sm font-medium disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleBill}
                  disabled={busy || (detailOrder.items?.length ?? 0) === 0}
                  className="w-full mt-2 py-2 rounded-md gradient-primary text-on-primary text-sm font-medium disabled:opacity-50"
                >
                  Bill order
                </button>
              </div>
            )}
          </div>
        )}
      </SimpleModal>
    </div>
  )
}
