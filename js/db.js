/* ===========================
   db.js — IndexedDB Data Layer
   =========================== */

const DB_NAME = 'AnnaInventoryDB';
const DB_VERSION = 1;

const STORES = {
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  TRANSACTIONS: 'transactions',
};

let _db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      // Products store
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        const ps = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id', autoIncrement: true });
        ps.createIndex('name', 'name', { unique: false });
        ps.createIndex('type', 'type', { unique: false });
        ps.createIndex('category', 'category', { unique: false });
      }

      // Inventory store
      if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
        const inv = db.createObjectStore(STORES.INVENTORY, { keyPath: 'id', autoIncrement: true });
        inv.createIndex('productId', 'productId', { unique: false });
        inv.createIndex('type', 'type', { unique: false });
        inv.createIndex('expiryDate', 'expiryDate', { unique: false });
        inv.createIndex('addedAt', 'addedAt', { unique: false });
      }

      // Transactions store
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const tx = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id', autoIncrement: true });
        tx.createIndex('date', 'date', { unique: false });
        tx.createIndex('type', 'type', { unique: false });
        tx.createIndex('txType', 'txType', { unique: false });
      }
    };

    request.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

async function addRecord(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.add(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getRecord(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllRecords(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function updateRecord(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deleteRecord(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function clearStore(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
