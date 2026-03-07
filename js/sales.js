/* ===========================
   sales.js — Transactions Tab
   =========================== */

const TransactionsManager = (() => {

  function init() {
    document.getElementById('transaction-search').addEventListener('input', render);
    document.getElementById('transaction-filter-type').addEventListener('change', render);
    render();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  async function render() {
    const txns = await getAllRecords(STORES.TRANSACTIONS);
    const search = document.getElementById('transaction-search').value.toLowerCase();
    const typeFilter = document.getElementById('transaction-filter-type').value;

    const filtered = txns.filter(tx => {
      if (search && !tx.name.toLowerCase().includes(search)) return false;
      if (typeFilter !== 'all' && tx.txType !== typeFilter) return false;
      return true;
    });

    // Sort by date descending (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('transactions-tbody');
    const emptyState = document.getElementById('transactions-empty');

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    tbody.innerHTML = filtered.map(tx => {
      const isPurchase = tx.txType === 'purchase';
      return `
        <tr>
          <td>${formatDate(tx.date)}</td>
          <td><strong>${esc(tx.name)}</strong></td>
          <td><span class="badge ${isPurchase ? 'badge-purchase' : 'badge-sale'}">${isPurchase ? '🛒 Purchase' : '💰 Sale'}</span></td>
          <td>${tx.quantity}</td>
          <td>₹${tx.totalCost.toFixed(2)}</td>
          <td>${isPurchase ? '—' : '₹' + tx.totalRevenue.toFixed(2)}</td>
          <td><span class="${tx.profit >= 0 ? 'text-positive' : 'text-negative'}">₹${tx.profit.toFixed(2)}</span></td>
        </tr>
      `;
    }).join('');
  }

  return { init, render };
})();
