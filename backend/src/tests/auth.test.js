/**
 * Auth API Tests
 */

const request = require('supertest');
const app = require('../index');
const { testUsers } = require('./fixtures/testData');

describe('Auth Endpoints', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid data and return 201', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'Password@123',
        fullName: 'New User',
      };

      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
        data: {
          user: {
            id: 'new-user-id',
            email: newUser.email,
            user_metadata: { full_name: newUser.fullName },
          },
        },
        error: null,
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user.fullName).toBe(newUser.fullName);
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ password: 'Password@123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 for duplicate email', async () => {
      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' },
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: testUsers.admin.email,
          password: 'Password@123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Signup Failed');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return token for valid credentials', async () => {
      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() + 3600000,
      };

      mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            user_metadata: testUsers.admin.user_metadata,
          },
          session: mockSession,
        },
        error: null,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.admin.email,
          password: testUsers.admin.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.session.access_token).toBe(mockSession.access_token);
      expect(response.body.user.email).toBe(testUsers.admin.email);
    });

    it('should return 503 when Supabase is unreachable (fetch failed)', async () => {
      mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'fetch failed' },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.admin.email,
          password: testUsers.admin.password,
        });

      expect(response.status).toBe(503);
      expect(response.body.error).toBe('Service Unavailable');
      expect(response.body.message).toMatch(/Cannot reach Supabase/i);
    });

    it('should return 401 for invalid password', async () => {
      mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.admin.email,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Login Failed');
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Password@123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data with valid token', async () => {
      const mockUser = createMockUser();
      setupAuthenticatedUser(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${generateMockToken()}`);

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(mockUser.id);
      expect(response.body.user.email).toBe(mockUser.email);
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 with invalid token', async () => {
      setupUnauthenticatedUser();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidHeader');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 200 on successful logout', async () => {
      const mockUser = createMockUser();
      setupAuthenticatedUser(mockUser);
      mockSupabaseAdmin.auth.admin.signOut.mockResolvedValue({ error: null });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${generateMockToken()}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should return 401 without token', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      const newSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Date.now() + 3600000,
      };

      mockSupabaseAdmin.auth.refreshSession.mockResolvedValue({
        data: { session: newSession },
        error: null,
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'valid-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.session.access_token).toBe(newSession.access_token);
    });

    it('should return 400 without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 401 with invalid refresh token', async () => {
      mockSupabaseAdmin.auth.refreshSession.mockResolvedValue({
        data: null,
        error: { message: 'Invalid refresh token' },
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'invalid-refresh-token' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Refresh Failed');
    });
  });
});
