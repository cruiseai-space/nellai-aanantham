import { useState } from 'react'
import { Plus, Search, ShoppingCart, IndianRupee, AlertTriangle } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'

export function ProductsPage() {
  const { data: products = [], isLoading } = useProducts()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-on-surface">
            Products
          </h1>
          <p className="text-on-surface-secondary mt-1">
            Manage your bakery products catalog
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity">
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-tertiary" size={20} />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-md bg-surface text-on-surface placeholder:text-on-surface-tertiary focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingCart className="mx-auto mb-4 text-on-surface-tertiary" size={48} />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-on-surface-secondary">
            {searchQuery ? 'Try a different search term' : 'Add your first product to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const isLowStock = product.current_stock <= product.min_stock
            return (
              <div key={product.id} className="card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-xs text-on-surface-secondary">
                      {product.category || 'Uncategorized'}
                    </p>
                  </div>
                  {isLowStock && (
                    <div className="p-1.5 rounded-full bg-warning/10">
                      <AlertTriangle className="text-warning" size={14} />
                    </div>
                  )}
                </div>
                {product.description && (
                  <p className="text-sm text-on-surface-secondary mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-primary flex items-center">
                    <IndianRupee size={20} />
                    {product.price}
                  </span>
                  <span
                    className={`
                      px-2 py-1 text-xs font-medium rounded
                      ${product.is_active ? 'bg-success/20 text-success' : 'bg-on-surface-tertiary/20 text-on-surface-tertiary'}
                    `}
                  >
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-on-surface-secondary mb-4">
                  <span className={isLowStock ? 'text-warning font-medium' : ''}>
                    Stock: {product.current_stock}
                  </span>
                  <span className="mx-2">•</span>
                  <span>Min: {product.min_stock}</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-3 text-sm font-medium rounded-md bg-surface hover:bg-surface-container transition-colors">
                    Edit
                  </button>
                  <button className="flex-1 py-2 px-3 text-sm font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    Stock
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
