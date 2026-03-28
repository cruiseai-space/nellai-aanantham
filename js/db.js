/* ===========================
   db.js — IndexedDB Data Layer
   Nellai Aanantham
   =========================== */

const DB_NAME = 'NellaiAananthamDB';
const DB_VERSION = 2;

const STORES = {
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  TRANSACTIONS: 'transactions',
  BILLS: 'bills',
  EXPENSES: 'expenses',
};

let _db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        const ps = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id', autoIncrement: true });
        ps.createIndex('name', 'name', { unique: false });
        ps.createIndex('type', 'type', { unique: false });
        ps.createIndex('category', 'category', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
        const inv = db.createObjectStore(STORES.INVENTORY, { keyPath: 'id', autoIncrement: true });
        inv.createIndex('productId', 'productId', { unique: false });
        inv.createIndex('type', 'type', { unique: false });
        inv.createIndex('expiryDate', 'expiryDate', { unique: false });
        inv.createIndex('addedAt', 'addedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const tx = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id', autoIncrement: true });
        tx.createIndex('date', 'date', { unique: false });
        tx.createIndex('type', 'type', { unique: false });
        tx.createIndex('txType', 'txType', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.BILLS)) {
        const bl = db.createObjectStore(STORES.BILLS, { keyPath: 'id', autoIncrement: true });
        bl.createIndex('date', 'date', { unique: false });
        bl.createIndex('billNo', 'billNo', { unique: true });
      }

      if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
        const ex = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id', autoIncrement: true });
        ex.createIndex('date', 'date', { unique: false });
        ex.createIndex('category', 'category', { unique: false });
      }
    };

    request.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    request.onerror = (e) => reject(e.target.error);
  });
}

/* --- CRUD helpers --- */
async function addRecord(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).add(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getRecord(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllRecords(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function updateRecord(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deleteRecord(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function clearStore(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/* =============================================
   SAMPLE DATA SEEDING
   ============================================= */

async function populateSampleData() {
  const existing = await getAllRecords(STORES.PRODUCTS);
  if (existing.length > 0) return; // already seeded

  /* --- Ingredients (unique) --- */
  const ingredients = [
    { name: 'Flour (Maida)', category: 'Dry Goods', quantity: 50000, unit: 'mg', unitCost: 0.04, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(90) },
    { name: 'Sugar', category: 'Dry Goods', quantity: 30000, unit: 'mg', unitCost: 0.04, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(180) },
    { name: 'Cocoa Powder', category: 'Dry Goods', quantity: 10000, unit: 'mg', unitCost: 0.15, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(120) },
    { name: 'Baking Powder', category: 'Dry Goods', quantity: 5000, unit: 'mg', unitCost: 0.20, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(180) },
    { name: 'Dark Chocolate', category: 'Dry Goods', quantity: 8000, unit: 'mg', unitCost: 0.30, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(90) },
    { name: 'Butter', category: 'Dairy', quantity: 10000, unit: 'mg', unitCost: 0.50, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(30) },
    { name: 'Eggs', category: 'Dairy', quantity: 120, unit: 'pcs', unitCost: 7.00, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(15) },
    { name: 'Milk', category: 'Dairy', quantity: 20000, unit: 'ml', unitCost: 0.06, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(7) },
    { name: 'Cream', category: 'Dairy', quantity: 5000, unit: 'ml', unitCost: 0.30, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(14) },
    { name: 'Whipped Cream', category: 'Dairy', quantity: 3000, unit: 'ml', unitCost: 0.40, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(14) },
    { name: 'Condensed Milk', category: 'Dairy', quantity: 5000, unit: 'ml', unitCost: 0.20, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(90) },
    { name: 'Vanilla Extract', category: 'Flavouring', quantity: 1000, unit: 'ml', unitCost: 1.50, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(180) },
    { name: 'Rose Essence', category: 'Flavouring', quantity: 500, unit: 'ml', unitCost: 1.00, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(180) },
    { name: 'Coffee Powder', category: 'Flavouring', quantity: 5000, unit: 'mg', unitCost: 0.80, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(120) },
    { name: 'Horlicks Powder', category: 'Flavouring', quantity: 5000, unit: 'mg', unitCost: 0.30, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(180) },
    { name: 'Boost Powder', category: 'Flavouring', quantity: 5000, unit: 'mg', unitCost: 0.35, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(180) },
    { name: 'Almonds (Badam)', category: 'Nuts & Dry Fruits', quantity: 3000, unit: 'mg', unitCost: 1.20, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(120) },
    { name: 'Saffron', category: 'Flavouring', quantity: 100, unit: 'mg', unitCost: 50.00, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(365) },
    { name: 'Pineapple', category: 'Fruits', quantity: 5000, unit: 'mg', unitCost: 0.08, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(7) },
    { name: 'Mango Pulp', category: 'Fruits', quantity: 3000, unit: 'ml', unitCost: 0.15, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(30) },
    { name: 'Strawberry', category: 'Fruits', quantity: 3000, unit: 'mg', unitCost: 0.30, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(7) },
    { name: 'Blueberry', category: 'Fruits', quantity: 2000, unit: 'mg', unitCost: 0.50, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(7) },
    { name: 'Butterscotch Chips', category: 'Toppings', quantity: 3000, unit: 'mg', unitCost: 0.80, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(90) },
    { name: 'Oreo Biscuits', category: 'Toppings', quantity: 100, unit: 'pcs', unitCost: 5.00, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(120) },
    { name: 'Kit Kat', category: 'Toppings', quantity: 60, unit: 'pcs', unitCost: 12.00, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(120) },
    { name: 'Gulab Jamun', category: 'Toppings', quantity: 50, unit: 'pcs', unitCost: 8.00, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(30) },
    { name: 'Rasamalai', category: 'Toppings', quantity: 40, unit: 'pcs', unitCost: 10.00, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(14) },
    { name: 'Food Colours', category: 'Flavouring', quantity: 500, unit: 'ml', unitCost: 2.00, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(365) },
    { name: 'Red Velvet Colour', category: 'Flavouring', quantity: 300, unit: 'ml', unitCost: 2.50, supplier: '', addedAt: new Date().toISOString(), expiryDate: futureDate(365) },
  ];

  // Insert ingredients and collect IDs
  const ingMap = {};
  for (const ing of ingredients) {
    const id = await addRecord(STORES.INVENTORY, { ...ing, type: 'ingredient' });
    ingMap[ing.name] = id;
  }

  /* --- Helper to build recipe refs --- */
  function r(name, qty, unit) {
    return { ingredientId: ingMap[name] || 0, name, qty, unit: unit || (ingredients.find(i=>i.name===name)||{}).unit || 'mg' };
  }

  /* --- Products with recipes --- */
  const products = [
    // Brownie (piece)
    { name: 'Classic Brownie', category: 'Brownie', type: 'processed', defaultSalePrice: 70, defaultExpiryDays: 5,
      recipe: [r('Flour (Maida)',150,'mg'), r('Sugar',80,'mg'), r('Butter',60,'mg'), r('Eggs',2,'pcs'), r('Cocoa Powder',30,'mg'), r('Baking Powder',5,'mg')] },
    { name: 'Double Chocolate', category: 'Brownie', type: 'processed', defaultSalePrice: 90, defaultExpiryDays: 5,
      recipe: [r('Flour (Maida)',150,'mg'), r('Sugar',80,'mg'), r('Butter',60,'mg'), r('Eggs',2,'pcs'), r('Cocoa Powder',40,'mg'), r('Dark Chocolate',50,'mg'), r('Baking Powder',5,'mg')] },
    { name: 'Triple Chocolate', category: 'Brownie', type: 'processed', defaultSalePrice: 110, defaultExpiryDays: 5,
      recipe: [r('Flour (Maida)',150,'mg'), r('Sugar',80,'mg'), r('Butter',70,'mg'), r('Eggs',2,'pcs'), r('Cocoa Powder',50,'mg'), r('Dark Chocolate',70,'mg'), r('Whipped Cream',30,'ml'), r('Baking Powder',5,'mg')] },
    { name: 'Brownie Balls', category: 'Brownie', type: 'processed', defaultSalePrice: 40, defaultExpiryDays: 5,
      recipe: [r('Flour (Maida)',80,'mg'), r('Sugar',50,'mg'), r('Butter',40,'mg'), r('Cocoa Powder',20,'mg'), r('Baking Powder',3,'mg')] },

    // Tres Leches
    { name: 'Rose Milk Tres Leches', category: 'Tres Leches', type: 'processed', defaultSalePrice: 55, defaultExpiryDays: 3,
      recipe: [r('Milk',100,'ml'), r('Cream',50,'ml'), r('Condensed Milk',40,'ml'), r('Rose Essence',5,'ml'), r('Sugar',30,'mg')] },
    { name: 'Horlicks Tres Leches', category: 'Tres Leches', type: 'processed', defaultSalePrice: 60, defaultExpiryDays: 3,
      recipe: [r('Milk',100,'ml'), r('Cream',50,'ml'), r('Condensed Milk',40,'ml'), r('Horlicks Powder',20,'mg'), r('Sugar',20,'mg')] },
    { name: 'Boost Tres Leches', category: 'Tres Leches', type: 'processed', defaultSalePrice: 65, defaultExpiryDays: 3,
      recipe: [r('Milk',100,'ml'), r('Cream',50,'ml'), r('Condensed Milk',40,'ml'), r('Boost Powder',20,'mg'), r('Sugar',20,'mg')] },
    { name: 'Rasamalai Tres Leches', category: 'Tres Leches', type: 'processed', defaultSalePrice: 70, defaultExpiryDays: 3,
      recipe: [r('Milk',100,'ml'), r('Cream',50,'ml'), r('Condensed Milk',40,'ml'), r('Rasamalai',2,'pcs'), r('Sugar',20,'mg')] },

    // Drinks
    { name: 'Hot Chocolate', category: 'Drinks', type: 'processed', defaultSalePrice: 80, defaultExpiryDays: 1,
      recipe: [r('Milk',200,'ml'), r('Cocoa Powder',20,'mg'), r('Sugar',20,'mg'), r('Whipped Cream',30,'ml')] },
    { name: 'Cold Coffee', category: 'Drinks', type: 'processed', defaultSalePrice: 60, defaultExpiryDays: 1,
      recipe: [r('Milk',200,'ml'), r('Coffee Powder',10,'mg'), r('Sugar',20,'mg')] },
    { name: 'Rose Milk', category: 'Drinks', type: 'processed', defaultSalePrice: 50, defaultExpiryDays: 1,
      recipe: [r('Milk',200,'ml'), r('Rose Essence',5,'ml'), r('Sugar',25,'mg')] },
    { name: 'Badam Milk', category: 'Drinks', type: 'processed', defaultSalePrice: 50, defaultExpiryDays: 1,
      recipe: [r('Milk',200,'ml'), r('Almonds (Badam)',20,'mg'), r('Sugar',20,'mg'), r('Saffron',1,'mg')] },

    // Cakes
    { name: 'Vanilla Cake', category: 'Cakes', type: 'processed', defaultSalePrice: 750, defaultExpiryDays: 4,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Vanilla Extract',10,'ml'), r('Cream',200,'ml'), r('Baking Powder',10,'mg')] },
    { name: 'Pineapple Cake', category: 'Cakes', type: 'processed', defaultSalePrice: 850, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Pineapple',200,'mg'), r('Cream',200,'ml'), r('Baking Powder',10,'mg')] },
    { name: 'Mango Cake', category: 'Cakes', type: 'processed', defaultSalePrice: 950, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Mango Pulp',150,'ml'), r('Cream',200,'ml'), r('Baking Powder',10,'mg')] },
    { name: 'Black Forest Cake', category: 'Cakes', type: 'processed', defaultSalePrice: 950, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Cocoa Powder',60,'mg'), r('Cream',200,'ml'), r('Dark Chocolate',100,'mg'), r('Baking Powder',10,'mg')] },
    { name: 'White Forest Cake', category: 'Cakes', type: 'processed', defaultSalePrice: 950, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Vanilla Extract',10,'ml'), r('Whipped Cream',250,'ml'), r('Baking Powder',10,'mg')] },
    { name: 'Strawberry Cake', category: 'Cakes', type: 'processed', defaultSalePrice: 950, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Strawberry',200,'mg'), r('Cream',200,'ml'), r('Baking Powder',10,'mg')] },
    { name: 'Blueberry Cake', category: 'Cakes', type: 'processed', defaultSalePrice: 950, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Blueberry',200,'mg'), r('Cream',200,'ml'), r('Baking Powder',10,'mg')] },
    { name: 'Butterscotch Cake', category: 'Cakes', type: 'processed', defaultSalePrice: 1050, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Butterscotch Chips',150,'mg'), r('Cream',200,'ml'), r('Baking Powder',10,'mg')] },
    { name: 'Choco Truffle Cake', category: 'Cakes', type: 'processed', defaultSalePrice: 1100, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Dark Chocolate',200,'mg'), r('Cocoa Powder',60,'mg'), r('Cream',200,'ml'), r('Baking Powder',10,'mg')] },

    // Fusion Cakes
    { name: 'Rose Milk Cake', category: 'Fusion Cake', type: 'processed', defaultSalePrice: 1050, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Rose Essence',10,'ml'), r('Milk',100,'ml'), r('Cream',200,'ml'), r('Baking Powder',10,'mg')] },
    { name: 'Rasamalai Cake', category: 'Fusion Cake', type: 'processed', defaultSalePrice: 1100, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Rasamalai',4,'pcs'), r('Cream',200,'ml'), r('Baking Powder',10,'mg')] },
    { name: 'Red Velvet Cake', category: 'Fusion Cake', type: 'processed', defaultSalePrice: 1100, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Red Velvet Colour',10,'ml'), r('Cocoa Powder',20,'mg'), r('Cream',200,'ml'), r('Baking Powder',10,'mg')] },
    { name: 'Kit Kat Cake', category: 'Fusion Cake', type: 'processed', defaultSalePrice: 1100, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Kit Kat',6,'pcs'), r('Dark Chocolate',100,'mg'), r('Cream',200,'ml'), r('Baking Powder',10,'mg')] },
    { name: 'Gulab Jamun Cake', category: 'Fusion Cake', type: 'processed', defaultSalePrice: 1100, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Gulab Jamun',6,'pcs'), r('Cream',200,'ml'), r('Baking Powder',10,'mg')] },
    { name: 'Oreo Cake', category: 'Fusion Cake', type: 'processed', defaultSalePrice: 1100, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',250,'mg'), r('Eggs',6,'pcs'), r('Oreo Biscuits',8,'pcs'), r('Cream',200,'ml'), r('Baking Powder',10,'mg')] },
    { name: 'Chocolate Delight', category: 'Fusion Cake', type: 'processed', defaultSalePrice: 1350, defaultExpiryDays: 3,
      recipe: [r('Flour (Maida)',500,'mg'), r('Sugar',300,'mg'), r('Butter',300,'mg'), r('Eggs',6,'pcs'), r('Dark Chocolate',250,'mg'), r('Cocoa Powder',80,'mg'), r('Cream',250,'ml'), r('Baking Powder',10,'mg')] },

    // Brownie Box
    { name: 'Classic Brownie (Box)', category: 'Brownie (Box)', type: 'processed', defaultSalePrice: 1150, defaultExpiryDays: 5,
      recipe: [r('Flour (Maida)',1000,'mg'), r('Sugar',500,'mg'), r('Butter',400,'mg'), r('Eggs',10,'pcs'), r('Cocoa Powder',200,'mg'), r('Baking Powder',20,'mg')] },
    { name: 'Choco Chip Brownie (Box)', category: 'Brownie (Box)', type: 'processed', defaultSalePrice: 1200, defaultExpiryDays: 5,
      recipe: [r('Flour (Maida)',1000,'mg'), r('Sugar',500,'mg'), r('Butter',400,'mg'), r('Eggs',10,'pcs'), r('Cocoa Powder',200,'mg'), r('Dark Chocolate',300,'mg'), r('Baking Powder',20,'mg')] },
    { name: 'Double Chocolate (Box)', category: 'Brownie (Box)', type: 'processed', defaultSalePrice: 1300, defaultExpiryDays: 5,
      recipe: [r('Flour (Maida)',1000,'mg'), r('Sugar',500,'mg'), r('Butter',400,'mg'), r('Eggs',10,'pcs'), r('Cocoa Powder',250,'mg'), r('Dark Chocolate',350,'mg'), r('Baking Powder',20,'mg')] },
    { name: 'Triple Chocolate (Box)', category: 'Brownie (Box)', type: 'processed', defaultSalePrice: 1350, defaultExpiryDays: 5,
      recipe: [r('Flour (Maida)',1000,'mg'), r('Sugar',500,'mg'), r('Butter',500,'mg'), r('Eggs',10,'pcs'), r('Cocoa Powder',300,'mg'), r('Dark Chocolate',400,'mg'), r('Whipped Cream',200,'ml'), r('Baking Powder',20,'mg')] },
    { name: 'Kit Kat Brownie (Box)', category: 'Brownie (Box)', type: 'processed', defaultSalePrice: 1300, defaultExpiryDays: 5,
      recipe: [r('Flour (Maida)',1000,'mg'), r('Sugar',500,'mg'), r('Butter',400,'mg'), r('Eggs',10,'pcs'), r('Cocoa Powder',200,'mg'), r('Kit Kat',8,'pcs'), r('Baking Powder',20,'mg')] },
    { name: 'Oreo Brownie (Box)', category: 'Brownie (Box)', type: 'processed', defaultSalePrice: 1300, defaultExpiryDays: 5,
      recipe: [r('Flour (Maida)',1000,'mg'), r('Sugar',500,'mg'), r('Butter',400,'mg'), r('Eggs',10,'pcs'), r('Cocoa Powder',200,'mg'), r('Oreo Biscuits',12,'pcs'), r('Baking Powder',20,'mg')] },
    { name: 'Nuts Loaded Brownie (Box)', category: 'Brownie (Box)', type: 'processed', defaultSalePrice: 1300, defaultExpiryDays: 5,
      recipe: [r('Flour (Maida)',1000,'mg'), r('Sugar',500,'mg'), r('Butter',400,'mg'), r('Eggs',10,'pcs'), r('Cocoa Powder',200,'mg'), r('Almonds (Badam)',200,'mg'), r('Baking Powder',20,'mg')] },
  ];

  for (const p of products) {
    p.createdAt = new Date().toISOString();
    // Calculate cost from recipe
    const allIngs = await getAllRecords(STORES.INVENTORY);
    let cost = 0;
    for (const ri of (p.recipe || [])) {
      const ingItem = allIngs.find(i => i.name === ri.name);
      if (ingItem) cost += ri.qty * ingItem.unitCost;
    }
    p.defaultCost = Math.round(cost * 100) / 100;
    await addRecord(STORES.PRODUCTS, p);
  }
}

function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
