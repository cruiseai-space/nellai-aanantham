/* ===========================
   products.js — Products CRUD (sub-tab in Inventory)
   Nellai Aanantham
   =========================== */

const ProductsManager = (() => {
  let editingId = null;

  function init() {
    document.getElementById('btn-add-product').addEventListener('click', () => openModal());
    document.getElementById('form-product').addEventListener('submit', handleSubmit);
    document.getElementById('product-search').addEventListener('input', render);
    document.getElementById('product-filter-category').addEventListener('change', render);
    document.getElementById('btn-add-recipe-row').addEventListener('click', addRecipeRow);
    render();
  }

  async function openModal(product = null) {
    editingId = product ? product.id : null;
    document.getElementById('modal-product-title').textContent = product ? 'Edit Product' : 'Add Product';
    document.getElementById('product-id').value = '';
    document.getElementById('product-name').value = product ? product.name : '';
    document.getElementById('product-category').value = product ? product.category : '';
    document.getElementById('product-saleprice').value = product ? product.defaultSalePrice : '';
    document.getElementById('product-expiry-days').value = product ? product.defaultExpiryDays : '';
    // Load recipe
    const rows = document.getElementById('recipe-rows');
    rows.innerHTML = '';
    if (product && product.recipe) {
      for (const r of product.recipe) {
        await addRecipeRow(null, r);
      }
    }
    updateRecipeCost();
    document.getElementById('modal-product').classList.add('open');
    document.getElementById('product-name').focus();
  }

  function closeModal() {
    document.getElementById('modal-product').classList.remove('open');
    editingId = null;
  }

  async function addRecipeRow(e, prefill = null) {
    const container = document.getElementById('recipe-rows');
    const ingredients = await getAllRecords(STORES.INVENTORY);
    const ings = ingredients.filter(i => i.type === 'ingredient');
    const row = document.createElement('div');
    row.className = 'recipe-row';
    const sel = document.createElement('select');
    sel.innerHTML = '<option value="">— Select —</option>' + ings.map(i =>
      `<option value="${i.id}" data-unit="${i.unit}" data-cost="${i.unitCost}" ${prefill && prefill.name === i.name ? 'selected' : ''}>${i.name}</option>`
    ).join('');
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number'; qtyInput.min = '0'; qtyInput.step = 'any'; qtyInput.placeholder = 'Qty';
    qtyInput.value = prefill ? prefill.qty : '';
    const unitSpan = document.createElement('span');
    unitSpan.className = 'recipe-unit';
    unitSpan.textContent = prefill ? prefill.unit : '';
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button'; removeBtn.className = 'btn-icon danger'; removeBtn.innerHTML = '✕';
    removeBtn.addEventListener('click', () => { row.remove(); updateRecipeCost(); });
    sel.addEventListener('change', () => {
      const opt = sel.options[sel.selectedIndex];
      unitSpan.textContent = opt.dataset.unit || '';
      updateRecipeCost();
    });
    qtyInput.addEventListener('input', updateRecipeCost);
    row.appendChild(sel); row.appendChild(qtyInput); row.appendChild(unitSpan); row.appendChild(removeBtn);
    container.appendChild(row);
  }

  async function updateRecipeCost() {
    const rows = document.getElementById('recipe-rows').querySelectorAll('.recipe-row');
    const ings = await getAllRecords(STORES.INVENTORY);
    let cost = 0;
    rows.forEach(row => {
      const sel = row.querySelector('select');
      const qty = parseFloat(row.querySelector('input').value) || 0;
      const id = Number(sel.value);
      const ing = ings.find(i => i.id === id);
      if (ing) cost += qty * ing.unitCost;
    });
    document.getElementById('recipe-est-cost').textContent = '₹' + cost.toFixed(2);
  }

  function getRecipeFromForm() {
    const rows = document.getElementById('recipe-rows').querySelectorAll('.recipe-row');
    const recipe = [];
    rows.forEach(row => {
      const sel = row.querySelector('select');
      const qty = parseFloat(row.querySelector('input').value) || 0;
      const opt = sel.options[sel.selectedIndex];
      if (sel.value && qty > 0) {
        recipe.push({
          ingredientId: Number(sel.value),
          name: opt.textContent,
          qty,
          unit: opt.dataset.unit || 'mg',
        });
      }
    });
    return recipe;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const recipe = getRecipeFromForm();
    // Calculate cost from recipe
    const ings = await getAllRecords(STORES.INVENTORY);
    let cost = 0;
    for (const r of recipe) {
      const ing = ings.find(i => i.id === r.ingredientId);
      if (ing) cost += r.qty * ing.unitCost;
    }
    const data = {
      name: document.getElementById('product-name').value.trim(),
      category: document.getElementById('product-category').value.trim(),
      type: 'processed',
      defaultSalePrice: parseFloat(document.getElementById('product-saleprice').value) || 0,
      defaultCost: Math.round(cost * 100) / 100,
      defaultExpiryDays: parseInt(document.getElementById('product-expiry-days').value) || 5,
      recipe,
      createdAt: new Date().toISOString(),
    };
    try {
      if (editingId) { data.id = editingId; await updateRecord(STORES.PRODUCTS, data); showToast('Product updated', 'success'); }
      else { await addRecord(STORES.PRODUCTS, data); showToast('Product created', 'success'); }
      closeModal();
      render();
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  }

  async function render() {
    const products = await getAllRecords(STORES.PRODUCTS);
    const search = document.getElementById('product-search').value.toLowerCase();
    const catFilter = document.getElementById('product-filter-category').value;
    const filtered = products.filter(p => {
      if (search && !p.name.toLowerCase().includes(search) && !p.category.toLowerCase().includes(search)) return false;
      if (catFilter !== 'all' && p.category !== catFilter) return false;
      return true;
    });
    const tbody = document.getElementById('products-tbody');
    const emptyState = document.getElementById('products-empty');
    if (filtered.length === 0) { tbody.innerHTML = ''; emptyState.classList.remove('hidden'); return; }
    emptyState.classList.add('hidden');

    tbody.innerHTML = filtered.map(p => {
      const margin = p.defaultSalePrice > 0 ? (((p.defaultSalePrice - (p.defaultCost||0)) / p.defaultSalePrice) * 100).toFixed(1) : '0.0';
      const ingredientCount = (p.recipe || []).length;
      return `<tr>
        <td><strong>${esc(p.name)}</strong></td>
        <td><span class="badge badge-processed">${esc(p.category)}</span></td>
        <td>₹${p.defaultSalePrice.toFixed(2)}</td>
        <td>₹${(p.defaultCost||0).toFixed(2)}</td>
        <td><span class="${parseFloat(margin)>=0?'text-positive':'text-negative'}">${margin}%</span></td>
        <td>${ingredientCount} items</td>
        <td><div class="actions-cell">
          <button class="btn-icon info" title="View Recipe" data-recipe="${p.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button class="btn-icon edit" title="Edit" data-edit="${p.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="btn-icon danger" title="Delete" data-delete="${p.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
        </div></td></tr>`;
    }).join('');

    // Bind actions
    tbody.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', async () => {
      const p = await getRecord(STORES.PRODUCTS, Number(btn.dataset.edit));
      if (p) openModal(p);
    }));
    tbody.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', async () => {
      if (await showConfirm('Delete this product?')) {
        await deleteRecord(STORES.PRODUCTS, Number(btn.dataset.delete));
        showToast('Product deleted', 'info'); render();
      }
    }));
    tbody.querySelectorAll('[data-recipe]').forEach(btn => btn.addEventListener('click', async () => {
      const p = await getRecord(STORES.PRODUCTS, Number(btn.dataset.recipe));
      if (p) showRecipeModal(p);
    }));
  }

  function showRecipeModal(product) {
    document.getElementById('recipe-modal-title').textContent = `Recipe — ${product.name}`;
    const content = document.getElementById('recipe-view-content');
    if (!product.recipe || product.recipe.length === 0) {
      content.innerHTML = '<p class="text-muted">No ingredients linked</p>';
    } else {
      content.innerHTML = `<table class="data-table" style="min-width:auto;"><thead><tr><th>Ingredient</th><th>Qty</th><th>Unit</th></tr></thead><tbody>
        ${product.recipe.map(r => `<tr><td>${esc(r.name)}</td><td>${r.qty}</td><td>${r.unit}</td></tr>`).join('')}
      </tbody></table>
      <p style="margin-top:12px;font-size:0.85rem;">Estimated Cost: <strong class="text-positive">₹${(product.defaultCost||0).toFixed(2)}</strong></p>`;
    }
    document.getElementById('modal-view-recipe').classList.add('open');
  }

  async function getAllProducts() {
    return getAllRecords(STORES.PRODUCTS);
  }

  return { init, render, getAllProducts };
})();
