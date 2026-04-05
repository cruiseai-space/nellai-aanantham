import { useState } from 'react'
import { Plus, Search, Package, AlertTriangle, Trash2 } from 'lucide-react'
import {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
} from '@/hooks/useIngredients'
import { useCreateBatch } from '@/hooks/useBatches'
import { SimpleModal } from '@/components/admin/SimpleModal'
import type { Ingredient } from '@/hooks/useIngredients'
import { withAdminToast } from '@/lib/adminToast'

export function IngredientsPage() {
  const { data: ingredients = [], isLoading } = useIngredients()
  const createIngredient = useCreateIngredient()
  const updateIngredient = useUpdateIngredient()
  const deleteIngredient = useDeleteIngredient()
  const createBatch = useCreateBatch()

  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState<'add' | 'edit' | 'batch' | null>(null)
  const [selected, setSelected] = useState<Ingredient | null>(null)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [qtyTotal, setQtyTotal] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setUnit('')
    setQtyTotal('')
    setUnitCost('')
    setPurchaseDate('')
    setExpiryDate('')
    setFormError(null)
  }

  const openAdd = () => {
    resetForm()
    setSelected(null)
    setModal('add')
  }

  const openEdit = (ing: Ingredient) => {
    resetForm()
    setSelected(ing)
    setName(ing.name)
    setUnit(ing.unit)
    setModal('edit')
  }

  const openBatch = (ing: Ingredient) => {
    resetForm()
    setSelected(ing)
    setPurchaseDate(new Date().toISOString().slice(0, 10))
    setModal('batch')
  }

  const closeModal = () => {
    setModal(null)
    setSelected(null)
    resetForm()
  }

  const handleSaveIngredient = async () => {
    setFormError(null)
    const n = name.trim()
    const u = unit.trim()
    if (!n || !u) {
      setFormError('Name and unit are required.')
      return
    }
    try {
      if (modal === 'add') {
        await withAdminToast(
          createIngredient.mutateAsync({ name: n, unit: u }),
          'Ingredient created'
        )
      } else if (modal === 'edit' && selected) {
        await withAdminToast(
          updateIngredient.mutateAsync({ id: selected.id, data: { name: n, unit: u } }),
          'Ingredient updated'
        )
      }
      closeModal()
    } catch {
      /* error toasted */
    }
  }

  const handleSaveBatch = async () => {
    setFormError(null)
    if (!selected) return
    const qt = parseFloat(qtyTotal)
    const uc = parseFloat(unitCost)
    if (!Number.isFinite(qt) || qt <= 0 || !Number.isFinite(uc) || uc < 0) {
      setFormError('Enter valid quantity and unit cost.')
      return
    }
    try {
      await withAdminToast(
        createBatch.mutateAsync({
          ingredient_id: selected.id,
          qty_total: qt,
          unit_cost: uc,
          purchase_date: purchaseDate || undefined,
          expiry_date: expiryDate || null,
        }),
        'Stock batch added'
      )
      closeModal()
    } catch {
      /* error toasted */
    }
  }

  const handleDelete = async (ing: Ingredient) => {
    if (!confirm(`Delete ingredient "${ing.name}"? This may fail if batches exist.`)) return
    try {
      await withAdminToast(deleteIngredient.mutateAsync(ing.id), 'Ingredient deleted')
    } catch {
      /* error toasted */
    }
  }

  const filteredIngredients = ingredients.filter(
    (ingredient) =>
      ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ingredient.category?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  const saving =
    createIngredient.isPending ||
    updateIngredient.isPending ||
    createBatch.isPending ||
    deleteIngredient.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-on-surface">
            Ingredients
          </h1>
          <p className="text-on-surface-secondary mt-1">
            Manage your bakery ingredients inventory
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-md gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Add Ingredient
        </button>
      </div>

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
                      {ingredient.current_stock.toFixed(2)} {ingredient.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-secondary">Min Stock</span>
                    <span>
                      {ingredient.min_stock} {ingredient.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-secondary">Avg cost / unit</span>
                    <span>₹{ingredient.cost_per_unit.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-surface-container flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(ingredient)}
                    className="flex-1 min-w-[4rem] py-2 px-3 text-sm font-medium rounded-md bg-surface hover:bg-surface-container transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openBatch(ingredient)}
                    className="flex-1 min-w-[4rem] py-2 px-3 text-sm font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    Add Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ingredient)}
                    className="py-2 px-3 text-sm font-medium rounded-md text-error hover:bg-error/10 transition-colors"
                    aria-label="Delete ingredient"
                  >
                    <Trash2 size={18} className="mx-auto" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <SimpleModal
        open={modal === 'add' || modal === 'edit'}
        title={modal === 'add' ? 'Add ingredient' : 'Edit ingredient'}
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
              onClick={handleSaveIngredient}
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-surface border border-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <label className="block text-sm font-medium text-on-surface-secondary">Unit</label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. kg, g, L"
            className="w-full px-3 py-2 rounded-md bg-surface border border-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </SimpleModal>

      <SimpleModal
        open={modal === 'batch'}
        title={selected ? `Add stock — ${selected.name}` : 'Add stock'}
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
              onClick={handleSaveBatch}
              disabled={saving}
              className="px-4 py-2 rounded-md gradient-primary text-on-primary text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Create batch'}
            </button>
          </>
        }
      >
        {formError && <p className="text-error text-sm mb-3">{formError}</p>}
        <p className="text-sm text-on-surface-secondary mb-3">
          Creates an ingredient batch (inventory lot) via POST /api/batches.
        </p>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-on-surface-secondary">Quantity received</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={qtyTotal}
            onChange={(e) => setQtyTotal(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-surface border border-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <label className="block text-sm font-medium text-on-surface-secondary">Unit cost (₹)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-surface border border-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <label className="block text-sm font-medium text-on-surface-secondary">Purchase date</label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-surface border border-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <label className="block text-sm font-medium text-on-surface-secondary">Expiry date (optional)</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-surface border border-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </SimpleModal>
    </div>
  )
}
