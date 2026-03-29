/**
 * AI API Tests
 */

const request = require('supertest');
const app = require('../index');
const { testAIData } = require('./fixtures/testData');

describe('AI Endpoints', () => {
  let mockUser;
  let authToken;

  beforeEach(() => {
    mockUser = createMockUser();
    authToken = generateMockToken(mockUser.id);
    setupAuthenticatedUser(mockUser);
  });

  describe('POST /api/ai/parse-voice', () => {
    it('should parse voice transcript and return structured data', async () => {
      const mockResponse = {
        intent: 'add_batch',
        data: {
          ingredient: 'sugar',
          quantity: 5,
          unit: 'kg',
          unit_cost: 45,
        },
        confidence: 0.95,
      };

      mockGroqClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
      });

      const response = await request(app)
        .post('/api/ai/parse-voice')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ transcript: testAIData.voiceTranscripts.addIngredient });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.intent).toBe('add_batch');
      expect(response.body.data.confidence).toBeGreaterThan(0);
    });

    it('should return 400 without transcript', async () => {
      const response = await request(app)
        .post('/api/ai/parse-voice')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 with empty transcript', async () => {
      const response = await request(app)
        .post('/api/ai/parse-voice')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ transcript: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 when transcript is not a string', async () => {
      const response = await request(app)
        .post('/api/ai/parse-voice')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ transcript: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should handle AI service errors gracefully', async () => {
      mockGroqClient.chat.completions.create.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const response = await request(app)
        .post('/api/ai/parse-voice')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ transcript: 'Add 5 kg sugar' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('AI Processing Error');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/ai/parse-voice')
        .send({ transcript: 'Test transcript' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/ai/parse-receipt', () => {
    it('should parse receipt image and return items', async () => {
      const mockResponse = {
        items: [
          { name: 'Sugar', quantity: 5, unit: 'kg', unit_price: 45, total_price: 225 },
          { name: 'Ghee', quantity: 2, unit: 'kg', unit_price: 550, total_price: 1100 },
        ],
        vendor: 'Local Store',
        date: '2024-01-15',
        total_amount: 1325,
        confidence: 0.9,
      };

      mockGroqClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
      });

      const response = await request(app)
        .post('/api/ai/parse-receipt')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ image: testAIData.receiptImage });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.total_amount).toBeDefined();
    });

    it('should return 400 without image', async () => {
      const response = await request(app)
        .post('/api/ai/parse-receipt')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 when image is not a string', async () => {
      const response = await request(app)
        .post('/api/ai/parse-receipt')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ image: { data: 'not a string' } });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should handle AI service errors gracefully', async () => {
      mockGroqClient.chat.completions.create.mockRejectedValue(
        new Error('Vision model unavailable')
      );

      const response = await request(app)
        .post('/api/ai/parse-receipt')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ image: testAIData.receiptImage });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('AI Processing Error');
    });
  });

  describe('POST /api/ai/parse-csv', () => {
    it('should parse CSV data for ingredients', async () => {
      const mockResponse = {
        records: [
          { name: 'Sugar', unit: 'kg', category: 'Dry Goods' },
          { name: 'Ghee', unit: 'kg', category: 'Dairy' },
          { name: 'Milk', unit: 'liters', category: 'Dairy' },
        ],
        column_mappings: {
          'Name': 'name',
          'Unit': 'unit',
          'Category': 'category',
        },
        errors: [],
        total_parsed: 3,
        total_errors: 0,
      };

      mockGroqClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
      });

      const response = await request(app)
        .post('/api/ai/parse-csv')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ csv: testAIData.csvData.ingredients, type: 'ingredients' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.records)).toBe(true);
      expect(response.body.data.total_parsed).toBe(3);
    });

    it('should parse CSV data for batches', async () => {
      const mockResponse = {
        records: [
          { ingredient_name: 'Sugar', quantity: 50, unit_cost: 45, expiry_date: '2025-01-10' },
          { ingredient_name: 'Ghee', quantity: 10, unit_cost: 550, expiry_date: '2024-07-12' },
        ],
        column_mappings: {},
        errors: [],
        total_parsed: 2,
        total_errors: 0,
      };

      mockGroqClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
      });

      const response = await request(app)
        .post('/api/ai/parse-csv')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ csv: testAIData.csvData.batches, type: 'batches' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total_parsed).toBe(2);
    });

    it('should return 400 without CSV data', async () => {
      const response = await request(app)
        .post('/api/ai/parse-csv')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'ingredients' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 for invalid type', async () => {
      const response = await request(app)
        .post('/api/ai/parse-csv')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ csv: 'name,unit\nSugar,kg', type: 'invalid_type' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('Type must be');
    });

    it('should use default type if not provided', async () => {
      const mockResponse = {
        records: [{ name: 'Sugar', unit: 'kg' }],
        total_parsed: 1,
        total_errors: 0,
      };

      mockGroqClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
      });

      const response = await request(app)
        .post('/api/ai/parse-csv')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ csv: 'name,unit\nSugar,kg' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/ai/suggest-recipe', () => {
    it('should suggest recipe ingredients and cost', async () => {
      const mockResponse = {
        recipe_name: 'Mysore Pak',
        description: 'Traditional South Indian sweet made with besan and ghee',
        suggested_ingredients: [
          { ingredient_name: 'Besan', quantity: 0.5, unit: 'kg', estimated_cost: 60, available: true },
          { ingredient_name: 'Ghee', quantity: 0.3, unit: 'kg', estimated_cost: 165, available: true },
          { ingredient_name: 'Sugar', quantity: 0.4, unit: 'kg', estimated_cost: 18, available: true },
        ],
        total_estimated_cost: 243,
        yield: '1 kg',
        notes: 'Use fresh ghee for best results',
        confidence: 0.92,
      };

      mockGroqClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
      });

      const response = await request(app)
        .post('/api/ai/suggest-recipe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testAIData.recipeRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recipe_name).toBe('Mysore Pak');
      expect(Array.isArray(response.body.data.suggested_ingredients)).toBe(true);
      expect(response.body.data.total_estimated_cost).toBeDefined();
    });

    it('should return 400 without recipe name', async () => {
      const response = await request(app)
        .post('/api/ai/suggest-recipe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ingredients: testAIData.recipeRequest.ingredients });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 when name is not a string', async () => {
      const response = await request(app)
        .post('/api/ai/suggest-recipe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 123, ingredients: [] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 without ingredients array', async () => {
      const response = await request(app)
        .post('/api/ai/suggest-recipe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Mysore Pak' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 when ingredients is not an array', async () => {
      const response = await request(app)
        .post('/api/ai/suggest-recipe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Mysore Pak', ingredients: 'not an array' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should handle AI service errors gracefully', async () => {
      mockGroqClient.chat.completions.create.mockRejectedValue(
        new Error('Model overloaded')
      );

      const response = await request(app)
        .post('/api/ai/suggest-recipe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testAIData.recipeRequest);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('AI Processing Error');
    });
  });

  describe('Authentication', () => {
    it('should return 401 for all AI endpoints without token', async () => {
      const endpoints = [
        { method: 'post', path: '/api/ai/parse-voice', body: { transcript: 'test' } },
        { method: 'post', path: '/api/ai/parse-receipt', body: { image: 'test' } },
        { method: 'post', path: '/api/ai/parse-csv', body: { csv: 'test' } },
        { method: 'post', path: '/api/ai/suggest-recipe', body: { name: 'test', ingredients: [] } },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .send(endpoint.body);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Unauthorized');
      }
    });
  });
});
