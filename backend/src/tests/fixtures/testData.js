/**
 * Test Data Fixtures
 * Sample data for testing ingredients, batches, recipes, products, and orders
 */

const testUsers = {
  admin: {
    id: 'admin-user-id',
    email: 'admin@nellai-aanantham.com',
    password: 'Admin@123',
    user_metadata: { full_name: 'Admin User' },
    created_at: '2024-01-01T00:00:00Z',
    last_sign_in_at: '2024-01-15T10:00:00Z',
  },
  staff: {
    id: 'staff-user-id',
    email: 'staff@nellai-aanantham.com',
    password: 'Staff@123',
    user_metadata: { full_name: 'Staff User' },
    created_at: '2024-01-05T00:00:00Z',
    last_sign_in_at: '2024-01-15T09:00:00Z',
  },
};

const testIngredients = {
  sugar: {
    id: 'ingredient-1',
    name: 'Sugar',
    unit: 'kg',
    created_by: 'admin-user-id',
    created_at: '2024-01-01T00:00:00Z',
  },
  ghee: {
    id: 'ingredient-2',
    name: 'Ghee',
    unit: 'kg',
    created_by: 'admin-user-id',
    created_at: '2024-01-01T00:00:00Z',
  },
  milk: {
    id: 'ingredient-3',
    name: 'Milk',
    unit: 'liters',
    created_by: 'admin-user-id',
    created_at: '2024-01-01T00:00:00Z',
  },
  cashews: {
    id: 'ingredient-4',
    name: 'Cashews',
    unit: 'kg',
    created_by: 'admin-user-id',
    created_at: '2024-01-01T00:00:00Z',
  },
  besan: {
    id: 'ingredient-5',
    name: 'Besan (Gram Flour)',
    unit: 'kg',
    created_by: 'admin-user-id',
    created_at: '2024-01-01T00:00:00Z',
  },
};

const testBatches = {
  sugarBatch1: {
    id: 'batch-1',
    ingredient_id: 'ingredient-1',
    qty_total: 50,
    qty_remaining: 45,
    unit_cost: 45,
    purchase_date: '2024-01-10',
    expiry_date: '2025-01-10',
    created_by: 'admin-user-id',
  },
  sugarBatch2: {
    id: 'batch-2',
    ingredient_id: 'ingredient-1',
    qty_total: 25,
    qty_remaining: 25,
    unit_cost: 48,
    purchase_date: '2024-01-15',
    expiry_date: '2025-01-15',
    created_by: 'admin-user-id',
  },
  gheeBatch: {
    id: 'batch-3',
    ingredient_id: 'ingredient-2',
    qty_total: 10,
    qty_remaining: 8,
    unit_cost: 550,
    purchase_date: '2024-01-12',
    expiry_date: '2024-07-12',
    created_by: 'admin-user-id',
  },
  milkBatch: {
    id: 'batch-4',
    ingredient_id: 'ingredient-3',
    qty_total: 100,
    qty_remaining: 80,
    unit_cost: 55,
    purchase_date: '2024-01-15',
    expiry_date: '2024-01-20',
    created_by: 'admin-user-id',
  },
};

const testRecipes = {
  mysorePak: {
    id: 'recipe-1',
    name: 'Mysore Pak',
    description: 'Traditional South Indian sweet',
    created_by: 'admin-user-id',
    recipe_items: [
      { ingredient_id: 'ingredient-5', quantity_required: 0.5 }, // Besan
      { ingredient_id: 'ingredient-2', quantity_required: 0.3 }, // Ghee
      { ingredient_id: 'ingredient-1', quantity_required: 0.4 }, // Sugar
    ],
  },
  laddu: {
    id: 'recipe-2',
    name: 'Boondi Laddu',
    description: 'Round sweet ball made from fried boondi',
    created_by: 'admin-user-id',
    recipe_items: [
      { ingredient_id: 'ingredient-5', quantity_required: 0.3 }, // Besan
      { ingredient_id: 'ingredient-2', quantity_required: 0.2 }, // Ghee
      { ingredient_id: 'ingredient-1', quantity_required: 0.35 }, // Sugar
      { ingredient_id: 'ingredient-4', quantity_required: 0.05 }, // Cashews
    ],
  },
};

const testProducts = {
  mysorePak: {
    id: 'product-1',
    name: 'Mysore Pak (500g)',
    recipe_id: 'recipe-1',
    sale_price: 350,
    created_by: 'admin-user-id',
  },
  laddu: {
    id: 'product-2',
    name: 'Boondi Laddu (1kg)',
    recipe_id: 'recipe-2',
    sale_price: 450,
    created_by: 'admin-user-id',
  },
  gheePongal: {
    id: 'product-3',
    name: 'Ghee Pongal (500g)',
    recipe_id: null,
    sale_price: 200,
    created_by: 'admin-user-id',
  },
};

const testOrders = {
  draftOrder: {
    id: 'order-1',
    status: 'draft',
    scheduled_for: null,
    total_amount: 0,
    created_by: 'admin-user-id',
    created_at: '2024-01-15T10:00:00Z',
    billed_at: null,
  },
  billedOrder: {
    id: 'order-2',
    status: 'billed',
    scheduled_for: null,
    total_amount: 800,
    created_by: 'admin-user-id',
    created_at: '2024-01-14T10:00:00Z',
    billed_at: '2024-01-14T12:00:00Z',
  },
  scheduledOrder: {
    id: 'order-3',
    status: 'draft',
    scheduled_for: '2024-01-20T10:00:00Z',
    total_amount: 1250,
    created_by: 'admin-user-id',
    created_at: '2024-01-15T08:00:00Z',
    billed_at: null,
  },
};

const testOrderItems = {
  item1: {
    id: 'order-item-1',
    order_id: 'order-1',
    product_id: 'product-1',
    quantity: 2,
    cost_at_sale: null,
    price_at_sale: 350,
  },
  item2: {
    id: 'order-item-2',
    order_id: 'order-1',
    product_id: 'product-2',
    quantity: 1,
    cost_at_sale: null,
    price_at_sale: 450,
  },
  billedItem: {
    id: 'order-item-3',
    order_id: 'order-2',
    product_id: 'product-1',
    quantity: 2,
    cost_at_sale: 280,
    price_at_sale: 350,
  },
};

// AI test data
const testAIData = {
  voiceTranscripts: {
    addIngredient: 'Add 5 kg sugar at 45 rupees per kg',
    addBatch: 'Add batch of 10 kg ghee purchased today at 550 rupees',
    createOrder: 'Create order for 2 Mysore Pak and 1 Laddu',
  },
  csvData: {
    ingredients: `Name,Unit,Category
Sugar,kg,Dry Goods
Ghee,kg,Dairy
Milk,liters,Dairy`,
    batches: `Ingredient,Quantity,Unit Cost,Expiry Date
Sugar,50,45,2025-01-10
Ghee,10,550,2024-07-12`,
  },
  receiptImage: 'data:image/jpeg;base64,/9j/test-base64-image',
  recipeRequest: {
    name: 'Mysore Pak',
    ingredients: [
      { name: 'Besan', unit: 'kg', price: 120 },
      { name: 'Ghee', unit: 'kg', price: 550 },
      { name: 'Sugar', unit: 'kg', price: 45 },
    ],
  },
};

module.exports = {
  testUsers,
  testIngredients,
  testBatches,
  testRecipes,
  testProducts,
  testOrders,
  testOrderItems,
  testAIData,
};
