/* ===========================
   app.js — Main Application Controller
   =========================== */

// Utility: HTML escape
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Utility: Toast notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}

// Utility: Custom confirm dialog (replaces native confirm which can be blocked)
function showConfirm(message, title = 'Confirm Delete') {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-confirm');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    overlay.classList.add('open');

    function cleanup(result) {
      overlay.classList.remove('open');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      cancelX.removeEventListener('click', onCancel);
      resolve(result);
    }

    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    const cancelX = document.getElementById('confirm-cancel-x');

    function onOk() { cleanup(true); }
    function onCancel() { cleanup(false); }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    cancelX.addEventListener('click', onCancel);
  });
}

// Tab navigation
function initTabs() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const panels = document.querySelectorAll('.tab-panel');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      navBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');

      // Refresh data when switching tabs
      if (tab === 'dashboard') AnalyticsManager.refresh();
      if (tab === 'inventory') InventoryManager.render();
      if (tab === 'products') ProductsManager.render();
      if (tab === 'transactions') TransactionsManager.render();
    });
  });
}

// Initialize everything
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await openDB();
    initTabs();
    ProductsManager.init();
    InventoryManager.init();
    TransactionsManager.init();
    AnalyticsManager.init();
    ExportManager.init();

    // Check for expiring items on load
    checkExpiryAlerts();
  } catch (err) {
    console.error('Initialization error:', err);
    showToast('Error initializing application', 'error');
  }
});

async function checkExpiryAlerts() {
  const inventory = await getAllRecords(STORES.INVENTORY);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let expiredCount = 0;
  let expiringCount = 0;

  inventory.forEach(item => {
    const expiry = new Date(item.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) expiredCount++;
    else if (diff <= 7) expiringCount++;
  });

  if (expiredCount > 0) {
    showToast(`⚠️ ${expiredCount} item${expiredCount > 1 ? 's have' : ' has'} expired!`, 'error');
  }
  if (expiringCount > 0) {
    setTimeout(() => {
      showToast(`🕐 ${expiringCount} item${expiringCount > 1 ? 's' : ''} expiring within 7 days`, 'warning');
    }, 500);
  }
}
