/* ===========================
   inventory.js — Inventory Management (Ingredients, Products sub-tab, Expenses)
   Nellai Aanantham
   =========================== */

const InventoryManager = (() => {
  let editingIngId = null;
  let editingExpId = null;

  function init() {
    // Ingredients
    document.getElementById('btn-add-ingredient').addEventListener('click', () => openIngredientModal());
    document.getElementById('form-ingredient').addEventListener('submit', handleIngredientSubmit);
    document.getElementById('ingredient-search').addEventListener('input', renderIngredients);
    document.getElementById('ingredient-filter-category').addEventListener('change', renderIngredients);
    document.getElementById('ingredient-filter-status').addEventListener('change', renderIngredients);

    // Expenses
    document.getElementById('btn-add-expense').addEventListener('click', () => openExpenseModal());
    document.getElementById('form-expense').addEventListener('submit', handleExpenseSubmit);
    document.getElementById('expense-search').addEventListener('input', renderExpenses);

    // Sub-tab ribbon click handler
    const ribbon = document.getElementById('inv-ribbon');
    ribbon.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => renderCurrentSubTab());
    });

    renderIngredients();
  }

  function renderCurrentSubTab() {
    const activeBtn = document.querySelector('#inv-ribbon .sub-tab-btn.active');
    if (!activeBtn) return;
    const tab = activeBtn.dataset.subtab;
    if (tab === 'ingredients') renderIngredients();
    else if (tab === 'products') ProductsManager.render();
    else if (tab === 'expenses') renderExpenses();
  }

  /* ========== INGREDIENTS ========== */

  function openIngredientModal(item = null) {
    editingIngId = item ? item.id : null;
    document.getElementById('modal-ingredient-title').textContent = item ? 'Edit Ingredient' : 'Add Ingredient';
    document.getElementById('ingredient-id').value = '';
    document.getElementById('ing-name').value = item ? item.name : '';
    document.getElementById('ing-category').value = item ? item.category : 'Dry Goods';
    document.getElementById('ing-unit').value = item ? item.unit : 'mg';
    document.getElementById('ing-quantity').value = item ? item.quantity : '';
    document.getElementById('ing-unitcost').value = item ? item.unitCost : '';
    document.getElementById('ing-supplier').value = item ? (item.supplier || '') : '';
    // Default expiry
    const d = new Date(); d.setDate(d.getDate() + 30);
    document.getElementById('ing-expiry').value = item ? (item.expiryDate || '').split('T')[0] : d.toISOString().split('T')[0];
    document.getElementById('modal-ingredient').classList.add('open');
    document.getElementById('ing-name').focus();
  }

  async function handleIngredientSubmit(e) {
    e.preventDefault();
    const data = {
      name: document.getElementById('ing-name').value.trim(),
      category: document.getElementById('ing-category').value,
      type: 'ingredient',
      unit: document.getElementById('ing-unit').value,
      quantity: parseFloat(document.getElementById('ing-quantity').value) || 0,
      unitCost: parseFloat(document.getElementById('ing-unitcost').value) || 0,
      supplier: document.getElementById('ing-supplier').value.trim(),
      addedAt: new Date().toISOString(),
      expiryDate: document.getElementById('ing-expiry').value,
    };
    try {
      if (editingIngId) {
        data.id = editingIngId;
        // Preserve original addedAt
        const old = await getRecord(STORES.INVENTORY, editingIngId);
        if (old) data.addedAt = old.addedAt;
        await updateRecord(STORES.INVENTORY, data);
        showToast('Ingredient updated', 'success');
      } else {
        await addRecord(STORES.INVENTORY, data);
        showToast('Ingredient added', 'success');
      }
      document.getElementById('modal-ingredient').classList.remove('open');
      editingIngId = null;
      renderIngredients();
      if (typeof AnalyticsManager !== 'undefined') AnalyticsManager.refresh();
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  }

  function getExpiryStatus(dateStr) {
    if (!dateStr) return 'good';
    const now = new Date(); now.setHours(0,0,0,0);
    const expiry = new Date(dateStr); expiry.setHours(0,0,0,0);
    const diff = Math.ceil((expiry - now) / 86400000);
    if (diff < 0) return 'expired';
    if (diff <= 7) return 'expiring';
    return 'good';
  }

  function daysUntil(dateStr) {
    if (!dateStr) return 999;
    const now = new Date(); now.setHours(0,0,0,0);
    const t = new Date(dateStr); t.setHours(0,0,0,0);
    return Math.ceil((t - now) / 86400000);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function renderIngredients() {
    const items = (await getAllRecords(STORES.INVENTORY)).filter(i => i.type === 'ingredient');
    const search = document.getElementById('ingredient-search').value.toLowerCase();
    const catFilter = document.getElementById('ingredient-filter-category').value;
    const statusFilter = document.getElementById('ingredient-filter-status').value;

    const filtered = items.filter(item => {
      if (search && !item.name.toLowerCase().includes(search)) return false;
      if (catFilter !== 'all' && item.category !== catFilter) return false;
      if (statusFilter !== 'all' && getExpiryStatus(item.expiryDate) !== statusFilter) return false;
      return true;
    });

    // Sort: expired → expiring → good
    filtered.sort((a, b) => {
      const order = { expired: 0, expiring: 1, good: 2 };
      const sa = getExpiryStatus(a.expiryDate), sb = getExpiryStatus(b.expiryDate);
      return order[sa] - order[sb] || new Date(a.expiryDate) - new Date(b.expiryDate);
    });

    const tbody = document.getElementById('ingredients-tbody');
    const emptyState = document.getElementById('ingredients-empty');
    if (filtered.length === 0) { tbody.innerHTML = ''; emptyState.classList.remove('hidden'); return; }
    emptyState.classList.add('hidden');

    tbody.innerHTML = filtered.map(item => {
      const status = getExpiryStatus(item.expiryDate);
      const days = daysUntil(item.expiryDate);
      const statusLabel = status === 'good' ? '🟢 Good' : status === 'expiring' ? `🟡 ${days}d left` : '🔴 Expired';
      const badgeClass = `badge-${status}`;
      return `<tr>
        <td><strong>${esc(item.name)}</strong></td>
        <td><span class="badge badge-ingredient">${esc(item.category)}</span></td>
        <td>${item.quantity}</td>
        <td>${item.unit}</td>
        <td>₹${item.unitCost.toFixed(2)}</td>
        <td>${esc(item.supplier || '—')}</td>
        <td>${formatDate(item.addedAt)}</td>
        <td>${formatDate(item.expiryDate)}</td>
        <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
        <td><div class="actions-cell">
          <button class="btn-icon edit" title="Edit" data-edit-ing="${item.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="btn-icon danger" title="Delete" data-del-ing="${item.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
        </div></td></tr>`;
    }).join('');

    tbody.querySelectorAll('[data-edit-ing]').forEach(btn => btn.addEventListener('click', async () => {
      const item = await getRecord(STORES.INVENTORY, Number(btn.dataset.editIng));
      if (item) openIngredientModal(item);
    }));
    tbody.querySelectorAll('[data-del-ing]').forEach(btn => btn.addEventListener('click', async () => {
      if (await showConfirm('Delete this ingredient?')) {
        await deleteRecord(STORES.INVENTORY, Number(btn.dataset.delIng));
        showToast('Ingredient deleted', 'info'); renderIngredients();
        if (typeof AnalyticsManager !== 'undefined') AnalyticsManager.refresh();
      }
    }));
  }

  /* ========== EXPENSES ========== */

  function openExpenseModal(item = null) {
    editingExpId = item ? item.id : null;
    document.getElementById('modal-expense-title').textContent = item ? 'Edit Expense' : 'Add Expense';
    document.getElementById('expense-id').value = '';
    document.getElementById('exp-name').value = item ? item.name : '';
    document.getElementById('exp-category').value = item ? item.category : 'Rent';
    document.getElementById('exp-amount').value = item ? item.amount : '';
    document.getElementById('exp-date').value = item ? (item.date || '').split('T')[0] : new Date().toISOString().split('T')[0];
    document.getElementById('exp-recurring').value = item ? (item.recurring || 'No') : 'No';
    document.getElementById('exp-notes').value = item ? (item.notes || '') : '';
    document.getElementById('modal-expense').classList.add('open');
    document.getElementById('exp-name').focus();
  }

  async function handleExpenseSubmit(e) {
    e.preventDefault();
    const data = {
      name: document.getElementById('exp-name').value.trim(),
      category: document.getElementById('exp-category').value,
      amount: parseFloat(document.getElementById('exp-amount').value) || 0,
      date: document.getElementById('exp-date').value,
      recurring: document.getElementById('exp-recurring').value,
      notes: document.getElementById('exp-notes').value.trim(),
    };
    try {
      if (editingExpId) {
        data.id = editingExpId;
        await updateRecord(STORES.EXPENSES, data);
        showToast('Expense updated', 'success');
      } else {
        await addRecord(STORES.EXPENSES, data);
        showToast('Expense added', 'success');
      }
      document.getElementById('modal-expense').classList.remove('open');
      editingExpId = null;
      renderExpenses();
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  }

  async function renderExpenses() {
    const items = await getAllRecords(STORES.EXPENSES);
    const search = document.getElementById('expense-search').value.toLowerCase();
    const filtered = items.filter(i => !search || i.name.toLowerCase().includes(search) || i.category.toLowerCase().includes(search));
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('expenses-tbody');
    const emptyState = document.getElementById('expenses-empty');
    if (filtered.length === 0) { tbody.innerHTML = ''; emptyState.classList.remove('hidden'); return; }
    emptyState.classList.add('hidden');

    tbody.innerHTML = filtered.map(item => `<tr>
      <td><strong>${esc(item.name)}</strong></td>
      <td>${esc(item.category)}</td>
      <td>₹${item.amount.toFixed(2)}</td>
      <td>${formatDate(item.date)}</td>
      <td>${item.recurring || 'No'}</td>
      <td>${esc(item.notes || '—')}</td>
      <td><div class="actions-cell">
        <button class="btn-icon edit" title="Edit" data-edit-exp="${item.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="btn-icon danger" title="Delete" data-del-exp="${item.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
      </div></td></tr>`).join('');

    tbody.querySelectorAll('[data-edit-exp]').forEach(btn => btn.addEventListener('click', async () => {
      const item = await getRecord(STORES.EXPENSES, Number(btn.dataset.editExp));
      if (item) openExpenseModal(item);
    }));
    tbody.querySelectorAll('[data-del-exp]').forEach(btn => btn.addEventListener('click', async () => {
      if (await showConfirm('Delete this expense?')) {
        await deleteRecord(STORES.EXPENSES, Number(btn.dataset.delExp));
        showToast('Expense deleted', 'info'); renderExpenses();
      }
    }));
  }

  return { init, renderCurrentSubTab, renderIngredients };
})();
