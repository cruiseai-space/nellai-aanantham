/**
 * Auth Store Tests — auth goes through backend /api/auth/*; session is stored locally.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  hydrateAuthFromStorage: vi.fn(),
  persistAuthState: vi.fn(),
  clearAuthState: vi.fn(),
  refreshAccessToken: vi.fn(),
  getAccessToken: vi.fn(() => null as string | null),
  getPersistedAuth: vi.fn(() => null as { user: { id: string; email?: string }; session: { access_token: string; refresh_token: string } } | null),
  getRefreshToken: vi.fn(() => null as string | null),
  updateSessionTokens: vi.fn(),
}))

vi.mock('@/lib/authSession', () => ({
  getApiBaseUrl: () => 'http://localhost:3001/api',
  hydrateAuthFromStorage: authMocks.hydrateAuthFromStorage,
  persistAuthState: authMocks.persistAuthState,
  clearAuthState: authMocks.clearAuthState,
  refreshAccessToken: authMocks.refreshAccessToken,
  getAccessToken: authMocks.getAccessToken,
  getRefreshToken: authMocks.getRefreshToken,
  getPersistedAuth: authMocks.getPersistedAuth,
  updateSessionTokens: authMocks.updateSessionTokens,
}))

import { useAuthStore } from '@/stores/authStore'

describe('AuthStore', () => {
  beforeEach(() => {
    authMocks.hydrateAuthFromStorage.mockClear()
    authMocks.persistAuthState.mockClear()
    authMocks.clearAuthState.mockClear()
    authMocks.refreshAccessToken.mockClear()
    authMocks.getAccessToken.mockReset()
    authMocks.getAccessToken.mockReturnValue(null)
    authMocks.getPersistedAuth.mockReset()
    authMocks.getPersistedAuth.mockReturnValue(null)
    vi.clearAllMocks()

    const store = useAuthStore.getState()
    store.user = null
    store.session = null
    store.isAuthenticated = false
    store.isLoading = false
  })

  it('should initialize with null user and session', () => {
    const { user, session, isLoading } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(session).toBeNull()
    expect(isLoading).toBe(false)
  })

  it('should set user and session on login', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      fullName: 'Test User',
    }
    const mockSession = {
      access_token: 'token-a',
      refresh_token: 'token-r',
      expires_at: 9999999999,
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Login successful',
        user: mockUser,
        session: mockSession,
      }),
    }) as unknown as typeof fetch

    const store = useAuthStore.getState()
    const { error } = await store.login('test@example.com', 'password123')
    expect(error).toBeNull()

    expect(authMocks.persistAuthState).toHaveBeenCalled()
    const state = useAuthStore.getState()
    expect(state.user?.id).toBe(mockUser.id)
    expect(state.user?.email).toBe(mockUser.email)
    expect(state.session?.access_token).toBe(mockSession.access_token)
    expect(state.isAuthenticated).toBe(true)
  })

  it('should handle login errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Login Failed', message: 'Invalid login credentials' }),
    }) as unknown as typeof fetch

    const store = useAuthStore.getState()
    const { error } = await store.login('test@example.com', 'wrongpassword')

    expect(error?.message).toContain('Invalid')
  })

  it('should clear user and session on logout', async () => {
    const store = useAuthStore.getState()
    store.user = { id: 'user-123', email: 'test@example.com' }
    store.session = { access_token: 't', refresh_token: 'r' }
    store.isAuthenticated = true

    authMocks.getAccessToken.mockReturnValue('t')
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch

    await store.logout()

    expect(authMocks.clearAuthState).toHaveBeenCalled()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.session).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should check session when token exists and /me succeeds', async () => {
    authMocks.getAccessToken.mockReturnValue('valid')
    authMocks.getPersistedAuth.mockReturnValue({
      user: { id: 'u1', email: 'a@b.com' },
      session: { access_token: 'valid', refresh_token: 'r' },
    })

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: 'u1', email: 'a@b.com', fullName: 'A' },
      }),
    }) as unknown as typeof fetch

    const store = useAuthStore.getState()
    await store.checkSession()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.id).toBe('u1')
  })

  it('should handle null session on check', async () => {
    authMocks.getAccessToken.mockReturnValue(null)

    const store = useAuthStore.getState()
    await store.checkSession()

    const state = useAuthStore.getState()
    expect(state.session).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})
