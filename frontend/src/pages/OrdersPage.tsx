import { useState } from 'react'
import { Plus, Search, ClipboardList, Phone, Calendar, IndianRupee } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-info/20', text: 'text-info' },
  confirmed: { bg: 'bg-primary/20', text: 'text-primary' },
  preparing: { bg: 'bg-warning/20', text: 'text-warning' },
  ready: { bg: 'bg-success/20', text: 'text-success' },
  delivered: { bg: 'bg-on-surface-tertiary/20', text: 'text-on-surface-secondary' },
  cancelled: { bg: 'bg-error/20', text: 'text-error' },
}

export function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone?.includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-on-surface">
            Orders
          </h1>
          <p className="text-on-surface-secondary mt-1">
            Manage customer orders and deliveries
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity">
          <Plus size={20} />
          New Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-tertiary" size={20} />
          <input
            type="text"
            placeholder="Search by name or phone..."
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
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Content */}
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
            const colors = statusColors[status] || statusColors.pending
            return (
              <div key={order.id} className="card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{order.customer_name}</h3>
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
                        {new Date(order.delivery_date).toLocaleDateString()}
                        {order.delivery_time && ` at ${order.delivery_time}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-on-surface-secondary">Total</p>
                      <p className="text-xl font-bold text-primary flex items-center">
                        <IndianRupee size={18} />
                        {order.total_amount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-on-surface-secondary">Advance</p>
                      <p className="text-lg font-semibold flex items-center">
                        <IndianRupee size={16} />
                        {order.advance_paid}
                      </p>
                    </div>
                  </div>
                </div>
                {order.notes && (
                  <p className="mt-3 text-sm text-on-surface-secondary bg-surface p-3 rounded-md">
                    Note: {order.notes}
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-surface-container flex flex-wrap gap-2">
                  <button className="py-2 px-4 text-sm font-medium rounded-md bg-surface hover:bg-surface-container transition-colors">
                    View Details
                  </button>
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <button className="py-2 px-4 text-sm font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                      Update Status
                    </button>
                  )}
                  <button className="py-2 px-4 text-sm font-medium rounded-md bg-surface hover:bg-surface-container transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
