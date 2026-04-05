/**
 * Recipes API Tests
 */

const request = require('supertest');
const app = require('../index');

jest.mock('../utils/fifo', () => ({
  checkRecipeAvailability: jest.fn().mockResolvedValue({
    available: true,
    totalCost: 42.5,
    error: null,
  }),
}));

describe('Recipes Endpoints', () => {
  let mockUser;
  let authToken;

  beforeEach(() => {
    mockUser = createMockUser();
    authToken = generateMockToken(mockUser.id);
    setupAuthenticatedUser(mockUser);
  });

  describe('GET /api/recipes', () => {
    it('should return recipes', async () => {
      const mockRecipes = [
        {
          id: 'r1',
          name: 'Test Recipe',
          recipe_items: [],
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('recipes');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/recipes');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/recipes', () => {
    it('should create a recipe', async () => {
      const created = {
        id: 'new-recipe-id',
        name: 'New Recipe',
        created_by: mockUser.id,
      };

      let recipesCalls = 0;
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'recipe_items') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === 'recipes') {
          recipesCalls += 1;
          if (recipesCalls === 1) {
            return {
              insert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: created, error: null }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...created, recipe_items: [] },
              error: null,
            }),
          };
        }
        return {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: created, error: null }),
        };
      });

      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Recipe' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Recipe');
    });

    it('should require name', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/recipes/:id/cost', () => {
    it('should return cost data', async () => {
      const mockRecipeQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'r1', yield_quantity: 1 },
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockRecipeQuery);

      const response = await request(app)
        .get('/api/recipes/r1/cost')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total_cost).toBe(42.5);
      expect(typeof response.body.data.cost_per_unit).toBe('number');
    });
  });

  describe('GET /api/recipes/:id', () => {
    it('should return one recipe', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'r1', name: 'R', recipe_items: [] },
          error: null,
        }),
      };
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/recipes/r1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('r1');
    });
  });

  describe('PUT /api/recipes/:id', () => {
    it('should update recipe name', async () => {
      const mockUpdateChain = {};
      mockUpdateChain.update = jest.fn(() => mockUpdateChain);
      mockUpdateChain.eq = jest.fn(() => mockUpdateChain);
      mockUpdateChain.then = (resolve) => resolve({ data: null, error: null });

      const mockSelectChain = {};
      mockSelectChain.select = jest.fn(() => mockSelectChain);
      mockSelectChain.eq = jest.fn(() => mockSelectChain);
      mockSelectChain.single = jest.fn().mockResolvedValue({
        data: { id: 'r1', name: 'Updated', recipe_items: [] },
        error: null,
      });

      let recipesCalls = 0;
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'recipes') {
          recipesCalls += 1;
          return recipesCalls === 1 ? mockUpdateChain : mockSelectChain;
        }
        if (table === 'recipe_items') {
          const del = {};
          del.delete = jest.fn(() => del);
          del.eq = jest.fn(() => del);
          del.then = (resolve) => resolve({ data: null, error: null });
          return del;
        }
        return mockSelectChain;
      });

      const response = await request(app)
        .put('/api/recipes/r1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/recipes/:id', () => {
    it('should delete recipe', async () => {
      const mockItems = {};
      mockItems.delete = jest.fn(() => mockItems);
      mockItems.eq = jest.fn(() => mockItems);
      mockItems.then = (resolve) => resolve({ data: null, error: null });

      const mockRecipes = {};
      mockRecipes.delete = jest.fn(() => mockRecipes);
      mockRecipes.eq = jest.fn(() => mockRecipes);
      mockRecipes.then = (resolve) => resolve({ data: null, error: null });

      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'recipe_items') return mockItems;
        if (table === 'recipes') return mockRecipes;
        return mockRecipes;
      });

      const response = await request(app)
        .delete('/api/recipes/r1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
