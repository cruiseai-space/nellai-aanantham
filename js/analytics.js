/* ===========================
   analytics.js — Dashboard Analytics
   Nellai Aanantham
   =========================== */

const AnalyticsManager = (() => {
  let pnlChart = null, categoryChart = null, trendChart = null, typeChart = null;

  function init() { refresh(); }

  async function refresh() {
    const inventory = await getAllRecords(STORES.INVENTORY);
    const transactions = await getAllRecords(STORES.TRANSACTIONS);
    const ingredients = inventory.filter(i => i.type === 'ingredient');

    const now = new Date();
    const thisMonth = now.getMonth(), thisYear = now.getFullYear();

    const totalInventoryValue = ingredients.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);

    const monthlyTxns = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const monthlyRevenue = monthlyTxns.filter(tx => tx.txType === 'sale').reduce((s, tx) => s + tx.totalRevenue, 0);
    const monthlyCost = monthlyTxns.reduce((s, tx) => s + tx.totalCost, 0);
    const monthlyProfit = monthlyRevenue - monthlyCost;

    const expiringSoon = ingredients.filter(item => {
      const diff = daysUntilExpiry(item.expiryDate);
      return diff >= 0 && diff <= 7;
    }).length;
    const expiredCount = ingredients.filter(item => daysUntilExpiry(item.expiryDate) < 0).length;

    document.getElementById('card-inventory-value').textContent = '₹' + totalInventoryValue.toFixed(2);
    document.getElementById('card-revenue').textContent = '₹' + monthlyRevenue.toFixed(2);
    document.getElementById('card-cost').textContent = '₹' + monthlyCost.toFixed(2);

    const profitEl = document.getElementById('card-profit');
    profitEl.textContent = (monthlyProfit >= 0 ? '+₹' : '-₹') + Math.abs(monthlyProfit).toFixed(2);
    profitEl.className = 'card-value ' + (monthlyProfit >= 0 ? 'text-positive' : 'text-negative');

    document.getElementById('card-expiring').textContent = expiringSoon + (expiredCount > 0 ? ` (${expiredCount} expired)` : '');

    renderPnLChart(transactions);
    renderCategoryChart(ingredients);
    renderRevenueTrendChart(transactions);
    renderTypeBreakdownChart(inventory);
    renderQuickStats(inventory, transactions);
    renderTopItems(ingredients);
  }

  function daysUntilExpiry(dateStr) {
    if (!dateStr) return 999;
    const now = new Date(); now.setHours(0,0,0,0);
    const expiry = new Date(dateStr); expiry.setHours(0,0,0,0);
    return Math.ceil((expiry - now) / 86400000);
  }

  function renderPnLChart(transactions) {
    const months = [], revenueData = [], costData = [], profitData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const month = d.getMonth(), year = d.getFullYear();
      months.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
      const mt = transactions.filter(tx => { const td = new Date(tx.date); return td.getMonth() === month && td.getFullYear() === year; });
      const rev = mt.filter(t => t.txType === 'sale').reduce((s, t) => s + t.totalRevenue, 0);
      const cost = mt.reduce((s, t) => s + t.totalCost, 0);
      revenueData.push(rev); costData.push(cost); profitData.push(rev - cost);
    }
    const ctx = document.getElementById('chart-pnl').getContext('2d');
    if (pnlChart) pnlChart.destroy();
    pnlChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Revenue', data: revenueData, backgroundColor: 'rgba(16,185,129,0.7)', borderColor: 'rgba(16,185,129,1)', borderWidth: 1, borderRadius: 6 },
          { label: 'Cost', data: costData, backgroundColor: 'rgba(14,165,233,0.7)', borderColor: 'rgba(14,165,233,1)', borderWidth: 1, borderRadius: 6 },
          { label: 'Profit', data: profitData, backgroundColor: profitData.map(v => v >= 0 ? 'rgba(139,92,246,0.7)' : 'rgba(244,63,94,0.7)'), borderColor: profitData.map(v => v >= 0 ? 'rgba(139,92,246,1)' : 'rgba(244,63,94,1)'), borderWidth: 1, borderRadius: 6 },
        ],
      },
      options: chartOptions('₹'),
    });
  }

  function renderCategoryChart(ingredients) {
    const catMap = {};
    ingredients.forEach(item => {
      const cat = item.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + item.unitCost * item.quantity;
    });
    const labels = Object.keys(catMap), data = Object.values(catMap);
    const colors = ['rgba(99,102,241,0.8)','rgba(16,185,129,0.8)','rgba(245,158,11,0.8)','rgba(244,63,94,0.8)','rgba(14,165,233,0.8)','rgba(139,92,246,0.8)','rgba(249,115,22,0.8)','rgba(236,72,153,0.8)','rgba(34,211,238,0.8)','rgba(163,230,53,0.8)'];
    const ctx = document.getElementById('chart-category').getContext('2d');
    if (categoryChart) categoryChart.destroy();
    if (labels.length === 0) { categoryChart = null; return; }
    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderColor: 'rgba(17,24,39,1)', borderWidth: 3 }] },
      options: { responsive: true, maintainAspectRatio: true, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, usePointStyle: true, pointStyle: 'circle', padding: 12 } }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ₹${ctx.parsed.toFixed(2)}` } } } },
    });
  }

  function renderRevenueTrendChart(transactions) {
    const months = [], revenueData = [], cumulativeData = [];
    let cumulative = 0;
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const month = d.getMonth(), year = d.getFullYear();
      months.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
      const rev = transactions.filter(tx => { const td = new Date(tx.date); return td.getMonth() === month && td.getFullYear() === year && tx.txType === 'sale'; }).reduce((s, t) => s + t.totalRevenue, 0);
      revenueData.push(rev); cumulative += rev; cumulativeData.push(cumulative);
    }
    const ctx = document.getElementById('chart-revenue-trend').getContext('2d');
    if (trendChart) trendChart.destroy();
    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          { label: 'Monthly Revenue', data: revenueData, borderColor: 'rgba(16,185,129,1)', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: 'rgba(16,185,129,1)', pointBorderColor: '#111827', pointBorderWidth: 2 },
          { label: 'Cumulative Revenue', data: cumulativeData, borderColor: 'rgba(139,92,246,1)', backgroundColor: 'rgba(139,92,246,0.05)', fill: true, tension: 0.4, borderDash: [5, 5], pointRadius: 3, pointBackgroundColor: 'rgba(139,92,246,1)', pointBorderColor: '#111827', pointBorderWidth: 2 },
        ],
      },
      options: chartOptions('₹'),
    });
  }

  function renderTypeBreakdownChart(inventory) {
    const ingCost = inventory.filter(i => i.type === 'ingredient').reduce((s, i) => s + i.unitCost * i.quantity, 0);
    const processed = inventory.filter(i => i.type === 'processed');
    const procCost = processed.reduce((s, i) => s + (i.cost || 0) * (i.quantity || 0), 0);
    const ctx = document.getElementById('chart-type-breakdown').getContext('2d');
    if (typeChart) typeChart.destroy();
    if (ingCost === 0 && procCost === 0) { typeChart = null; return; }
    typeChart = new Chart(ctx, {
      type: 'pie',
      data: { labels: ['🧂 Ingredients', '📦 Products'], datasets: [{ data: [ingCost, procCost], backgroundColor: ['rgba(14,165,233,0.75)', 'rgba(139,92,246,0.75)'], borderColor: 'rgba(17,24,39,1)', borderWidth: 3 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, usePointStyle: true, pointStyle: 'circle', padding: 12 } }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ₹${ctx.parsed.toFixed(2)}` } } } },
    });
  }

  function renderQuickStats(inventory, transactions) {
    const ingredients = inventory.filter(i => i.type === 'ingredient');
    const totalItems = ingredients.reduce((s, i) => s + i.quantity, 0);
    const totalSales = transactions.filter(t => t.txType === 'sale').length;
    const allTimeRevenue = transactions.filter(t => t.txType === 'sale').reduce((s, t) => s + t.totalRevenue, 0);
    const allTimeCost = transactions.reduce((s, t) => s + t.totalCost, 0);
    const allTimeProfit = allTimeRevenue - allTimeCost;
    const avgProfitMargin = allTimeRevenue > 0 ? ((allTimeProfit / allTimeRevenue) * 100).toFixed(1) : '0.0';

    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card"><span class="stat-value">${ingredients.length}</span><span class="stat-label">Ingredients</span></div>
      <div class="stat-card"><span class="stat-value">${totalItems}</span><span class="stat-label">Total Units</span></div>
      <div class="stat-card"><span class="stat-value">${totalSales}</span><span class="stat-label">Total Sales</span></div>
      <div class="stat-card"><span class="stat-value">${avgProfitMargin}%</span><span class="stat-label">Profit Margin</span></div>
      <div class="stat-card"><span class="stat-value text-${allTimeProfit >= 0 ? 'positive' : 'negative'}">₹${Math.abs(allTimeProfit).toFixed(0)}</span><span class="stat-label">All-Time ${allTimeProfit >= 0 ? 'Profit' : 'Loss'}</span></div>
      <div class="stat-card"><span class="stat-value">${transactions.length}</span><span class="stat-label">Transactions</span></div>
    `;
  }

  function renderTopItems(ingredients) {
    const container = document.getElementById('top-items-list');
    if (ingredients.length === 0) { container.innerHTML = '<p class="text-muted">No ingredients yet</p>'; return; }
    const sorted = [...ingredients].sort((a, b) => (b.unitCost * b.quantity) - (a.unitCost * a.quantity)).slice(0, 5);
    const maxVal = sorted[0] ? sorted[0].unitCost * sorted[0].quantity : 1;
    container.innerHTML = sorted.map((item, i) => {
      const val = item.unitCost * item.quantity;
      const pct = maxVal > 0 ? (val / maxVal * 100) : 0;
      return `<div class="top-item">
        <div class="top-item-rank">${i + 1}</div>
        <div class="top-item-info"><div class="top-item-name">🧂 ${esc(item.name)}</div><div class="top-item-bar"><div class="top-item-bar-fill" style="width:${pct}%"></div></div></div>
        <div class="top-item-value">₹${val.toFixed(0)}</div>
      </div>`;
    }).join('');
  }

  function chartOptions(prefix) {
    return {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, usePointStyle: true, pointStyle: 'circle' } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { family: 'Inter' } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#64748b', font: { family: 'Inter' }, callback: v => prefix + v }, grid: { color: 'rgba(255,255,255,0.04)' } },
      },
    };
  }

  return { init, refresh };
})();
