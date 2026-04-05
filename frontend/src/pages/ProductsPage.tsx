import { useState } from 'react'
import { Plus, Search, ShoppingCart, IndianRupee, Trash2, Info } from 'lucide-react'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts'
import { useRecipes } from '@/hooks/useRecipes'
import { SimpleModal } from '@/components/admin/SimpleModal'
import type { Product } from '@/hooks/useProducts'
import { withAdminToast } from '@/lib/adminToast'

export function ProductsPage() {
  const { data: products = [], isLoading } = useProducts()
  const { data: recipes = [] } = useRecipes()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState<'add' | 'edit' | 'stockInfo' | null>(null)
  const [selected, setSelected] = useState<Product | null>(null)
  const [name, setName] = useState('')
  const [recipeId, setRecipeId] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setRecipeId('')
    setSalePrice('')
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

  const openEdit = (p: Product) => {
    setSelected(p)
    setName(p.name)
    setRecipeId(p.recipe_id ?? '')
    setSalePrice(String(p.price))
    setFormError(null)
    setModal('edit')
  }

  const openStockInfo = (p: Product) => {
    setSelected(p)
    setModal('stockInfo')
  }

  const handleSave = async () => {
    setFormError(null)
    const n = name.trim()
    const rid = recipeId.trim()
    const sp = parseFloat(salePrice)
    if (!n || !rid) {
      setFormError('Name and recipe are required.')
      return
    }
    if (!Number.isFinite(sp) || sp < 0) {
      setFormError('Enter a valid sale price.')
      return
    }
    try {
      if (modal === 'add') {
        await withAdminToast(
          createProduct.mutateAsync({
            name: n,
            recipe_id: rid,
            sale_price: sp,
          }),
          'Product created'
        )
      } else if (modal === 'edit' && selected) {
        await withAdminToast(
          updateProduct.mutateAsync({
            id: selected.id,
            data: { name: n, recipe_id: rid, sale_price: sp },
          }),
          'Product updated'
        )
      }
      closeModal()
    } catch {
      /* error toasted */
    }
  }

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete product "${p.name}"?`)) return
    try {
      await withAdminToast(deleteProduct.mutateAsync(p.id), 'Product deleted')
    } catch {
      /* error toasted */
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  const saving = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-on-surface">Products</h1>
          <p className="text-on-surface-secondary mt-1">Manage your bakery products catalog</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-md gradient-primary text-on-primary font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

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
            const isLowStock = product.current_stock <= product.min_stock && product.min_stock > 0
            return (
              <div key={product.id} className="card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-xs text-on-surface-secondary">{product.category || 'Uncategorized'}</p>
                  </div>
                  {isLowStock && (
                    <div className="p-1.5 rounded-full bg-warning/10 shrink-0">
                      <Info className="text-warning" size={14} />
                    </div>
                  )}
                </div>
                {product.description && (
                  <p className="text-sm text-on-surface-secondary mb-3 line-clamp-2">{product.description}</p>
                )}
                <p className="text-xs text-on-surface-tertiary mb-2">
                  Recipe: {product.recipe?.name ?? '—'}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-primary flex items-center">
                    <IndianRupee size={20} />
                    {product.price.toFixed(2)}
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
                  Finished goods stock is not stored on the product row; inventory is consumed from ingredient
                  batches when you bill an order.
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="flex-1 min-w-[3rem] py-2 px-3 text-sm font-medium rounded-md bg-surface hover:bg-surface-container transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openStockInfo(product)}
                    className="flex-1 min-w-[3rem] py-2 px-3 text-sm font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product)}
                    className="py-2 px-3 text-sm font-medium rounded-md text-error hover:bg-error/10"
                    aria-label="Delete product"
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
        title={modal === 'add' ? 'Add product' : 'Edit product'}
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
              onClick={handleSave}
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
          <label className="block text-sm font-medium text-on-surface-secondary">Recipe</label>
          <select
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-surface border border-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="">Select…</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <label className="block text-sm font-medium text-on-surface-secondary">Sale price (₹)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-surface border border-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </SimpleModal>

      <SimpleModal open={modal === 'stockInfo'} title="About product stock" onClose={closeModal}>
        <p className="text-sm text-on-surface-secondary">
          {selected ? (
            <>
              <strong className="text-on-surface">{selected.name}</strong> is linked to recipe{' '}
              <strong>{selected.recipe?.name ?? selected.recipe_id}</strong>. Ingredient quantities are tracked in
              Batches and reduced when you bill an order (POST /api/orders/:id/bill).
            </>
          ) : null}
        </p>
      </SimpleModal>
    </div>
  )
}
