import { useState } from 'react'
import { Plus, Search, Boxes, Calendar, AlertTriangle, Trash2 } from 'lucide-react'
import {
  useBatches,
  useCreateBatch,
  useUpdateBatch,
  useDeleteBatch,
} from '@/hooks/useBatches'
import { useIngredients } from '@/hooks/useIngredients'
import { SimpleModal } from '@/components/admin/SimpleModal'
import type { Batch } from '@/hooks/useBatches'
import { withAdminToast } from '@/lib/adminToast'

export function BatchesPage() {
  const { data: batches = [], isLoading } = useBatches()
  const { data: ingredients = [] } = useIngredients()
  const createBatch = useCreateBatch()
  const updateBatch = useUpdateBatch()
  const deleteBatch = useDeleteBatch()

  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Batch | null>(null)
  const [ingredientId, setIngredientId] = useState('')
  const [qtyTotal, setQtyTotal] = useState('')
  const [qtyRemaining, setQtyRemaining] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const resetForm = () => {
    setIngredientId('')
    setQtyTotal('')
    setQtyRemaining('')
    setUnitCost('')
    setPurchaseDate('')
    setExpiryDate('')
    setFormError(null)
  }

  const closeModal = () => {
    setModal(null)
    setSelected(null)
    resetForm()
  }

  const openAdd = () => {
    resetForm()
    setPurchaseDate(new Date().toISOString().slice(0, 10))
    setModal('add')
  }

  const openEdit = (batch: Batch) => {
    resetForm()
    setSelected(batch)
    setQtyRemaining(String(batch.qty_remaining))
    setUnitCost(String(batch.unit_cost))
    setPurchaseDate(batch.purchase_date?.slice(0, 10) ?? '')
    setExpiryDate(batch.expiry_date?.slice(0, 10) ?? '')
    setModal('edit')
  }

  const handleCreate = async () => {
    setFormError(null)
    const qt = parseFloat(qtyTotal)
    const uc = parseFloat(unitCost)
    if (!ingredientId) {
      setFormError('Select an ingredient.')
      return
    }
    if (!Number.isFinite(qt) || qt <= 0 || !Number.isFinite(uc) || uc < 0) {
      setFormError('Enter valid quantity and unit cost.')
      return
    }
    try {
      await withAdminToast(
        createBatch.mutateAsync({
          ingredient_id: ingredientId,
          qty_total: qt,
          unit_cost: uc,
          purchase_date: purchaseDate || undefined,
          expiry_date: expiryDate || null,
        }),
        'Batch created'
      )
      closeModal()
    } catch {
      /* error toasted */
    }
  }

  const handleUpdate = async () => {
    setFormError(null)
    if (!selected) return
    const qr = parseFloat(qtyRemaining)
    const uc = parseFloat(unitCost)
    if (!Number.isFinite(qr) || qr < 0 || !Number.isFinite(uc) || uc < 0) {
      setFormError('Enter valid remaining quantity and unit cost.')
      return
    }
    try {
      await withAdminToast(
        updateBatch.mutateAsync({
          id: selected.id,
          data: {
            qty_remaining: qr,
            unit_cost: uc,
            purchase_date: purchaseDate || undefined,
            expiry_date: expiryDate || null,
          },
        }),
        'Batch updated'
      )
      closeModal()
    } catch {
      /* error toasted */
    }
  }

  const handleDelete = async (batch: Batch) => {
    if (!confirm('Delete this batch?')) return
    try {
      await withAdminToast(deleteBatch.mutateAsync(batch.id), 'Batch deleted')
    } catch {
      /* error toasted */
    }
  }

  const q = searchQuery.trim().toLowerCase()
  const filteredBatches = batches.filter((batch) => {
    const idShort = batch.id.slice(0, 8).toLowerCase()
    const ingName = (batch.ingredient?.name ?? '').toLowerCase()
    return !q || idShort.includes(q) || ingName.includes(q)
  })

  const isExpiringSoon = (expiryDateStr: string | null) => {
    if (!expiryDateStr) return false
    const expiry = new Date(expiryDateStr)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0
  }

  const isExpired = (expiryDateStr: string | null) => {
    if (!expiryDateStr) return false
    return new Date(expiryDateStr) < new Date()
  }

  const saving = createBatch.isPending || updateBatch.isPending || deleteBatch.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-on-surface">Batches</h1>
          <p className="text-on-surface-secondary mt-1">Track ingredient batches and expiry dates</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-md gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Add Batch
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-tertiary" size={20} />
        <input
          type="text"
          placeholder="Search by ingredient or batch id…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-md bg-surface text-on-surface placeholder:text-on-surface-tertiary focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="card p-12 text-center">
          <Boxes className="mx-auto mb-4 text-on-surface-tertiary" size={48} />
          <h3 className="text-lg font-semibold mb-2">No batches found</h3>
          <p className="text-on-surface-secondary">
            {searchQuery ? 'Try a different search term' : 'Add your first batch to get started'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface">
                <tr>
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Batch</th>
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Ingredient</th>
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Remaining</th>
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Unit cost</th>
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Purchase Date</th>
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Expiry Date</th>
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Status</th>
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="border-t border-surface-container hover:bg-surface/50 transition-colors"
                  >
                    <td className="p-4 font-medium">{batch.id.slice(0, 8)}…</td>
                    <td className="p-4">{batch.ingredient?.name ?? 'Unknown'}</td>
                    <td className="p-4">
                      {batch.quantity} {batch.ingredient?.unit ?? 'units'}
                    </td>
                    <td className="p-4">₹{batch.unit_cost.toFixed(2)}</td>
                    <td className="p-4 flex items-center gap-2">
                      <Calendar size={16} className="text-on-surface-tertiary shrink-0" />
                      {batch.purchase_date
                        ? new Date(batch.purchase_date).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="p-4">
                      {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4">
                      {isExpired(batch.expiry_date) ? (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-error/20 text-error flex items-center gap-1 w-fit">
                          <AlertTriangle size={12} />
                          Expired
                        </span>
                      ) : isExpiringSoon(batch.expiry_date) ? (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-warning/20 text-warning flex items-center gap-1 w-fit">
                          <AlertTriangle size={12} />
                          Expiring
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-success/20 text-success">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(batch)}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(batch)}
                          className="p-1 text-error hover:bg-error/10 rounded"
                          aria-label="Delete batch"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SimpleModal
        open={modal === 'add'}
        title="Add batch"
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
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 rounded-md gradient-primary text-on-primary text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Create'}
            </button>
          </>
        }
      >
        {formError && <p className="text-error text-sm mb-3">{formError}</p>}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-on-surface-secondary">Ingredient</label>
          <select
            value={ingredientId}
            onChange={(e) => setIngredientId(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-surface border border-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="">Select…</option>
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.unit})
              </option>
            ))}
          </select>
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

      <SimpleModal
        open={modal === 'edit'}
        title="Edit batch"
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
              onClick={handleUpdate}
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
          <label className="block text-sm font-medium text-on-surface-secondary">Qty remaining</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={qtyRemaining}
            onChange={(e) => setQtyRemaining(e.target.value)}
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
          <label className="block text-sm font-medium text-on-surface-secondary">Expiry date</label>
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
