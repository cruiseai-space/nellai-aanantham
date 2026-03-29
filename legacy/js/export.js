/* ===========================
   export.js — Data Export & Import
   Nellai Aanantham
   =========================== */

const ExportManager = (() => {
  let importMode = 'merge';

  function init() {
    document.getElementById('btn-export').addEventListener('click', () => document.getElementById('modal-export').classList.add('open'));
    document.getElementById('export-txt').addEventListener('click', exportText);
    document.getElementById('export-xlsx').addEventListener('click', exportExcel);
    document.getElementById('export-json').addEventListener('click', exportJSON);
    document.getElementById('btn-import').addEventListener('click', () => document.getElementById('modal-import').classList.add('open'));
    document.getElementById('import-xlsx-btn').addEventListener('click', () => triggerFileInput('.xlsx'));
    document.getElementById('import-json-btn').addEventListener('click', () => triggerFileInput('.json'));
    document.getElementById('import-file-input').addEventListener('change', handleFileSelect);

    document.querySelectorAll('.import-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.import-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        importMode = btn.dataset.mode;
      });
    });
  }

  function triggerFileInput(accept) {
    const input = document.getElementById('import-file-input');
    input.accept = accept; input.value = ''; input.click();
  }

  async function handleFileSelect(e) {
    const file = e.target.files[0]; if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    try {
      if (ext === 'xlsx') await importExcel(file);
      else if (ext === 'json') await importJSON(file);
      else { showToast('Unsupported format', 'error'); return; }
      document.getElementById('modal-import').classList.remove('open');
      refreshAllViews();
    } catch (err) { showToast('Import failed: ' + err.message, 'error'); }
  }

  /* ---- IMPORT ---- */

  async function importExcel(file) {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    if (importMode === 'replace') {
      await clearStore(STORES.PRODUCTS); await clearStore(STORES.INVENTORY);
      await clearStore(STORES.TRANSACTIONS); await clearStore(STORES.BILLS); await clearStore(STORES.EXPENSES);
    }
    let ic = 0, tc = 0;
    if (wb.SheetNames.includes('Ingredients')) {
      for (const row of XLSX.utils.sheet_to_json(wb.Sheets['Ingredients'])) {
        if (!row.Name) continue;
        await addRecord(STORES.INVENTORY, {
          name: row.Name, category: row.Category || 'Other', type: 'ingredient',
          unit: row.Unit || 'mg', quantity: parseFloat(row.Quantity) || 0,
          unitCost: parseFloat(row['Unit Cost']) || 0, supplier: row.Supplier || '',
          addedAt: parseDate(row['Added']) || new Date().toISOString(),
          expiryDate: parseDate(row['Expiry']) || futureDate(30),
        }); ic++;
      }
    }
    if (wb.SheetNames.includes('Bills')) {
      for (const row of XLSX.utils.sheet_to_json(wb.Sheets['Bills'])) {
        if (!row['Bill No']) continue;
        await addRecord(STORES.BILLS, {
          billNo: row['Bill No'], customer: row.Customer || 'Walk-in',
          items: [], total: parseFloat(row.Total) || 0, totalCost: 0, profit: parseFloat(row.Total) || 0,
          date: parseDate(row.Date) || new Date().toISOString(),
        }); tc++;
      }
    }
    showToast(`Imported ${ic} ingredients, ${tc} bills`, 'success');
  }

  async function importJSON(file) {
    const data = JSON.parse(await file.text());
    if (!data || typeof data !== 'object') throw new Error('Invalid JSON');
    if (importMode === 'replace') {
      await clearStore(STORES.PRODUCTS); await clearStore(STORES.INVENTORY);
      await clearStore(STORES.TRANSACTIONS); await clearStore(STORES.BILLS); await clearStore(STORES.EXPENSES);
    }
    let counts = { products: 0, inventory: 0, transactions: 0, bills: 0, expenses: 0 };
    for (const [key, store] of [['products', STORES.PRODUCTS], ['inventory', STORES.INVENTORY], ['transactions', STORES.TRANSACTIONS], ['bills', STORES.BILLS], ['expenses', STORES.EXPENSES]]) {
      if (Array.isArray(data[key])) {
        for (const item of data[key]) { const { id, ...rest } = item; await addRecord(store, rest); counts[key]++; }
      }
    }
    showToast(`Imported: ${counts.products} products, ${counts.inventory} inventory, ${counts.transactions} transactions, ${counts.bills} bills, ${counts.expenses} expenses`, 'success');
  }

  /* ---- EXPORT TEXT ---- */
  async function exportText() {
    try {
      const inventory = (await getAllRecords(STORES.INVENTORY)).filter(i => i.type === 'ingredient');
      const bills = await getAllRecords(STORES.BILLS);
      const expenses = await getAllRecords(STORES.EXPENSES);
      let text = '='.repeat(50) + '\n  NELLAI AANANTHAM — DATA EXPORT\n  ' + new Date().toLocaleString() + '\n' + '='.repeat(50) + '\n\n';
      text += '── INGREDIENTS ──\n\n';
      if (inventory.length === 0) text += '  No ingredients.\n';
      else inventory.forEach(i => { text += `  ${i.name} (${i.category}) — ${i.quantity} ${i.unit} @ ₹${i.unitCost}/${i.unit}\n`; });
      text += '\n── BILLS ──\n\n';
      if (bills.length === 0) text += '  No bills.\n';
      else bills.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(b => {
        text += `  ${b.billNo} | ${new Date(b.date).toLocaleString()} | ${b.customer} | ₹${b.total.toFixed(2)}\n`;
      });
      text += '\n── EXPENSES ──\n\n';
      if (expenses.length === 0) text += '  No expenses.\n';
      else expenses.forEach(e => { text += `  ${e.name} (${e.category}) — ₹${e.amount.toFixed(2)} | ${e.date}\n`; });
      text += '\n' + '='.repeat(50) + '\n';
      downloadFile(text, `nellai-export-${dateStamp()}.txt`, 'text/plain');
      showToast('Text file exported', 'success');
      document.getElementById('modal-export').classList.remove('open');
    } catch (err) { showToast('Export failed: ' + err.message, 'error'); }
  }

  /* ---- EXPORT EXCEL ---- */
  async function exportExcel() {
    try {
      const inventory = (await getAllRecords(STORES.INVENTORY)).filter(i => i.type === 'ingredient');
      const products = await getAllRecords(STORES.PRODUCTS);
      const bills = await getAllRecords(STORES.BILLS);
      const expenses = await getAllRecords(STORES.EXPENSES);
      const wb = XLSX.utils.book_new();

      const ingData = inventory.map(i => ({ Name: i.name, Category: i.category, Quantity: i.quantity, Unit: i.unit, 'Unit Cost': i.unitCost, 'Total Value': i.unitCost * i.quantity, Supplier: i.supplier || '', Added: formatDate(i.addedAt), Expiry: formatDate(i.expiryDate), Status: getStatusText(i.expiryDate) }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ingData.length ? ingData : [{'No data': ''}]), 'Ingredients');

      const prodData = products.map(p => ({ Name: p.name, Category: p.category, 'Sale Price': p.defaultSalePrice, 'Est Cost': p.defaultCost || 0, 'Ingredients Count': (p.recipe || []).length }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodData.length ? prodData : [{'No data': ''}]), 'Products');

      const billData = bills.map(b => ({ 'Bill No': b.billNo, Date: formatDate(b.date), Customer: b.customer, Items: b.items.length, Total: b.total }));
      billData.sort((a, b) => new Date(b.Date) - new Date(a.Date));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(billData.length ? billData : [{'No data': ''}]), 'Bills');

      const expData = expenses.map(e => ({ Name: e.name, Category: e.category, Amount: e.amount, Date: formatDate(e.date), Recurring: e.recurring || 'No', Notes: e.notes || '' }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expData.length ? expData : [{'No data': ''}]), 'Expenses');

      XLSX.writeFile(wb, `nellai-export-${dateStamp()}.xlsx`);
      showToast('Excel file exported', 'success');
      document.getElementById('modal-export').classList.remove('open');
    } catch (err) { showToast('Export failed: ' + err.message, 'error'); }
  }

  /* ---- EXPORT JSON ---- */
  async function exportJSON() {
    try {
      const data = {
        products: await getAllRecords(STORES.PRODUCTS),
        inventory: await getAllRecords(STORES.INVENTORY),
        transactions: await getAllRecords(STORES.TRANSACTIONS),
        bills: await getAllRecords(STORES.BILLS),
        expenses: await getAllRecords(STORES.EXPENSES),
        exportedAt: new Date().toISOString(),
      };
      downloadFile(JSON.stringify(data, null, 2), `nellai-backup-${dateStamp()}.json`, 'application/json');
      showToast('JSON backup exported', 'success');
      document.getElementById('modal-export').classList.remove('open');
    } catch (err) { showToast('Export failed: ' + err.message, 'error'); }
  }

  /* ---- Helpers ---- */
  function formatDate(dateStr) { if (!dateStr) return ''; return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  function getStatusText(dateStr) {
    if (!dateStr) return 'Good';
    const now = new Date(); now.setHours(0,0,0,0);
    const exp = new Date(dateStr); exp.setHours(0,0,0,0);
    const diff = Math.ceil((exp - now) / 86400000);
    if (diff < 0) return 'Expired'; if (diff <= 7) return `Expiring (${diff}d)`; return 'Good';
  }
  function dateStamp() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }
  function parseDate(val) { if (!val) return null; const d = new Date(val); return isNaN(d.getTime()) ? null : d.toISOString(); }
  function futureDate(days) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split('T')[0]; }

  function refreshAllViews() {
    if (typeof ProductsManager !== 'undefined') ProductsManager.render();
    if (typeof InventoryManager !== 'undefined') InventoryManager.renderIngredients();
    if (typeof BillingManager !== 'undefined') BillingManager.renderCurrentSubTab();
    if (typeof AnalyticsManager !== 'undefined') AnalyticsManager.refresh();
  }

  return { init, exportJSON };
})();
