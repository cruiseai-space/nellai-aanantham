/**
 * Orders API Tests
 */

const request = require('supertest');
const app = require('../index');
const { testOrders, testOrderItems, testProducts } = require('./fixtures/testData');

// Mock the FIFO utility
jest.mock('../utils/fifo', () => ({
  consumeIngredientFIFO: jest.fn(),
  checkRecipeAvailability: jest.fn(),
}));

const { consumeIngredientFIFO, checkRecipeAvailability } = require('../utils/fifo');

describe('Orders Endpoints', () => {
  let mockUser;
  let authToken;

  beforeEach(() => {
    mockUser = createMockUser();
    authToken = generateMockToken(mockUser.id);
    setupAuthenticatedUser(mockUser);
  });

  describe('POST /api/orders', () => {
    it('should create a draft order', async () => {
      const createdOrder = {
        id: 'new-order-id',
        status: 'draft',
        scheduled_for: null,
        total_amount: 0,
        created_by: mockUser.id,
        created_at: new Date().toISOString(),
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: createdOrder,
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('draft');
      expect(response.body.data.total_amount).toBe(0);
    });

    it('should create order with scheduled_for date', async () => {
      const scheduledFor = '2024-01-25T10:00:00Z';
      
      const createdOrder = {
        id: 'new-order-id',
        status: 'draft',
        scheduled_for: scheduledFor,
        total_amount: 0,
        created_by: mockUser.id,
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: createdOrder,
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ scheduled_for: scheduledFor });

      expect(response.status).toBe(201);
      expect(response.body.data.scheduled_for).toBe(scheduledFor);
    });
  });

  describe('POST /api/orders/:id/items', () => {
    it('should add item to order', async () => {
      const order = testOrders.draftOrder;
      const product = testProducts.mysorePak;

      // Mock order verification
      const mockOrderQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: order,
          error: null,
        }),
      };

      // Mock product verification
      const mockProductQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: product,
          error: null,
        }),
      };

      // Mock existing item check (not found)
      const mockExistingItemQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      // Mock item creation
      const mockItemQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'new-item-id',
            order_id: order.id,
            product_id: product.id,
            quantity: 2,
            price_at_sale: product.sale_price,
          },
          error: null,
        }),
      };

      // Mock total update
      const mockTotalQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ quantity: 2, price_at_sale: product.sale_price, products: { sale_price: product.sale_price } }],
          error: null,
        }),
      };

      const mockUpdateTotalQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseAdmin.from
        .mockReturnValueOnce(mockOrderQuery)
        .mockReturnValueOnce(mockProductQuery)
        .mockReturnValueOnce(mockExistingItemQuery)
        .mockReturnValueOnce(mockItemQuery)
        .mockReturnValueOnce(mockTotalQuery)
        .mockReturnValueOnce(mockUpdateTotalQuery);

      const response = await request(app)
        .post(`/api/orders/${order.id}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: product.id, quantity: 2 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(2);
    });

    it('should return 400 without product_id', async () => {
      const response = await request(app)
        .post(`/api/orders/${testOrders.draftOrder.id}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 2 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for billed order', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: testOrders.billedOrder,
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .post(`/api/orders/${testOrders.billedOrder.id}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ product_id: testProducts.mysorePak.id, quantity: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('billed');
    });
  });

  describe('DELETE /api/orders/:id/items/:itemId', () => {
    it('should remove item from order', async () => {
      const order = testOrders.draftOrder;
      const item = testOrderItems.item1;

      // Mock order verification
      const mockOrderQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: order,
          error: null,
        }),
      };

      // Mock item deletion
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn()
          .mockReturnValueOnce({ 
            eq: jest.fn().mockResolvedValue({ data: null, error: null }) 
          }),
      };

      // Mock total update
      const mockTotalQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockUpdateTotalQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseAdmin.from
        .mockReturnValueOnce(mockOrderQuery)
        .mockReturnValueOnce(mockDeleteQuery)
        .mockReturnValueOnce(mockTotalQuery)
        .mockReturnValueOnce(mockUpdateTotalQuery);

      const response = await request(app)
        .delete(`/api/orders/${order.id}/items/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed');
    });

    it('should return 400 for billed order', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: testOrders.billedOrder,
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .delete(`/api/orders/${testOrders.billedOrder.id}/items/${testOrderItems.billedItem.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('billed');
    });
  });

  describe('POST /api/orders/:id/bill', () => {
    it('should bill order and consume inventory', async () => {
      const order = {
        ...testOrders.draftOrder,
        order_items: [
          {
            id: 'item-1',
            product_id: testProducts.mysorePak.id,
            quantity: 2,
            products: {
              id: testProducts.mysorePak.id,
              recipe_id: 'recipe-1',
              sale_price: 350,
              recipes: {
                recipe_items: [
                  { ingredient_id: 'ingredient-1', quantity_required: 0.4 },
                  { ingredient_id: 'ingredient-2', quantity_required: 0.3 },
                ],
              },
            },
          },
        ],
      };

      // Mock order fetch
      const mockOrderQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: order,
          error: null,
        }),
      };

      // Mock availability check
      checkRecipeAvailability.mockResolvedValue({ available: true });

      // Mock FIFO consumption
      consumeIngredientFIFO.mockResolvedValue({
        success: true,
        totalCost: 100,
        consumedBatches: [],
      });

      // Mock order item update
      const mockItemUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // Mock order update
      const mockOrderUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...order, status: 'billed', billed_at: new Date().toISOString() },
          error: null,
        }),
      };

      mockSupabaseAdmin.from
        .mockReturnValueOnce(mockOrderQuery)
        .mockReturnValueOnce(mockItemUpdateQuery)
        .mockReturnValueOnce(mockOrderUpdateQuery);

      const response = await request(app)
        .post(`/api/orders/${order.id}/bill`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('billed');
      expect(response.body.summary).toBeDefined();
    });

    it('should fail if order already billed', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: testOrders.billedOrder,
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .post(`/api/orders/${testOrders.billedOrder.id}/bill`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already billed');
    });

    it('should fail if order has no items', async () => {
      const emptyOrder = { ...testOrders.draftOrder, order_items: [] };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: emptyOrder,
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .post(`/api/orders/${emptyOrder.id}/bill`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('no items');
    });
  });

  describe('GET /api/orders', () => {
    it('should filter by status when provided', async () => {
      const draftOrders = [testOrders.draftOrder, testOrders.scheduledOrder];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: function(resolve) {
          resolve({ data: draftOrders, error: null });
        }
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/orders?status=draft')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(mockQuery.eq).toHaveBeenCalledTimes(2); // created_by and status
    });

    it('should return all orders without status filter', async () => {
      const allOrders = Object.values(testOrders);

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: allOrders,
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should update order status', async () => {
      const order = testOrders.draftOrder;
      const updates = { status: 'confirmed' };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...order, ...updates },
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .put(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('confirmed');
    });

    it('should return 400 with no fields to update', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrders.draftOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent order', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .put('/api/orders/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'confirmed' });

      expect(response.status).toBe(404);
    });
  });
});
