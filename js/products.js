/* ===========================
   products.js — Predefined Products CRUD
   =========================== */

const ProductsManager = (() => {
  let editingId = null;

  function init() {
    document.getElementById('btn-add-product').addEventListener('click', () => openModal());
    document.getElementById('btn-delete-all-products').addEventListener('click', handleDeleteAll);
    document.getElementById('form-product').addEventListener('submit', handleSubmit);
    document.getElementById('product-type').addEventListener('change', toggleSalePriceField);
    document.getElementById('product-search').addEventListener('input', render);

    // Close modal buttons
    document.querySelectorAll('[data-close="modal-product"]').forEach(btn => {
      btn.addEventListener('click', closeModal);
    });

    render();
  }

  function openModal(product = null) {
    editingId = product ? product.id : null;
    const modal = document.getElementById('modal-product');
    document.getElementById('modal-product-title').textContent = product ? 'Edit Product' : 'Add Product';
    document.getElementById('product-id').value = '';
    document.getElementById('product-name').value = product ? product.name : '';
    document.getElementById('product-category').value = product ? product.category : '';
    document.getElementById('product-type').value = product ? product.type : 'ingredient';
    document.getElementById('product-cost').value = product ? product.defaultCost : '';
    document.getElementById('product-saleprice').value = product ? (product.defaultSalePrice || '') : '';
    document.getElementById('product-expiry-days').value = product ? product.defaultExpiryDays : '';
    toggleSalePriceField();
    modal.classList.add('open');
    document.getElementById('product-name').focus();
  }

  function closeModal() {
    document.getElementById('modal-product').classList.remove('open');
    editingId = null;
  }

  async function handleDeleteAll() {
    const products = await getAllRecords(STORES.PRODUCTS);
    if (products.length === 0) {
      showToast('No products to delete', 'info');
      return;
    }
    const confirmed = await showConfirm(`Delete all ${products.length} product templates? This cannot be undone.`, 'Delete All Products');
    if (confirmed) {
      await clearStore(STORES.PRODUCTS);
      showToast('All products deleted', 'info');
      render();
      if (typeof InventoryManager !== 'undefined') InventoryManager.refreshProductDropdown();
    }
  }

  function toggleSalePriceField() {
    const type = document.getElementById('product-type').value;
    const group = document.getElementById('product-saleprice-group');
    group.style.display = type === 'processed' ? '' : 'none';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = {
      name: document.getElementById('product-name').value.trim(),
      category: document.getElementById('product-category').value.trim(),
      type: document.getElementById('product-type').value,
      defaultCost: parseFloat(document.getElementById('product-cost').value) || 0,
      defaultSalePrice: document.getElementById('product-type').value === 'processed'
        ? (parseFloat(document.getElementById('product-saleprice').value) || 0) : 0,
      defaultExpiryDays: parseInt(document.getElementById('product-expiry-days').value) || 30,
      createdAt: new Date().toISOString(),
    };

    try {
      if (editingId) {
        data.id = editingId;
        await updateRecord(STORES.PRODUCTS, data);
        showToast('Product updated successfully', 'success');
      } else {
        await addRecord(STORES.PRODUCTS, data);
        showToast('Product created successfully', 'success');
      }
      closeModal();
      render();
      // Refresh inventory form dropdown too
      if (typeof InventoryManager !== 'undefined') InventoryManager.refreshProductDropdown();
    } catch (err) {
      showToast('Error saving product: ' + err.message, 'error');
    }
  }

  async function render() {
    const products = await getAllRecords(STORES.PRODUCTS);
    const search = document.getElementById('product-search').value.toLowerCase();
    const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search));
    const tbody = document.getElementById('products-tbody');
    const emptyState = document.getElementById('products-empty');

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td><strong>${esc(p.name)}</strong></td>
        <td>${esc(p.category)}</td>
        <td><span class="badge badge-${p.type}">${p.type === 'ingredient' ? '🧂 Ingredient' : '📦 Processed'}</span></td>
        <td>₹${p.defaultCost.toFixed(2)}</td>
        <td>${p.type === 'processed' ? '₹' + p.defaultSalePrice.toFixed(2) : '—'}</td>
        <td>${p.defaultExpiryDays} days</td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon edit" title="Edit" data-edit="${p.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon danger" title="Delete" data-delete="${p.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Bind row actions
    tbody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const p = await getRecord(STORES.PRODUCTS, Number(btn.dataset.edit));
        if (p) openModal(p);
      });
    });

    tbody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await showConfirm('Delete this product template?');
        if (confirmed) {
          await deleteRecord(STORES.PRODUCTS, Number(btn.dataset.delete));
          showToast('Product deleted', 'info');
          render();
          if (typeof InventoryManager !== 'undefined') InventoryManager.refreshProductDropdown();
        }
      });
    });
  }

  return { init, render };
})();
