/**
 * Auth Store Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../../store/authStore';
import * as supabaseModule from '../../config/supabase';

// Mock Supabase
vi.mock('../../config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useAuthStore.getState();
    store.user = null;
    store.session = null;
    store.isLoading = false;
    vi.clearAllMocks();
  });

  it('should initialize with null user and session', () => {
    const { user, session, isLoading } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(session).toBeNull();
    expect(isLoading).toBe(false);
  });

  it('should set user and session on login', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    };
    const mockSession = {
      access_token: 'token-123',
      user: mockUser,
    };

    vi.mocked(supabaseModule.supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    } as any);

    const store = useAuthStore.getState();
    await store.login('test@example.com', 'password123');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.session).toEqual(mockSession);
  });

  it('should handle login errors', async () => {
    const mockError = { message: 'Invalid credentials' };

    vi.mocked(supabaseModule.supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: mockError,
    } as any);

    const store = useAuthStore.getState();
    
    await expect(async () => {
      await store.login('test@example.com', 'wrongpassword');
    }).rejects.toThrow('Invalid credentials');
  });

  it('should clear user and session on logout', async () => {
    const store = useAuthStore.getState();
    
    // Set initial state
    store.user = { id: 'user-123', email: 'test@example.com' } as any;
    store.session = { access_token: 'token-123' } as any;

    vi.mocked(supabaseModule.supabase.auth.signOut).mockResolvedValue({
      error: null,
    } as any);

    await store.logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });

  it('should check session on initialization', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };
    const mockSession = {
      access_token: 'token-123',
      user: mockUser,
    };

    vi.mocked(supabaseModule.supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);

    const store = useAuthStore.getState();
    await store.checkSession();

    const state = useAuthStore.getState();
    expect(state.session).toEqual(mockSession);
  });

  it('should handle null session gracefully', async () => {
    vi.mocked(supabaseModule.supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    const store = useAuthStore.getState();
    await store.checkSession();

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
  });
});
