/**
 * Batches API Tests
 */

const request = require('supertest');
const app = require('../index');
const { testIngredients, testBatches } = require('./fixtures/testData');

// Mock the FIFO utility
jest.mock('../utils/fifo', () => ({
  consumeIngredientFIFO: jest.fn(),
  checkRecipeAvailability: jest.fn(),
}));

const { consumeIngredientFIFO } = require('../utils/fifo');

describe('Batches Endpoints', () => {
  let mockUser;
  let authToken;

  beforeEach(() => {
    mockUser = createMockUser();
    authToken = generateMockToken(mockUser.id);
    setupAuthenticatedUser(mockUser);
  });

  describe('GET /api/batches', () => {
    it('should return array of batches with ingredient info', async () => {
      const mockBatches = Object.values(testBatches).map(batch => ({
        ...batch,
        ingredients: testIngredients.sugar,
      }));

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockBatches,
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/batches')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/batches');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/batches', () => {
    it('should create a new batch', async () => {
      const newBatch = {
        ingredient_id: testIngredients.sugar.id,
        qty_total: 25,
        unit_cost: 45,
        purchase_date: '2024-01-20',
        expiry_date: '2025-01-20',
      };

      const createdBatch = {
        id: 'new-batch-id',
        ...newBatch,
        qty_remaining: newBatch.qty_total,
        created_by: mockUser.id,
      };

      // Mock ingredient verification
      const mockIngredientQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: testIngredients.sugar.id },
          error: null,
        }),
      };

      // Mock batch creation
      const mockBatchQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: createdBatch,
          error: null,
        }),
      };

      // Mock inventory log
      const mockLogQuery = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseAdmin.from
        .mockReturnValueOnce(mockIngredientQuery)
        .mockReturnValueOnce(mockBatchQuery)
        .mockReturnValueOnce(mockLogQuery);

      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newBatch);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.qty_total).toBe(newBatch.qty_total);
    });

    it('should return 400 without required fields', async () => {
      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ingredient_id: testIngredients.sugar.id });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should return 404 for non-existent ingredient', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ingredient_id: 'non-existent',
          qty_total: 10,
          unit_cost: 50,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/batches/consume-fifo', () => {
    it('should consume oldest batch first', async () => {
      consumeIngredientFIFO.mockResolvedValue({
        success: true,
        totalConsumed: 5,
        totalCost: 225,
        consumedBatches: [
          { batch_id: testBatches.sugarBatch1.id, quantity: 5, cost: 225 },
        ],
      });

      const response = await request(app)
        .post('/api/batches/consume-fifo')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ingredient_id: testIngredients.sugar.id,
          quantity: 5,
          note: 'Test consumption',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.totalConsumed).toBe(5);
      expect(consumeIngredientFIFO).toHaveBeenCalledWith(
        testIngredients.sugar.id,
        5,
        mockUser.id,
        'Test consumption'
      );
    });

    it('should fail when insufficient quantity available', async () => {
      consumeIngredientFIFO.mockResolvedValue({
        success: false,
        error: 'Insufficient quantity. Available: 70, Requested: 100',
      });

      const response = await request(app)
        .post('/api/batches/consume-fifo')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ingredient_id: testIngredients.sugar.id,
          quantity: 100,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient');
    });

    it('should return 400 without required fields', async () => {
      const response = await request(app)
        .post('/api/batches/consume-fifo')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ingredient_id: testIngredients.sugar.id });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/batches/:id/consume', () => {
    it('should consume from specific batch', async () => {
      const batch = testBatches.sugarBatch1;

      const mockBatchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: batch,
          error: null,
        }),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...batch, qty_remaining: batch.qty_remaining - 5 },
          error: null,
        }),
      };

      const mockLogQuery = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseAdmin.from
        .mockReturnValueOnce(mockBatchQuery)
        .mockReturnValueOnce(mockUpdateQuery)
        .mockReturnValueOnce(mockLogQuery);

      const response = await request(app)
        .post(`/api/batches/${batch.id}/consume`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5, note: 'Manual consumption' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.consumed).toBe(5);
    });

    it('should return 400 when quantity exceeds available', async () => {
      const batch = { ...testBatches.sugarBatch1, qty_remaining: 5 };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: batch,
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .post(`/api/batches/${batch.id}/consume`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 10 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient');
    });

    it('should return 400 with invalid quantity', async () => {
      const response = await request(app)
        .post(`/api/batches/${testBatches.sugarBatch1.id}/consume`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: -5 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/batches/:id', () => {
    it('should update batch', async () => {
      const batch = testBatches.sugarBatch1;
      const updates = { qty_remaining: 40, unit_cost: 50 };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...batch, ...updates },
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .put(`/api/batches/${batch.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.qty_remaining).toBe(updates.qty_remaining);
    });

    it('should return 400 with no fields to update', async () => {
      const response = await request(app)
        .put(`/api/batches/${testBatches.sugarBatch1.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/batches/:id', () => {
    it('should delete batch', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn()
          .mockReturnValueOnce({ 
            eq: jest.fn().mockResolvedValue({ data: null, error: null }) 
          }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .delete(`/api/batches/${testBatches.sugarBatch1.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });
  });
});
