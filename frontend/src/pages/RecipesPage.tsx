import { useState, useEffect, useRef } from 'react'
import { Plus, Search, ChefHat, Clock, CircleDollarSign, Trash2 } from 'lucide-react'
import {
  useRecipes,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useRecipeCost,
} from '@/hooks/useRecipes'
import { useIngredients } from '@/hooks/useIngredients'
import { SimpleModal } from '@/components/admin/SimpleModal'
import type { Recipe, RecipeItemPayload } from '@/hooks/useRecipes'
import { withAdminToast } from '@/lib/adminToast'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { toast } from 'sonner'

type Line = { ingredient_id: string; quantity_required: string }

function linesFromRecipe(r: Recipe): Line[] {
  const ing = r.ingredients ?? []
  if (ing.length === 0) return [{ ingredient_id: '', quantity_required: '' }]
  return ing.map((i) => ({
    ingredient_id: i.ingredient_id,
    quantity_required: String(i.quantity),
  }))
}

export function RecipesPage() {
  const { data: recipes = [], isLoading } = useRecipes()
  const { data: ingredients = [] } = useIngredients()
  const createRecipe = useCreateRecipe()
  const updateRecipe = useUpdateRecipe()
  const deleteRecipe = useDeleteRecipe()

  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState<'add' | 'edit' | 'details' | null>(null)
  const [selected, setSelected] = useState<Recipe | null>(null)
  const [recipeName, setRecipeName] = useState('')
  const [lines, setLines] = useState<Line[]>([{ ingredient_id: '', quantity_required: '' }])
  const [formError, setFormError] = useState<string | null>(null)

  const costQuery = useRecipeCost(modal === 'details' && selected ? selected.id : '')
  const costErrorToasted = useRef(false)

  useEffect(() => {
    if (modal !== 'details') {
      costErrorToasted.current = false
      return
    }
    if (!costQuery.isError || !costQuery.error) {
      costErrorToasted.current = false
      return
    }
    if (costErrorToasted.current) return
    costErrorToasted.current = true
    toast.error(getApiErrorMessage(costQuery.error))
  }, [modal, selected?.id, costQuery.isError, costQuery.error])

  const resetForm = () => {
    setRecipeName('')
    setLines([{ ingredient_id: '', quantity_required: '' }])
    setFormError(null)
  }

  const closeModal = () => {
    setModal(null)
    setSelected(null)
    resetForm()
  }

  const openAdd = () => {
    resetForm()
    setModal('add')
  }

  const openEdit = (r: Recipe) => {
    setSelected(r)
    setRecipeName(r.name)
    setLines(linesFromRecipe(r))
    setFormError(null)
    setModal('edit')
  }

  const openDetails = (r: Recipe) => {
    setSelected(r)
    setFormError(null)
    setModal('details')
  }

  const addLine = () => {
    setLines((prev) => [...prev, { ingredient_id: '', quantity_required: '' }])
  }

  const setLine = (index: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  const removeLine = (index: number) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const parseItems = (): RecipeItemPayload[] | null => {
    const out: RecipeItemPayload[] = []
    for (const l of lines) {
      if (!l.ingredient_id.trim()) continue
      const q = parseFloat(l.quantity_required)
      if (!Number.isFinite(q) || q <= 0) {
        setFormError('Each line needs a valid positive quantity.')
        return null
      }
      out.push({ ingredient_id: l.ingredient_id, quantity_required: q })
    }
    return out
  }

  const handleCreate = async () => {
    setFormError(null)
    const n = recipeName.trim()
    if (!n) {
      setFormError('Recipe name is required.')
      return
    }
    const items = parseItems()
    if (items === null) return
    try {
      await withAdminToast(
        createRecipe.mutateAsync({ name: n, items: items.length ? items : undefined }),
        'Recipe created'
      )
      closeModal()
    } catch {
      /* error toasted */
    }
  }

  const handleUpdate = async () => {
    setFormError(null)
    if (!selected) return
    const n = recipeName.trim()
    if (!n) {
      setFormError('Recipe name is required.')
      return
    }
    const items = parseItems()
    if (items === null) return
    try {
      await withAdminToast(
        updateRecipe.mutateAsync({
          id: selected.id,
          data: { name: n, items },
        }),
        'Recipe updated'
      )
      closeModal()
    } catch {
      /* error toasted */
    }
  }

  const handleDelete = async (r: Recipe) => {
    if (!confirm(`Delete recipe "${r.name}"?`)) return
    try {
      await withAdminToast(deleteRecipe.mutateAsync(r.id), 'Recipe deleted')
    } catch {
      /* error toasted */
    }
  }

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (recipe.category?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  const saving = createRecipe.isPending || updateRecipe.isPending || deleteRecipe.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-on-surface">Recipes</h1>
          <p className="text-on-surface-secondary mt-1">Manage your bakery recipes and formulations</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-md gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Add Recipe
        </button>
      </div>

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
                  <p className="text-sm text-on-surface-secondary">{recipe.category || 'Uncategorized'}</p>
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
                <p className="text-sm text-on-surface-secondary mb-4 line-clamp-2">{recipe.description}</p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <ChefHat size={16} className="text-on-surface-tertiary" />
                  <span>
                    Yield: {recipe.yield_quantity} {recipe.yield_unit}
                  </span>
                </div>
                {recipe.preparation_time != null && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-on-surface-tertiary" />
                    <span>Prep: {recipe.preparation_time} mins</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CircleDollarSign size={16} className="text-on-surface-tertiary" />
                  <span>{recipe.ingredients?.length ?? 0} ingredients</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-surface-container flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(recipe)}
                  className="flex-1 min-w-[4rem] py-2 px-3 text-sm font-medium rounded-md bg-surface hover:bg-surface-container transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => openDetails(recipe)}
                  className="flex-1 min-w-[4rem] py-2 px-3 text-sm font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  View Details
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(recipe)}
                  className="py-2 px-3 text-sm font-medium rounded-md text-error hover:bg-error/10"
                  aria-label="Delete recipe"
                >
                  <Trash2 size={18} className="mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SimpleModal
        open={modal === 'add' || modal === 'edit'}
        wide
        title={modal === 'add' ? 'Add recipe' : 'Edit recipe'}
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-md bg-surface hover:bg-surface-container text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={modal === 'add' ? handleCreate : handleUpdate}
              disabled={saving}
              className="px-4 py-2 rounded-md gradient-primary text-on-primary text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {formError && <p className="text-error text-sm mb-3">{formError}</p>}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-on-surface-secondary">Name</label>
          <input
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-surface border border-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium text-on-surface-secondary">Ingredients</span>
            <button type="button" onClick={addLine} className="text-sm text-primary font-medium">
              + Add line
            </button>
          </div>
          {lines.map((line, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs text-on-surface-tertiary">Ingredient</label>
                <select
                  value={line.ingredient_id}
                  onChange={(e) => setLine(index, { ingredient_id: e.target.value })}
                  className="w-full mt-1 px-2 py-2 rounded-md bg-surface border border-surface-container text-on-surface text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="">Select…</option>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="text-xs text-on-surface-tertiary">Qty</label>
                <input
                  type="number"
                  min={0}
                  step="0.001"
                  value={line.quantity_required}
                  onChange={(e) => setLine(index, { quantity_required: e.target.value })}
                  className="w-full mt-1 px-2 py-2 rounded-md bg-surface border border-surface-container text-on-surface text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => removeLine(index)}
                className="mb-0.5 px-2 py-2 text-error text-sm rounded-md hover:bg-error/10"
                disabled={lines.length <= 1}
              >
                ✕
              </button>
            </div>
          ))}
          <p className="text-xs text-on-surface-tertiary">
            Edit sends a full replacement list to PUT /api/recipes/:id (empty lines are skipped).
          </p>
        </div>
      </SimpleModal>

      <SimpleModal open={modal === 'details'} title={selected?.name ?? 'Recipe'} onClose={closeModal}>
        {!selected ? null : (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-on-surface-secondary mb-2">Items</h4>
              <ul className="text-sm space-y-1">
                {(selected.ingredients ?? []).map((ri) => (
                  <li key={ri.ingredient_id} className="flex justify-between gap-2">
                    <span>{ri.ingredient?.name ?? ri.ingredient_id}</span>
                    <span className="text-on-surface-secondary shrink-0">
                      {ri.quantity} {ri.ingredient?.unit ?? ''}
                    </span>
                  </li>
                ))}
                {(selected.ingredients?.length ?? 0) === 0 && (
                  <li className="text-on-surface-tertiary">No items yet.</li>
                )}
              </ul>
            </div>
            <div className="border-t border-surface-container pt-3">
              <h4 className="text-sm font-medium text-on-surface-secondary mb-2">Cost (GET /recipes/:id/cost)</h4>
              {costQuery.isLoading && <p className="text-sm text-on-surface-tertiary">Loading…</p>}
              {costQuery.isError && (
                <p className="text-sm text-error">
                  {costQuery.error instanceof Error ? costQuery.error.message : 'Could not load cost'}
                </p>
              )}
              {costQuery.data && (
                <p className="text-sm">
                  Total cost: ₹{costQuery.data.total_cost.toFixed(2)} · Per unit: ₹
                  {costQuery.data.cost_per_unit.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        )}
      </SimpleModal>
    </div>
  )
}
