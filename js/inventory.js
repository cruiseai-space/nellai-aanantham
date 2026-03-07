/* ===========================
   inventory.js — Inventory Management
   =========================== */

const InventoryManager = (() => {

  function init() {
    document.getElementById('btn-add-inventory').addEventListener('click', openAddModal);
    document.getElementById('btn-delete-all-inventory').addEventListener('click', handleDeleteAll);
    document.getElementById('form-inventory').addEventListener('submit', handleAdd);
    document.getElementById('inv-product-select').addEventListener('change', handleProductSelect);
    document.getElementById('inv-type').addEventListener('change', toggleInvSalePrice);
    document.getElementById('inventory-search').addEventListener('input', render);
    document.getElementById('inventory-filter-status').addEventListener('change', render);
    document.getElementById('inventory-filter-type').addEventListener('change', render);

    // Sell modal
    document.getElementById('form-sell').addEventListener('submit', handleSell);
    document.getElementById('sell-quantity').addEventListener('input', updateSellSummary);
    document.getElementById('sell-price').addEventListener('input', updateSellSummary);

    // Close modals
    document.querySelectorAll('[data-close="modal-inventory"]').forEach(btn => btn.addEventListener('click', closeAddModal));
    document.querySelectorAll('[data-close="modal-sell"]').forEach(btn => btn.addEventListener('click', closeSellModal));

    refreshProductDropdown();
    render();
  }

  async function refreshProductDropdown() {
    const products = await getAllRecords(STORES.PRODUCTS);
    const sel = document.getElementById('inv-product-select');
    sel.innerHTML = '<option value="">— Manual Entry —</option>';
    products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.type === 'ingredient' ? '🧂' : '📦'} ${p.name} ($${p.defaultCost.toFixed(2)})`;
      sel.appendChild(opt);
    });
  }

  function handleProductSelect() {
    const id = document.getElementById('inv-product-select').value;
    if (!id) return;
    getRecord(STORES.PRODUCTS, Number(id)).then(p => {
      if (!p) return;
      document.getElementById('inv-name').value = p.name;
      document.getElementById('inv-type').value = p.type;
      document.getElementById('inv-cost').value = p.defaultCost;
      document.getElementById('inv-saleprice').value = p.type === 'processed' ? p.defaultSalePrice : '';
      // Set expiry date
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + p.defaultExpiryDays);
      document.getElementById('inv-expiry').value = expiry.toISOString().split('T')[0];
      toggleInvSalePrice();
    });
  }

  function toggleInvSalePrice() {
    const type = document.getElementById('inv-type').value;
    document.getElementById('inv-saleprice-group').style.display = type === 'processed' ? '' : 'none';
  }

  function openAddModal() {
    document.getElementById('form-inventory').reset();
    document.getElementById('inv-product-select').value = '';
    toggleInvSalePrice();
    // Default expiry to 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    document.getElementById('inv-expiry').value = d.toISOString().split('T')[0];
    document.getElementById('modal-inventory').classList.add('open');
    document.getElementById('inv-name').focus();
  }

  function closeAddModal() {
    document.getElementById('modal-inventory').classList.remove('open');
  }

  async function handleDeleteAll() {
    const items = await getAllRecords(STORES.INVENTORY);
    if (items.length === 0) {
      showToast('Inventory is already empty', 'info');
      return;
    }
    const confirmed = await showConfirm(`Delete all ${items.length} inventory items? This cannot be undone.`, 'Delete All Inventory');
    if (confirmed) {
      await clearStore(STORES.INVENTORY);
      showToast('All inventory items deleted', 'info');
      render();
      if (typeof AnalyticsManager !== 'undefined') AnalyticsManager.refresh();
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    const type = document.getElementById('inv-type').value;
    const cost = parseFloat(document.getElementById('inv-cost').value) || 0;
    const qty = parseInt(document.getElementById('inv-quantity').value) || 1;
    const data = {
      productId: document.getElementById('inv-product-select').value ? Number(document.getElementById('inv-product-select').value) : null,
      name: document.getElementById('inv-name').value.trim(),
      type: type,
      cost: cost,
      salePrice: type === 'processed' ? (parseFloat(document.getElementById('inv-saleprice').value) || 0) : 0,
      quantity: qty,
      addedAt: new Date().toISOString(),
      expiryDate: document.getElementById('inv-expiry').value,
    };

    try {
      await addRecord(STORES.INVENTORY, data);

      // Record purchase transaction for ingredients
      if (type === 'ingredient') {
        await addRecord(STORES.TRANSACTIONS, {
          inventoryItemId: null,
          name: data.name,
          type: 'ingredient',
          txType: 'purchase',
          quantity: qty,
          costPerUnit: cost,
          salePricePerUnit: 0,
          totalCost: cost * qty,
          totalRevenue: 0,
          profit: -(cost * qty),
          date: new Date().toISOString(),
        });
      }

      showToast(`Added ${qty}x ${data.name} to inventory`, 'success');
      closeAddModal();
      render();
      if (typeof AnalyticsManager !== 'undefined') AnalyticsManager.refresh();
    } catch (err) {
      showToast('Error adding item: ' + err.message, 'error');
    }
  }

  // Sell modal
  let sellItem = null;

  function openSellModal(item) {
    sellItem = item;
    document.getElementById('sell-item-id').value = item.id;
    document.getElementById('sell-item-info').innerHTML = `
      <strong>${esc(item.name)}</strong><br>
      Available: <strong>${item.quantity}</strong> units &nbsp;|&nbsp;
      Cost/unit: <strong>₹${item.cost.toFixed(2)}</strong> &nbsp;|&nbsp;
      Suggested price: <strong>₹${item.salePrice.toFixed(2)}</strong>
    `;
    document.getElementById('sell-quantity').value = 1;
    document.getElementById('sell-quantity').max = item.quantity;
    document.getElementById('sell-price').value = item.salePrice || '';
    updateSellSummary();
    document.getElementById('modal-sell').classList.add('open');
  }

  function closeSellModal() {
    document.getElementById('modal-sell').classList.remove('open');
    sellItem = null;
  }

  function updateSellSummary() {
    if (!sellItem) return;
    const qty = parseInt(document.getElementById('sell-quantity').value) || 0;
    const price = parseFloat(document.getElementById('sell-price').value) || 0;
    const revenue = qty * price;
    const cost = qty * sellItem.cost;
    const profit = revenue - cost;
    document.getElementById('sell-summary').innerHTML = `
      Revenue: ₹${revenue.toFixed(2)} &nbsp;|&nbsp; 
      Cost: ₹${cost.toFixed(2)} &nbsp;|&nbsp; 
      Profit: <span class="${profit >= 0 ? 'text-positive' : 'text-negative'}">₹${profit.toFixed(2)}</span>
    `;
  }

  async function handleSell(e) {
    e.preventDefault();
    if (!sellItem) return;
    const qty = parseInt(document.getElementById('sell-quantity').value) || 0;
    const price = parseFloat(document.getElementById('sell-price').value) || 0;

    if (qty <= 0 || qty > sellItem.quantity) {
      showToast('Invalid quantity', 'error');
      return;
    }

    const revenue = qty * price;
    const cost = qty * sellItem.cost;
    const profit = revenue - cost;

    try {
      // Record transaction
      await addRecord(STORES.TRANSACTIONS, {
        inventoryItemId: sellItem.id,
        name: sellItem.name,
        type: 'processed',
        txType: 'sale',
        quantity: qty,
        costPerUnit: sellItem.cost,
        salePricePerUnit: price,
        totalCost: cost,
        totalRevenue: revenue,
        profit: profit,
        date: new Date().toISOString(),
      });

      // Update or delete inventory item
      const remaining = sellItem.quantity - qty;
      if (remaining <= 0) {
        await deleteRecord(STORES.INVENTORY, sellItem.id);
      } else {
        sellItem.quantity = remaining;
        await updateRecord(STORES.INVENTORY, sellItem);
      }

      showToast(`Sold ${qty}x ${sellItem.name} — Profit: ₹${profit.toFixed(2)}`, 'success');
      closeSellModal();
      render();
      if (typeof AnalyticsManager !== 'undefined') AnalyticsManager.refresh();
    } catch (err) {
      showToast('Error processing sale: ' + err.message, 'error');
    }
  }

  function getExpiryStatus(dateStr) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'expired';
    if (diff <= 7) return 'expiring';
    return 'good';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function daysUntil(dateStr) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  }

  async function render() {
    const items = await getAllRecords(STORES.INVENTORY);
    const search = document.getElementById('inventory-search').value.toLowerCase();
    const statusFilter = document.getElementById('inventory-filter-status').value;
    const typeFilter = document.getElementById('inventory-filter-type').value;

    const filtered = items.filter(item => {
      if (search && !item.name.toLowerCase().includes(search)) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all') {
        const status = getExpiryStatus(item.expiryDate);
        if (statusFilter !== status) return false;
      }
      return true;
    });

    const tbody = document.getElementById('inventory-tbody');
    const emptyState = document.getElementById('inventory-empty');

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    // Sort: expired first, then expiring, then good
    filtered.sort((a, b) => {
      const sa = getExpiryStatus(a.expiryDate);
      const sb = getExpiryStatus(b.expiryDate);
      const order = { expired: 0, expiring: 1, good: 2 };
      return order[sa] - order[sb] || new Date(a.expiryDate) - new Date(b.expiryDate);
    });

    tbody.innerHTML = filtered.map(item => {
      const status = getExpiryStatus(item.expiryDate);
      const days = daysUntil(item.expiryDate);
      const statusLabels = {
        good: '🟢 Good',
        expiring: `🟡 ${days}d left`,
        expired: `🔴 Expired`,
      };
      const badgeClass = {
        good: 'badge-good',
        expiring: 'badge-expiring',
        expired: 'badge-expired',
      };

      return `
        <tr>
          <td><strong>${esc(item.name)}</strong></td>
          <td><span class="badge badge-${item.type}">${item.type === 'ingredient' ? '🧂 Ingredient' : '📦 Processed'}</span></td>
          <td>${item.quantity}</td>
          <td>₹${item.cost.toFixed(2)}</td>
          <td>${item.type === 'processed' ? '₹' + item.salePrice.toFixed(2) : '—'}</td>
          <td>${formatDate(item.addedAt)}</td>
          <td>${formatDate(item.expiryDate)}</td>
          <td><span class="badge ${badgeClass[status]}">${statusLabels[status]}</span></td>
          <td>
            <div class="actions-cell">
              ${item.type === 'processed' ? `
              <button class="btn-icon success" title="Sell" data-sell="${item.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              </button>` : ''}
              <button class="btn-icon danger" title="Delete" data-delete="${item.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind sell buttons
    tbody.querySelectorAll('[data-sell]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const item = await getRecord(STORES.INVENTORY, Number(btn.dataset.sell));
        if (item) openSellModal(item);
      });
    });

    // Bind delete buttons
    tbody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await showConfirm('Remove this item from inventory?');
        if (confirmed) {
          await deleteRecord(STORES.INVENTORY, Number(btn.dataset.delete));
          showToast('Item removed from inventory', 'info');
          render();
          if (typeof AnalyticsManager !== 'undefined') AnalyticsManager.refresh();
        }
      });
    });
  }

  return { init, render, refreshProductDropdown };
})();
