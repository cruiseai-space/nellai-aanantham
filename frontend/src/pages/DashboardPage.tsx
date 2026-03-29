import {
  Package,
  ShoppingCart,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { useLowStockIngredients } from '@/hooks/useIngredients'
import { useTodaysOrders } from '@/hooks/useOrders'
import { useProducts } from '@/hooks/useProducts'
import { useExpiringSoonBatches } from '@/hooks/useBatches'

export function DashboardPage() {
  const { data: lowStockIngredients = [] } = useLowStockIngredients()
  const { data: todaysOrders = [] } = useTodaysOrders()
  const { data: products = [] } = useProducts()
  const { data: expiringBatches = [] } = useExpiringSoonBatches()

  const stats = [
    {
      label: 'Low Stock Items',
      value: lowStockIngredients.length,
      icon: Package,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: "Today's Orders",
      value: todaysOrders.length,
      icon: ClipboardList,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Active Products',
      value: products.filter(p => p.is_active).length,
      icon: ShoppingCart,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Expiring Soon',
      value: expiringBatches.length,
      icon: AlertTriangle,
      color: 'text-error',
      bgColor: 'bg-error/10',
    },
  ]

  const pendingOrders = todaysOrders.filter(o => o.status === 'pending' || o.status === 'confirmed')

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-on-surface">
          Dashboard
        </h1>
        <p className="text-on-surface-secondary mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="bento-grid">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-on-surface-secondary">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-md ${stat.bgColor}`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Alerts Section */}
      {(lowStockIngredients.length > 0 || expiringBatches.length > 0) && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <AlertTriangle className="text-warning" size={20} />
            Alerts
          </h2>
          <div className="space-y-3">
            {lowStockIngredients.slice(0, 3).map((ingredient) => (
              <div
                key={ingredient.id}
                className="flex items-center justify-between p-3 bg-warning/5 rounded-md"
              >
                <div>
                  <p className="font-medium">{ingredient.name}</p>
                  <p className="text-sm text-on-surface-secondary">
                    Stock: {ingredient.current_stock} {ingredient.unit} (min: {ingredient.min_stock})
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-warning/20 text-warning rounded">
                  Low Stock
                </span>
              </div>
            ))}
            {expiringBatches.slice(0, 3).map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between p-3 bg-error/5 rounded-md"
              >
                <div>
                  <p className="font-medium">Batch #{batch.batch_number || batch.id.slice(0, 8)}</p>
                  <p className="text-sm text-on-surface-secondary">
                    Expires: {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-error/20 text-error rounded">
                  Expiring
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Orders */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Calendar className="text-primary" size={20} />
          Today's Orders
        </h2>
        {pendingOrders.length > 0 ? (
          <div className="space-y-3">
            {pendingOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-surface rounded-md"
              >
                <div>
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="text-sm text-on-surface-secondary">
                    Delivery: {order.delivery_time || 'Anytime'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">₹{order.total_amount}</p>
                  <span
                    className={`
                      px-2 py-1 text-xs font-medium rounded
                      ${order.status === 'confirmed' ? 'bg-success/20 text-success' : 'bg-info/20 text-info'}
                    `}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-on-surface-secondary py-8">
            No pending orders for today
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <TrendingUp className="text-success" size={20} />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/orders"
            className="p-4 bg-primary/10 rounded-md text-center hover:bg-primary/20 transition-colors"
          >
            <ClipboardList className="mx-auto mb-2 text-primary" size={24} />
            <span className="text-sm font-medium">New Order</span>
          </a>
          <a
            href="/ingredients"
            className="p-4 bg-success/10 rounded-md text-center hover:bg-success/20 transition-colors"
          >
            <Package className="mx-auto mb-2 text-success" size={24} />
            <span className="text-sm font-medium">Add Stock</span>
          </a>
          <a
            href="/products"
            className="p-4 bg-info/10 rounded-md text-center hover:bg-info/20 transition-colors"
          >
            <ShoppingCart className="mx-auto mb-2 text-info" size={24} />
            <span className="text-sm font-medium">Products</span>
          </a>
          <a
            href="/batches"
            className="p-4 bg-warning/10 rounded-md text-center hover:bg-warning/20 transition-colors"
          >
            <AlertTriangle className="mx-auto mb-2 text-warning" size={24} />
            <span className="text-sm font-medium">Check Batches</span>
          </a>
        </div>
      </div>
    </div>
  )
}
