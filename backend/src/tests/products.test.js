/**
 * Products API Tests
 */

const request = require('supertest');
const app = require('../index');

jest.mock('../utils/fifo', () => ({
  checkRecipeAvailability: jest.fn().mockResolvedValue({
    available: true,
    totalCost: 10,
    items: [],
  }),
}));

describe('Products Endpoints', () => {
  let mockUser;
  let authToken;

  beforeEach(() => {
    mockUser = createMockUser();
    authToken = generateMockToken(mockUser.id);
    setupAuthenticatedUser(mockUser);
  });

  describe('GET /api/products', () => {
    it('should return products', async () => {
      const mockProducts = [
        {
          id: 'p1',
          name: 'Mysore Pak',
          recipe_id: 'r1',
          sale_price: 120,
          recipes: { id: 'r1', name: 'Base', recipe_items: [] },
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockProducts,
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('products');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/products');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/products', () => {
    it('should create a product', async () => {
      const mockRecipeVerify = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'r1' },
          error: null,
        }),
      };

      const created = {
        id: 'new-product-id',
        name: 'Ladoo',
        recipe_id: 'r1',
        sale_price: 50,
        created_by: mockUser.id,
      };

      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: created, error: null }),
      };

      let fromCalls = 0;
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'recipes') return mockRecipeVerify;
        if (table === 'products') {
          fromCalls += 1;
          return mockInsert;
        }
        return mockInsert;
      });

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Ladoo', recipe_id: 'r1', sale_price: 50 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Ladoo');
    });

    it('should require name, recipe_id, sale_price', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'X' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/products/low-stock', () => {
    it('should return empty array', async () => {
      const response = await request(app)
        .get('/api/products/low-stock')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product with extras', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'p1',
            name: 'P',
            recipe_id: 'r1',
            sale_price: 100,
            recipes: { id: 'r1', name: 'R', recipe_items: [] },
          },
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/products/p1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('p1');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product', async () => {
      const mockUpdate = {};
      mockUpdate.update = jest.fn(() => mockUpdate);
      mockUpdate.eq = jest.fn(() => mockUpdate);
      mockUpdate.select = jest.fn(() => mockUpdate);
      mockUpdate.single = jest.fn().mockResolvedValue({
        data: {
          id: 'p1',
          name: 'Updated',
          sale_price: 99,
          recipe_id: 'r1',
        },
        error: null,
      });
      mockSupabaseAdmin.from.mockReturnValue(mockUpdate);

      const response = await request(app)
        .put('/api/products/p1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sale_price: 99 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 when no fields', async () => {
      const response = await request(app)
        .put('/api/products/p1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      const mockDel = {};
      mockDel.delete = jest.fn(() => mockDel);
      mockDel.eq = jest.fn(() => mockDel);
      mockDel.then = (resolve) => resolve({ data: null, error: null });
      mockSupabaseAdmin.from.mockReturnValue(mockDel);

      const response = await request(app)
        .delete('/api/products/p1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
