/* ===========================
   analytics.js — Dashboard Analytics
   =========================== */

const AnalyticsManager = (() => {
  let pnlChart = null;
  let categoryChart = null;
  let trendChart = null;
  let typeChart = null;

  function init() {
    refresh();
  }

  async function refresh() {
    const inventory = await getAllRecords(STORES.INVENTORY);
    const transactions = await getAllRecords(STORES.TRANSACTIONS);

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Summary calculations
    const totalInventoryValue = inventory.reduce((sum, item) => sum + item.cost * item.quantity, 0);

    const monthlyTxns = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const monthlyRevenue = monthlyTxns
      .filter(tx => tx.txType === 'sale')
      .reduce((sum, tx) => sum + tx.totalRevenue, 0);

    const monthlyCost = monthlyTxns
      .reduce((sum, tx) => sum + tx.totalCost, 0);

    const monthlyProfit = monthlyRevenue - monthlyCost;

    // Expiring soon count
    const expiringSoon = inventory.filter(item => {
      const diff = daysUntilExpiry(item.expiryDate);
      return diff >= 0 && diff <= 7;
    }).length;

    const expiredCount = inventory.filter(item => daysUntilExpiry(item.expiryDate) < 0).length;

    // Update cards
    document.getElementById('card-inventory-value').textContent = '₹' + totalInventoryValue.toFixed(2);
    document.getElementById('card-revenue').textContent = '₹' + monthlyRevenue.toFixed(2);
    document.getElementById('card-cost').textContent = '₹' + monthlyCost.toFixed(2);

    const profitEl = document.getElementById('card-profit');
    profitEl.textContent = (monthlyProfit >= 0 ? '+₹' : '-₹') + Math.abs(monthlyProfit).toFixed(2);
    profitEl.className = 'card-value ' + (monthlyProfit >= 0 ? 'text-positive' : 'text-negative');

    document.getElementById('card-expiring').textContent = expiringSoon + (expiredCount > 0 ? ` (${expiredCount} expired)` : '');

    // Charts
    renderPnLChart(transactions);
    renderCategoryChart(inventory);
    renderRevenueTrendChart(transactions);
    renderTypeBreakdownChart(inventory);

    // Extra panels
    renderQuickStats(inventory, transactions);
    renderTopItems(inventory);
  }

  function daysUntilExpiry(dateStr) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  }

  // ---- P&L Bar Chart ----
  function renderPnLChart(transactions) {
    const months = [];
    const revenueData = [];
    const costData = [];
    const profitData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.getMonth();
      const year = d.getFullYear();
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push(label);

      const monthTxns = transactions.filter(tx => {
        const td = new Date(tx.date);
        return td.getMonth() === month && td.getFullYear() === year;
      });

      const rev = monthTxns.filter(t => t.txType === 'sale').reduce((s, t) => s + t.totalRevenue, 0);
      const cost = monthTxns.reduce((s, t) => s + t.totalCost, 0);
      revenueData.push(rev);
      costData.push(cost);
      profitData.push(rev - cost);
    }

    const ctx = document.getElementById('chart-pnl').getContext('2d');
    if (pnlChart) pnlChart.destroy();

    pnlChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Revenue',
            data: revenueData,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: 'Cost',
            data: costData,
            backgroundColor: 'rgba(14, 165, 233, 0.7)',
            borderColor: 'rgba(14, 165, 233, 1)',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: 'Profit',
            data: profitData,
            backgroundColor: profitData.map(v => v >= 0 ? 'rgba(139, 92, 246, 0.7)' : 'rgba(244, 63, 94, 0.7)'),
            borderColor: profitData.map(v => v >= 0 ? 'rgba(139, 92, 246, 1)' : 'rgba(244, 63, 94, 1)'),
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, usePointStyle: true, pointStyle: 'circle' },
          },
        },
        scales: {
          x: {
            ticks: { color: '#64748b', font: { family: 'Inter' } },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
          y: {
            ticks: { color: '#64748b', font: { family: 'Inter' }, callback: v => '₹' + v },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
        },
      },
    });
  }

  // ---- Category Doughnut Chart ----
  function renderCategoryChart(inventory) {
    const nameMap = {};
    inventory.forEach(item => {
      if (!nameMap[item.name]) nameMap[item.name] = 0;
      nameMap[item.name] += item.cost * item.quantity;
    });

    const catMap = {};
    inventory.forEach(item => {
      const cat = item.category || item.type;
      if (!catMap[cat]) catMap[cat] = 0;
      catMap[cat] += item.cost * item.quantity;
    });

    const useMap = Object.keys(nameMap).length <= 10 ? nameMap : catMap;
    const labels = Object.keys(useMap);
    const data = Object.values(useMap);

    const colors = [
      'rgba(99, 102, 241, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(244, 63, 94, 0.8)',
      'rgba(14, 165, 233, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(249, 115, 22, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(34, 211, 238, 0.8)',
      'rgba(163, 230, 53, 0.8)',
    ];

    const ctx = document.getElementById('chart-category').getContext('2d');
    if (categoryChart) categoryChart.destroy();

    if (labels.length === 0) {
      categoryChart = null;
      return;
    }

    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: 'rgba(17, 24, 39, 1)',
          borderWidth: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, usePointStyle: true, pointStyle: 'circle', padding: 16 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ₹${ctx.parsed.toFixed(2)}`,
            },
          },
        },
      },
    });
  }

  // ---- Revenue Trend Line Chart ----
  function renderRevenueTrendChart(transactions) {
    const months = [];
    const revenueData = [];
    const cumulativeData = [];
    let cumulative = 0;

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.getMonth();
      const year = d.getFullYear();
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push(label);

      const rev = transactions
        .filter(tx => {
          const td = new Date(tx.date);
          return td.getMonth() === month && td.getFullYear() === year && tx.txType === 'sale';
        })
        .reduce((s, t) => s + t.totalRevenue, 0);

      revenueData.push(rev);
      cumulative += rev;
      cumulativeData.push(cumulative);
    }

    const ctx = document.getElementById('chart-revenue-trend').getContext('2d');
    if (trendChart) trendChart.destroy();

    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Monthly Revenue',
            data: revenueData,
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: 'rgba(16, 185, 129, 1)',
            pointBorderColor: '#111827',
            pointBorderWidth: 2,
          },
          {
            label: 'Cumulative Revenue',
            data: cumulativeData,
            borderColor: 'rgba(139, 92, 246, 1)',
            backgroundColor: 'rgba(139, 92, 246, 0.05)',
            fill: true,
            tension: 0.4,
            borderDash: [5, 5],
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: 'rgba(139, 92, 246, 1)',
            pointBorderColor: '#111827',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, usePointStyle: true, pointStyle: 'circle' },
          },
        },
        scales: {
          x: {
            ticks: { color: '#64748b', font: { family: 'Inter' } },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
          y: {
            ticks: { color: '#64748b', font: { family: 'Inter' }, callback: v => '₹' + v },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
        },
      },
    });
  }

  // ---- Ingredients vs Processed Pie Chart ----
  function renderTypeBreakdownChart(inventory) {
    const ingredientCost = inventory
      .filter(i => i.type === 'ingredient')
      .reduce((s, i) => s + i.cost * i.quantity, 0);

    const processedCost = inventory
      .filter(i => i.type === 'processed')
      .reduce((s, i) => s + i.cost * i.quantity, 0);

    const ctx = document.getElementById('chart-type-breakdown').getContext('2d');
    if (typeChart) typeChart.destroy();

    if (ingredientCost === 0 && processedCost === 0) {
      typeChart = null;
      return;
    }

    typeChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['🧂 Ingredients', '📦 Processed'],
        datasets: [{
          data: [ingredientCost, processedCost],
          backgroundColor: ['rgba(14, 165, 233, 0.75)', 'rgba(139, 92, 246, 0.75)'],
          borderColor: 'rgba(17, 24, 39, 1)',
          borderWidth: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, usePointStyle: true, pointStyle: 'circle', padding: 16 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ₹${ctx.parsed.toFixed(2)}`,
            },
          },
        },
      },
    });
  }

  // ---- Quick Stats Panel ----
  function renderQuickStats(inventory, transactions) {
    const totalItems = inventory.reduce((s, i) => s + i.quantity, 0);
    const totalProducts = inventory.length;
    const totalTransactions = transactions.length;
    const totalSales = transactions.filter(t => t.txType === 'sale').length;
    const totalPurchases = transactions.filter(t => t.txType === 'purchase').length;
    const allTimeRevenue = transactions.filter(t => t.txType === 'sale').reduce((s, t) => s + t.totalRevenue, 0);
    const allTimeCost = transactions.reduce((s, t) => s + t.totalCost, 0);
    const allTimeProfit = allTimeRevenue - allTimeCost;

    const avgProfitMargin = allTimeRevenue > 0
      ? ((allTimeProfit / allTimeRevenue) * 100).toFixed(1)
      : '0.0';

    const grid = document.getElementById('stats-grid');
    grid.innerHTML = `
      <div class="stat-card">
        <span class="stat-value">${totalItems}</span>
        <span class="stat-label">Total Units</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${totalProducts}</span>
        <span class="stat-label">Unique Items</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${totalSales}</span>
        <span class="stat-label">Total Sales</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${totalPurchases}</span>
        <span class="stat-label">Total Purchases</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${avgProfitMargin}%</span>
        <span class="stat-label">Profit Margin</span>
      </div>
      <div class="stat-card">
        <span class="stat-value text-${allTimeProfit >= 0 ? 'positive' : 'negative'}">₹${Math.abs(allTimeProfit).toFixed(0)}</span>
        <span class="stat-label">All-Time ${allTimeProfit >= 0 ? 'Profit' : 'Loss'}</span>
      </div>
    `;
  }

  // ---- Top Items by Value ----
  function renderTopItems(inventory) {
    const container = document.getElementById('top-items-list');

    if (inventory.length === 0) {
      container.innerHTML = '<p class="text-muted">No inventory items yet</p>';
      return;
    }

    // Aggregate by name
    const itemMap = {};
    inventory.forEach(item => {
      if (!itemMap[item.name]) {
        itemMap[item.name] = { value: 0, type: item.type, qty: 0 };
      }
      itemMap[item.name].value += item.cost * item.quantity;
      itemMap[item.name].qty += item.quantity;
    });

    const sorted = Object.entries(itemMap)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 5);

    const maxVal = sorted[0] ? sorted[0][1].value : 1;

    container.innerHTML = sorted.map(([name, data], i) => {
      const pct = maxVal > 0 ? (data.value / maxVal * 100) : 0;
      const icon = data.type === 'ingredient' ? '🧂' : '📦';
      return `
        <div class="top-item">
          <div class="top-item-rank">${i + 1}</div>
          <div class="top-item-info">
            <div class="top-item-name">${icon} ${esc(name)}</div>
            <div class="top-item-bar">
              <div class="top-item-bar-fill" style="width: ${pct}%"></div>
            </div>
          </div>
          <div class="top-item-value">₹${data.value.toFixed(0)}</div>
        </div>
      `;
    }).join('');
  }

  return { init, refresh };
})();
