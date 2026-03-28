/* ===========================
   sales.js — BillingManager (POS Billing)
   Nellai Aanantham
   =========================== */

const BillingManager = (() => {
  let cart = []; // [{productId, name, category, price, qty}]
  let billCounter = 0;

  function init() {
    document.getElementById('billing-product-search').addEventListener('input', renderProductGrid);
    document.getElementById('billing-category-filter').addEventListener('change', renderProductGrid);
    document.getElementById('btn-clear-cart').addEventListener('click', clearCart);
    document.getElementById('btn-generate-bill').addEventListener('click', generateBill);
    document.getElementById('bill-history-search').addEventListener('input', renderBillHistory);
    document.getElementById('btn-delete-all-bills').addEventListener('click', handleDeleteAllBills);

    // Billing sub-tab clicks
    const ribbon = document.getElementById('billing-ribbon');
    ribbon.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => renderCurrentSubTab());
    });

    loadBillCounter();
    renderProductGrid();
  }

  async function loadBillCounter() {
    const bills = await getAllRecords(STORES.BILLS);
    billCounter = bills.length;
  }

  function renderCurrentSubTab() {
    const activeBtn = document.querySelector('#billing-ribbon .sub-tab-btn.active');
    if (!activeBtn) return;
    if (activeBtn.dataset.subtab === 'new-bill') renderProductGrid();
    else renderBillHistory();
  }

  /* ========== PRODUCT GRID ========== */

  async function renderProductGrid() {
    const products = await getAllRecords(STORES.PRODUCTS);
    const search = document.getElementById('billing-product-search').value.toLowerCase();
    const catFilter = document.getElementById('billing-category-filter').value;

    const filtered = products.filter(p => {
      if (search && !p.name.toLowerCase().includes(search)) return false;
      if (catFilter !== 'all' && p.category !== catFilter) return false;
      return true;
    });

    const grid = document.getElementById('billing-product-grid');
    if (filtered.length === 0) {
      grid.innerHTML = '<div class="cart-empty">No products found</div>';
      return;
    }

    grid.innerHTML = filtered.map(p => `
      <div class="product-card" data-pid="${p.id}">
        <div class="product-card-name">${esc(p.name)}</div>
        <div class="product-card-category">${esc(p.category)}</div>
        <div class="product-card-price">₹${p.defaultSalePrice.toFixed(0)}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', async () => {
        const p = await getRecord(STORES.PRODUCTS, Number(card.dataset.pid));
        if (p) addToCart(p);
      });
    });
  }

  /* ========== CART ========== */

  function addToCart(product) {
    const existing = cart.find(c => c.productId === product.id);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        category: product.category,
        price: product.defaultSalePrice,
        cost: product.defaultCost || 0,
        qty: 1,
      });
    }
    renderCart();
  }

  function renderCart() {
    const container = document.getElementById('cart-items');
    if (cart.length === 0) {
      container.innerHTML = '<div class="cart-empty">No items added yet</div>';
      document.getElementById('cart-subtotal').textContent = '₹0.00';
      document.getElementById('cart-total').textContent = '₹0.00';
      document.getElementById('btn-generate-bill').disabled = true;
      return;
    }

    container.innerHTML = cart.map((item, i) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${esc(item.name)}</div>
          <div class="cart-item-price">₹${item.price.toFixed(0)} each</div>
        </div>
        <div class="cart-item-qty">
          <button data-cart-minus="${i}">−</button>
          <span>${item.qty}</span>
          <button data-cart-plus="${i}">+</button>
        </div>
        <div class="cart-item-total">₹${(item.price * item.qty).toFixed(0)}</div>
        <button class="cart-item-remove" data-cart-remove="${i}">✕</button>
      </div>
    `).join('');

    // Bind cart controls
    container.querySelectorAll('[data-cart-minus]').forEach(btn => btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.cartMinus);
      if (cart[idx].qty > 1) cart[idx].qty--;
      else cart.splice(idx, 1);
      renderCart();
    }));
    container.querySelectorAll('[data-cart-plus]').forEach(btn => btn.addEventListener('click', () => {
      cart[Number(btn.dataset.cartPlus)].qty++;
      renderCart();
    }));
    container.querySelectorAll('[data-cart-remove]').forEach(btn => btn.addEventListener('click', () => {
      cart.splice(Number(btn.dataset.cartRemove), 1);
      renderCart();
    }));

    const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    document.getElementById('cart-subtotal').textContent = '₹' + subtotal.toFixed(2);
    document.getElementById('cart-total').textContent = '₹' + subtotal.toFixed(2);
    document.getElementById('btn-generate-bill').disabled = false;
  }

  function clearCart() {
    cart = [];
    renderCart();
  }

  /* ========== GENERATE BILL ========== */

  async function generateBill() {
    if (cart.length === 0) return;
    billCounter++;
    const billNo = 'NA-' + String(billCounter).padStart(4, '0');
    const customer = document.getElementById('bill-customer-name').value.trim() || 'Walk-in';
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const totalCost = cart.reduce((s, c) => s + c.cost * c.qty, 0);

    const bill = {
      billNo,
      customer,
      items: cart.map(c => ({ ...c })),
      total,
      totalCost,
      profit: total - totalCost,
      date: new Date().toISOString(),
    };

    try {
      await addRecord(STORES.BILLS, bill);

      // Also record in transactions for analytics
      await addRecord(STORES.TRANSACTIONS, {
        inventoryItemId: null,
        name: `Bill ${billNo}`,
        type: 'processed',
        txType: 'sale',
        quantity: cart.reduce((s, c) => s + c.qty, 0),
        costPerUnit: 0,
        salePricePerUnit: 0,
        totalCost,
        totalRevenue: total,
        profit: total - totalCost,
        date: new Date().toISOString(),
      });

      showToast(`Bill ${billNo} created — ₹${total.toFixed(2)}`, 'success');
      showBillModal(bill);
      cart = [];
      renderCart();
      document.getElementById('bill-customer-name').value = '';
      if (typeof AnalyticsManager !== 'undefined') AnalyticsManager.refresh();
    } catch (err) {
      showToast('Error creating bill: ' + err.message, 'error');
    }
  }

  /* ========== VIEW BILL ========== */

  function showBillModal(bill) {
    const content = document.getElementById('bill-receipt-content');
    content.innerHTML = `
      <div class="bill-receipt-header">
        <h3>Nellai Aanantham</h3>
        <small>Bill No: ${bill.billNo}</small><br>
        <small>${new Date(bill.date).toLocaleString()}</small><br>
        <small>Customer: ${esc(bill.customer)}</small>
      </div>
      <table>
        <thead><tr><th>Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>
          ${bill.items.map(item => `<tr>
            <td>${esc(item.name)}</td>
            <td style="text-align:right">${item.qty}</td>
            <td style="text-align:right">₹${item.price.toFixed(0)}</td>
            <td style="text-align:right">₹${(item.price * item.qty).toFixed(0)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="bill-receipt-total">Total: ₹${bill.total.toFixed(2)}</div>
      <p style="text-align:center;margin-top:12px;font-size:0.75rem;color:var(--text-muted);">Thank you for visiting!</p>
    `;
    document.getElementById('modal-view-bill').classList.add('open');
  }

  /* ========== BILL HISTORY ========== */

  async function renderBillHistory() {
    const bills = await getAllRecords(STORES.BILLS);
    const search = document.getElementById('bill-history-search').value.toLowerCase();
    const filtered = bills.filter(b => !search || b.billNo.toLowerCase().includes(search) || b.customer.toLowerCase().includes(search));
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('bills-tbody');
    const emptyState = document.getElementById('bills-empty');
    if (filtered.length === 0) { tbody.innerHTML = ''; emptyState.classList.remove('hidden'); return; }
    emptyState.classList.add('hidden');

    tbody.innerHTML = filtered.map(b => {
      const itemCount = b.items.reduce((s, i) => s + i.qty, 0);
      return `<tr>
        <td><strong>${esc(b.billNo)}</strong></td>
        <td>${new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        <td>${esc(b.customer)}</td>
        <td>${itemCount}</td>
        <td class="text-positive">₹${b.total.toFixed(2)}</td>
        <td><div class="actions-cell">
          <button class="btn-icon info" title="View" data-view-bill="${b.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button class="btn-icon danger" title="Delete" data-del-bill="${b.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
        </div></td></tr>`;
    }).join('');

    tbody.querySelectorAll('[data-view-bill]').forEach(btn => btn.addEventListener('click', async () => {
      const b = await getRecord(STORES.BILLS, Number(btn.dataset.viewBill));
      if (b) showBillModal(b);
    }));
    tbody.querySelectorAll('[data-del-bill]').forEach(btn => btn.addEventListener('click', async () => {
      if (await showConfirm('Delete this bill?')) {
        await deleteRecord(STORES.BILLS, Number(btn.dataset.delBill));
        showToast('Bill deleted', 'info'); renderBillHistory();
      }
    }));
  }

  async function handleDeleteAllBills() {
    const bills = await getAllRecords(STORES.BILLS);
    if (bills.length === 0) { showToast('No bills to delete', 'info'); return; }
    if (await showConfirm(`Delete all ${bills.length} bills?`, 'Delete All Bills')) {
      await clearStore(STORES.BILLS);
      showToast('All bills deleted', 'info'); renderBillHistory();
    }
  }

  return { init, renderCurrentSubTab };
})();
