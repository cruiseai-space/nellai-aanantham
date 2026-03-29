import { useState } from 'react'
import { Plus, Search, Boxes, Calendar, AlertTriangle } from 'lucide-react'
import { useBatches } from '@/hooks/useBatches'

export function BatchesPage() {
  const { data: batches = [], isLoading } = useBatches()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBatches = batches.filter(
    (batch) =>
      batch.batch_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.ingredient?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0
  }

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-on-surface">
            Batches
          </h1>
          <p className="text-on-surface-secondary mt-1">
            Track ingredient batches and expiry dates
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity">
          <Plus size={20} />
          Add Batch
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-tertiary" size={20} />
        <input
          type="text"
          placeholder="Search batches..."
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
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Batch #</th>
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Ingredient</th>
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Quantity</th>
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Purchase Date</th>
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Expiry Date</th>
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Status</th>
                  <th className="text-left p-4 font-medium text-on-surface-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch) => (
                  <tr key={batch.id} className="border-t border-surface-container hover:bg-surface/50 transition-colors">
                    <td className="p-4 font-medium">{batch.batch_number || batch.id.slice(0, 8)}</td>
                    <td className="p-4">{batch.ingredient?.name || 'Unknown'}</td>
                    <td className="p-4">{batch.quantity} {batch.ingredient?.unit || 'units'}</td>
                    <td className="p-4 flex items-center gap-2">
                      <Calendar size={16} className="text-on-surface-tertiary" />
                      {new Date(batch.purchase_date).toLocaleDateString()}
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
                      <button className="text-sm font-medium text-primary hover:underline">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
