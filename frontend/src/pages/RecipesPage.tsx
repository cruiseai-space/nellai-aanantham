import { useState } from 'react'
import { Plus, Search, ChefHat, Clock, CircleDollarSign } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'

export function RecipesPage() {
  const { data: recipes = [], isLoading } = useRecipes()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-on-surface">
            Recipes
          </h1>
          <p className="text-on-surface-secondary mt-1">
            Manage your bakery recipes and formulations
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity">
          <Plus size={20} />
          Add Recipe
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-tertiary" size={20} />
        <input
          type="text"
          placeholder="Search recipes..."
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
      ) : filteredRecipes.length === 0 ? (
        <div className="card p-12 text-center">
          <ChefHat className="mx-auto mb-4 text-on-surface-tertiary" size={48} />
          <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
          <p className="text-on-surface-secondary">
            {searchQuery ? 'Try a different search term' : 'Add your first recipe to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{recipe.name}</h3>
                  <p className="text-sm text-on-surface-secondary">
                    {recipe.category || 'Uncategorized'}
                  </p>
                </div>
                <span
                  className={`
                    px-2 py-1 text-xs font-medium rounded
                    ${recipe.is_active ? 'bg-success/20 text-success' : 'bg-on-surface-tertiary/20 text-on-surface-tertiary'}
                  `}
                >
                  {recipe.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {recipe.description && (
                <p className="text-sm text-on-surface-secondary mb-4 line-clamp-2">
                  {recipe.description}
                </p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <ChefHat size={16} className="text-on-surface-tertiary" />
                  <span>Yield: {recipe.yield_quantity} {recipe.yield_unit}</span>
                </div>
                {recipe.preparation_time && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-on-surface-tertiary" />
                    <span>Prep: {recipe.preparation_time} mins</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CircleDollarSign size={16} className="text-on-surface-tertiary" />
                  <span>{recipe.ingredients?.length || 0} ingredients</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-surface-container flex gap-2">
                <button className="flex-1 py-2 px-3 text-sm font-medium rounded-md bg-surface hover:bg-surface-container transition-colors">
                  Edit
                </button>
                <button className="flex-1 py-2 px-3 text-sm font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
