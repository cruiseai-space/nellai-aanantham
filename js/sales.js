/* ===========================
   sales.js — Transactions Tab
   =========================== */

const TransactionsManager = (() => {

  function init() {
    document.getElementById('transaction-search').addEventListener('input', render);
    document.getElementById('transaction-filter-type').addEventListener('change', render);
    document.getElementById('btn-delete-all-transactions').addEventListener('click', handleDeleteAll);
    render();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  async function handleDeleteAll() {
    const txns = await getAllRecords(STORES.TRANSACTIONS);
    if (txns.length === 0) {
      showToast('No transactions to delete', 'info');
      return;
    }
    const confirmed = await showConfirm(`Delete all ${txns.length} transactions? This cannot be undone.`, 'Delete All Transactions');
    if (confirmed) {
      await clearStore(STORES.TRANSACTIONS);
      showToast('All transactions deleted', 'info');
      render();
      if (typeof AnalyticsManager !== 'undefined') AnalyticsManager.refresh();
    }
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
          <td>
            <div class="actions-cell">
              <button class="btn-icon danger" data-delete="${tx.id}" title="Delete transaction">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind delete buttons
    tbody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await showConfirm('Delete this transaction record?');
        if (confirmed) {
          await deleteRecord(STORES.TRANSACTIONS, Number(btn.dataset.delete));
          showToast('Transaction deleted', 'info');
          render();
          if (typeof AnalyticsManager !== 'undefined') AnalyticsManager.refresh();
        }
      });
    });
  }

  return { init, render };
})();
