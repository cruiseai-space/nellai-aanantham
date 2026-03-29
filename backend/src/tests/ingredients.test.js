/**
 * Ingredients API Tests
 */

const request = require('supertest');
const app = require('../index');
const { testIngredients, testBatches } = require('./fixtures/testData');

describe('Ingredients Endpoints', () => {
  let mockUser;
  let authToken;

  beforeEach(() => {
    mockUser = createMockUser();
    authToken = generateMockToken(mockUser.id);
    setupAuthenticatedUser(mockUser);
  });

  describe('GET /api/ingredients', () => {
    it('should return array of ingredients', async () => {
      const mockIngredients = Object.values(testIngredients);
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockIngredients,
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/ingredients')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('ingredients');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/ingredients');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/ingredients', () => {
    it('should create a new ingredient', async () => {
      const newIngredient = {
        name: 'Cardamom',
        unit: 'g',
      };

      const createdIngredient = {
        id: 'new-ingredient-id',
        ...newIngredient,
        created_by: mockUser.id,
        created_at: new Date().toISOString(),
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: createdIngredient,
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .post('/api/ingredients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newIngredient);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newIngredient.name);
      expect(response.body.data.unit).toBe(newIngredient.unit);
    });

    it('should return 400 without name', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ unit: 'kg' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 without unit', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Sugar' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('GET /api/ingredients/:id', () => {
    it('should return ingredient with batches', async () => {
      const ingredient = testIngredients.sugar;
      const batches = [testBatches.sugarBatch1, testBatches.sugarBatch2];

      // Mock ingredient query
      const mockIngredientQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: ingredient,
          error: null,
        }),
      };

      // Mock batches query
      const mockBatchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: batches,
          error: null,
        }),
      };

      mockSupabaseAdmin.from
        .mockReturnValueOnce(mockIngredientQuery)
        .mockReturnValueOnce(mockBatchQuery);

      const response = await request(app)
        .get(`/api/ingredients/${ingredient.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(ingredient.id);
      expect(response.body.data.batches).toHaveLength(2);
    });

    it('should return 404 for non-existent ingredient', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/ingredients/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /api/ingredients/:id', () => {
    it('should update ingredient', async () => {
      const ingredient = testIngredients.sugar;
      const updates = { name: 'White Sugar' };

      const updatedIngredient = { ...ingredient, ...updates };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updatedIngredient,
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updates.name);
    });

    it('should return 400 with no fields to update', async () => {
      const response = await request(app)
        .put(`/api/ingredients/${testIngredients.sugar.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No fields');
    });

    it('should return 404 for non-existent ingredient', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .put('/api/ingredients/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/ingredients/:id', () => {
    it('should delete ingredient', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn()
          .mockReturnValueOnce({ 
            eq: jest.fn().mockResolvedValue({ data: null, error: null }) 
          }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .delete(`/api/ingredients/${testIngredients.sugar.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/ingredients/${testIngredients.sugar.id}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });
});
