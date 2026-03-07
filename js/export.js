/* ===========================
   export.js — Data Export & Import (TXT, XLSX, JSON)
   =========================== */

const ExportManager = (() => {
  let importMode = 'merge'; // 'merge' or 'replace'

  function init() {
    // Export
    document.getElementById('btn-export').addEventListener('click', openExportModal);
    document.getElementById('export-txt').addEventListener('click', exportText);
    document.getElementById('export-xlsx').addEventListener('click', exportExcel);
    document.getElementById('export-json').addEventListener('click', exportJSON);
    document.querySelectorAll('[data-close="modal-export"]').forEach(btn => btn.addEventListener('click', closeExportModal));

    // Import
    document.getElementById('btn-import').addEventListener('click', openImportModal);
    document.getElementById('import-xlsx-btn').addEventListener('click', () => triggerFileInput('.xlsx'));
    document.getElementById('import-json-btn').addEventListener('click', () => triggerFileInput('.json'));
    document.getElementById('import-file-input').addEventListener('change', handleFileSelect);
    document.querySelectorAll('[data-close="modal-import"]').forEach(btn => btn.addEventListener('click', closeImportModal));

    // Import mode toggle
    document.querySelectorAll('.import-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.import-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        importMode = btn.dataset.mode;
      });
    });
  }

  // ---- Export Modal ----
  function openExportModal() {
    document.getElementById('modal-export').classList.add('open');
  }
  function closeExportModal() {
    document.getElementById('modal-export').classList.remove('open');
  }

  // ---- Import Modal ----
  function openImportModal() {
    document.getElementById('modal-import').classList.add('open');
  }
  function closeImportModal() {
    document.getElementById('modal-import').classList.remove('open');
  }

  function triggerFileInput(accept) {
    const input = document.getElementById('import-file-input');
    input.accept = accept;
    input.value = '';
    input.click();
  }

  async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    try {
      if (ext === 'xlsx') {
        await importExcel(file);
      } else if (ext === 'json') {
        await importJSON(file);
      } else {
        showToast('Unsupported file format', 'error');
        return;
      }
      closeImportModal();
      refreshAllViews();
    } catch (err) {
      showToast('Import failed: ' + err.message, 'error');
    }
  }

  // ---- IMPORT EXCEL ----
  async function importExcel(file) {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });

    if (importMode === 'replace') {
      await clearStore(STORES.PRODUCTS);
      await clearStore(STORES.INVENTORY);
      await clearStore(STORES.TRANSACTIONS);
    }

    let inventoryCount = 0;
    let transactionCount = 0;

    // Import Inventory sheet
    if (wb.SheetNames.includes('Inventory')) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets['Inventory']);
      for (const row of rows) {
        if (!row.Name) continue;
        const type = (row.Type || '').toLowerCase().includes('process') ? 'processed' : 'ingredient';
        await addRecord(STORES.INVENTORY, {
          productId: null,
          name: row.Name,
          type: type,
          cost: parseFloat(row['Unit Cost']) || 0,
          salePrice: parseFloat(row['Sale Price']) || 0,
          quantity: parseInt(row.Quantity) || 1,
          addedAt: parseDate(row['Added Date']) || new Date().toISOString(),
          expiryDate: parseDate(row['Expiry Date']) || getFutureDate(30),
        });
        inventoryCount++;
      }
    }

    // Import Transactions sheet
    if (wb.SheetNames.includes('Transactions')) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets['Transactions']);
      for (const row of rows) {
        if (!row.Item) continue;
        const isSale = (row.Transaction || '').toLowerCase().includes('sale');
        const type = (row['Item Type'] || '').toLowerCase().includes('process') ? 'processed' : 'ingredient';
        await addRecord(STORES.TRANSACTIONS, {
          inventoryItemId: null,
          name: row.Item,
          type: type,
          txType: isSale ? 'sale' : 'purchase',
          quantity: parseInt(row.Quantity) || 1,
          costPerUnit: parseFloat(row['Cost/Unit']) || 0,
          salePricePerUnit: parseFloat(row['Price/Unit']) || 0,
          totalCost: parseFloat(row['Total Cost']) || 0,
          totalRevenue: parseFloat(row['Total Revenue']) || 0,
          profit: parseFloat(row.Profit) || 0,
          date: parseDate(row.Date) || new Date().toISOString(),
        });
        transactionCount++;
      }
    }

    showToast(`Imported ${inventoryCount} inventory items, ${transactionCount} transactions from Excel`, 'success');
  }

  // ---- IMPORT JSON ----
  async function importJSON(file) {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid JSON file format');
    }

    if (importMode === 'replace') {
      await clearStore(STORES.PRODUCTS);
      await clearStore(STORES.INVENTORY);
      await clearStore(STORES.TRANSACTIONS);
    }

    let counts = { products: 0, inventory: 0, transactions: 0 };

    if (Array.isArray(data.products)) {
      for (const item of data.products) {
        const { id, ...rest } = item; // strip id so IndexedDB auto-generates
        await addRecord(STORES.PRODUCTS, rest);
        counts.products++;
      }
    }

    if (Array.isArray(data.inventory)) {
      for (const item of data.inventory) {
        const { id, ...rest } = item;
        await addRecord(STORES.INVENTORY, rest);
        counts.inventory++;
      }
    }

    if (Array.isArray(data.transactions)) {
      for (const item of data.transactions) {
        const { id, ...rest } = item;
        await addRecord(STORES.TRANSACTIONS, rest);
        counts.transactions++;
      }
    }

    showToast(`Imported ${counts.products} products, ${counts.inventory} inventory items, ${counts.transactions} transactions`, 'success');
  }

  // ---- EXPORT TEXT ----
  async function exportText() {
    try {
      const inventory = await getAllRecords(STORES.INVENTORY);
      const transactions = await getAllRecords(STORES.TRANSACTIONS);

      const now = new Date();
      let text = '';
      text += '='.repeat(60) + '\n';
      text += '  INVENTORY MANAGER — DATA EXPORT\n';
      text += `  Generated: ${now.toLocaleString()}\n`;
      text += '='.repeat(60) + '\n\n';

      text += '── INVENTORY ──────────────────────────────────────────\n\n';
      if (inventory.length === 0) {
        text += '  No inventory items.\n';
      } else {
        inventory.forEach(item => {
          const status = getExpiryStatusText(item.expiryDate);
          text += `  ${item.name} (${item.type})\n`;
          text += `    Qty: ${item.quantity}  |  Cost: ₹${item.cost.toFixed(2)}`;
          if (item.type === 'processed') text += `  |  Sale Price: ₹${item.salePrice.toFixed(2)}`;
          text += '\n';
          text += `    Added: ${formatDate(item.addedAt)}  |  Expiry: ${formatDate(item.expiryDate)}  |  Status: ${status}\n\n`;
        });
      }

      text += '\n── TRANSACTIONS ───────────────────────────────────────\n\n';
      if (transactions.length === 0) {
        text += '  No transactions.\n';
      } else {
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        transactions.forEach(tx => {
          text += `  [${tx.txType.toUpperCase()}] ${tx.name}\n`;
          text += `    Date: ${formatDate(tx.date)}  |  Qty: ${tx.quantity}\n`;
          text += `    Cost: ₹${tx.totalCost.toFixed(2)}  |  Revenue: ₹${tx.totalRevenue.toFixed(2)}  |  Profit: ₹${tx.profit.toFixed(2)}\n\n`;
        });
      }

      text += '\n── SUMMARY ────────────────────────────────────────────\n\n';
      const totalInvValue = inventory.reduce((s, i) => s + i.cost * i.quantity, 0);
      const totalRevenue = transactions.filter(t => t.txType === 'sale').reduce((s, t) => s + t.totalRevenue, 0);
      const totalCost = transactions.reduce((s, t) => s + t.totalCost, 0);
      text += `  Total Inventory Value: ₹${totalInvValue.toFixed(2)}\n`;
      text += `  Total Revenue:         ₹${totalRevenue.toFixed(2)}\n`;
      text += `  Total Cost:            ₹${totalCost.toFixed(2)}\n`;
      text += `  Total Profit:          ₹${(totalRevenue - totalCost).toFixed(2)}\n`;
      text += '\n' + '='.repeat(60) + '\n';

      downloadFile(text, `inventory-export-${dateStamp()}.txt`, 'text/plain');
      showToast('Text file exported', 'success');
      closeExportModal();
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    }
  }

  // ---- EXPORT EXCEL ----
  async function exportExcel() {
    try {
      const inventory = await getAllRecords(STORES.INVENTORY);
      const transactions = await getAllRecords(STORES.TRANSACTIONS);

      const wb = XLSX.utils.book_new();

      const invData = inventory.map(item => ({
        Name: item.name,
        Type: item.type,
        Quantity: item.quantity,
        'Unit Cost': item.cost,
        'Sale Price': item.type === 'processed' ? item.salePrice : '',
        'Total Value': item.cost * item.quantity,
        'Added Date': formatDate(item.addedAt),
        'Expiry Date': formatDate(item.expiryDate),
        Status: getExpiryStatusText(item.expiryDate),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invData.length ? invData : [{ 'No data': '' }]), 'Inventory');

      const txData = transactions.map(tx => ({
        Date: formatDate(tx.date),
        Item: tx.name,
        Transaction: tx.txType === 'sale' ? 'Sale' : 'Purchase',
        'Item Type': tx.type,
        Quantity: tx.quantity,
        'Cost/Unit': tx.costPerUnit,
        'Price/Unit': tx.salePricePerUnit || '',
        'Total Cost': tx.totalCost,
        'Total Revenue': tx.totalRevenue || '',
        Profit: tx.profit,
      }));
      txData.sort((a, b) => new Date(b.Date) - new Date(a.Date));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txData.length ? txData : [{ 'No data': '' }]), 'Transactions');

      const totalInvValue = inventory.reduce((s, i) => s + i.cost * i.quantity, 0);
      const totalRevenue = transactions.filter(t => t.txType === 'sale').reduce((s, t) => s + t.totalRevenue, 0);
      const totalCost = transactions.reduce((s, t) => s + t.totalCost, 0);
      const summaryData = [
        { Metric: 'Total Inventory Value', Value: totalInvValue },
        { Metric: 'Total Revenue', Value: totalRevenue },
        { Metric: 'Total Cost', Value: totalCost },
        { Metric: 'Total Profit', Value: totalRevenue - totalCost },
        { Metric: 'Total Items in Stock', Value: inventory.reduce((s, i) => s + i.quantity, 0) },
        { Metric: 'Total Transactions', Value: transactions.length },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary');

      XLSX.writeFile(wb, `inventory-export-${dateStamp()}.xlsx`);
      showToast('Excel file exported', 'success');
      closeExportModal();
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    }
  }

  // ---- EXPORT JSON (full backup) ----
  async function exportJSON() {
    try {
      const products = await getAllRecords(STORES.PRODUCTS);
      const inventory = await getAllRecords(STORES.INVENTORY);
      const transactions = await getAllRecords(STORES.TRANSACTIONS);
      const data = { products, inventory, transactions, exportedAt: new Date().toISOString() };
      downloadFile(JSON.stringify(data, null, 2), `inventory-backup-${dateStamp()}.json`, 'application/json');
      showToast('JSON backup exported', 'success');
      closeExportModal();
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    }
  }

  // ---- Helpers ----
  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getExpiryStatusText(dateStr) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr); expiry.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Expired';
    if (diff <= 7) return `Expiring (${diff}d)`;
    return 'Good';
  }

  function dateStamp() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function parseDate(val) {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  function getFutureDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  function refreshAllViews() {
    if (typeof ProductsManager !== 'undefined') ProductsManager.render();
    if (typeof InventoryManager !== 'undefined') {
      InventoryManager.refreshProductDropdown();
      InventoryManager.render();
    }
    if (typeof TransactionsManager !== 'undefined') TransactionsManager.render();
    if (typeof AnalyticsManager !== 'undefined') AnalyticsManager.refresh();
  }

  return { init, exportJSON };
})();
