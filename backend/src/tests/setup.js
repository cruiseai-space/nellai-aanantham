/**
 * Test Setup - Mock Supabase and configure test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SUPABASE_API_URL = 'https://test.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'test-service-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.GROQ_API_KEY = 'test-groq-key';

// Mock Supabase client
const mockSupabaseData = {
  users: new Map(),
  ingredients: new Map(),
  batches: new Map(),
  orders: new Map(),
  orderItems: new Map(),
  products: new Map(),
  recipes: new Map(),
};

// Reset mock data before each test
beforeEach(() => {
  mockSupabaseData.users.clear();
  mockSupabaseData.ingredients.clear();
  mockSupabaseData.batches.clear();
  mockSupabaseData.orders.clear();
  mockSupabaseData.orderItems.clear();
  mockSupabaseData.products.clear();
  mockSupabaseData.recipes.clear();
  jest.clearAllMocks();
});

// Supabase mock builder
const createMockQueryBuilder = (tableName) => {
  let filters = {};
  let selectedFields = '*';
  let insertData = null;
  let updateData = null;
  let orderConfig = null;

  const builder = {
    select: jest.fn((fields) => {
      selectedFields = fields;
      return builder;
    }),
    insert: jest.fn((data) => {
      insertData = data;
      return builder;
    }),
    update: jest.fn((data) => {
      updateData = data;
      return builder;
    }),
    delete: jest.fn(() => builder),
    eq: jest.fn((field, value) => {
      filters[field] = value;
      return builder;
    }),
    order: jest.fn((field, config) => {
      orderConfig = { field, config };
      return builder;
    }),
    single: jest.fn(() => {
      return Promise.resolve({ data: null, error: null });
    }),
    then: (resolve) => {
      resolve({ data: [], error: null });
    },
  };

  return builder;
};

// Mock Supabase Admin
const mockSupabaseAdmin = {
  auth: {
    admin: {
      createUser: jest.fn(),
      signOut: jest.fn(),
    },
    signInWithPassword: jest.fn(),
    refreshSession: jest.fn(),
    getUser: jest.fn(),
  },
  from: jest.fn((tableName) => createMockQueryBuilder(tableName)),
};

// Mock the Supabase module
jest.mock('../config/supabase', () => ({
  supabaseAdmin: mockSupabaseAdmin,
  supabase: mockSupabaseAdmin,
}));

// Mock Groq client
const mockGroqClient = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

jest.mock('../config/groq', () => mockGroqClient);

// Helper function to generate mock JWT token
const generateMockToken = (userId = 'test-user-id') => {
  return `mock-token-${userId}`;
};

// Helper function to create authenticated request headers
const createAuthHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

// Mock user for auth tests
const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
  created_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  ...overrides,
});

// Setup authenticated user mock
const setupAuthenticatedUser = (user = createMockUser()) => {
  mockSupabaseAdmin.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  });
  return user;
};

// Setup unauthenticated user mock
const setupUnauthenticatedUser = () => {
  mockSupabaseAdmin.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Invalid token' },
  });
};

// Export mocks and helpers
global.mockSupabaseAdmin = mockSupabaseAdmin;
global.mockGroqClient = mockGroqClient;
global.mockSupabaseData = mockSupabaseData;
global.generateMockToken = generateMockToken;
global.createAuthHeader = createAuthHeader;
global.createMockUser = createMockUser;
global.setupAuthenticatedUser = setupAuthenticatedUser;
global.setupUnauthenticatedUser = setupUnauthenticatedUser;

module.exports = {
  mockSupabaseAdmin,
  mockGroqClient,
  mockSupabaseData,
  generateMockToken,
  createAuthHeader,
  createMockUser,
  setupAuthenticatedUser,
  setupUnauthenticatedUser,
};
