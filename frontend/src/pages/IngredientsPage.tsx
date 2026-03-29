import { useState } from 'react'
import { Plus, Search, Package, AlertTriangle } from 'lucide-react'
import { useIngredients } from '@/hooks/useIngredients'

export function IngredientsPage() {
  const { data: ingredients = [], isLoading } = useIngredients()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredIngredients = ingredients.filter(
    (ingredient) =>
      ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ingredient.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-on-surface">
            Ingredients
          </h1>
          <p className="text-on-surface-secondary mt-1">
            Manage your bakery ingredients inventory
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity">
          <Plus size={20} />
          Add Ingredient
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-tertiary" size={20} />
        <input
          type="text"
          placeholder="Search ingredients..."
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
      ) : filteredIngredients.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="mx-auto mb-4 text-on-surface-tertiary" size={48} />
          <h3 className="text-lg font-semibold mb-2">No ingredients found</h3>
          <p className="text-on-surface-secondary">
            {searchQuery ? 'Try a different search term' : 'Add your first ingredient to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredIngredients.map((ingredient) => {
            const isLowStock = ingredient.current_stock <= ingredient.min_stock
            return (
              <div key={ingredient.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{ingredient.name}</h3>
                    <p className="text-sm text-on-surface-secondary">
                      {ingredient.category || 'Uncategorized'}
                    </p>
                  </div>
                  {isLowStock && (
                    <div className="p-2 rounded-full bg-warning/10">
                      <AlertTriangle className="text-warning" size={16} />
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-on-surface-secondary">Current Stock</span>
                    <span className={`font-medium ${isLowStock ? 'text-warning' : ''}`}>
                      {ingredient.current_stock} {ingredient.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-secondary">Min Stock</span>
                    <span>{ingredient.min_stock} {ingredient.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-secondary">Cost/Unit</span>
                    <span>₹{ingredient.cost_per_unit}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-surface-container flex gap-2">
                  <button className="flex-1 py-2 px-3 text-sm font-medium rounded-md bg-surface hover:bg-surface-container transition-colors">
                    Edit
                  </button>
                  <button className="flex-1 py-2 px-3 text-sm font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    Add Stock
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
