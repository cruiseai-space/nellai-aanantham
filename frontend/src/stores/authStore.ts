import { create } from 'zustand'
import {
  clearAuthState,
  getAccessToken,
  getApiBaseUrl,
  getPersistedAuth,
  hydrateAuthFromStorage,
  persistAuthState,
  refreshAccessToken,
  type AuthSessionTokens,
  type AuthUser,
} from '@/lib/authSession'

interface AuthState {
  user: AuthUser | null
  session: AuthSessionTokens | null
  isLoading: boolean
  isAuthenticated: boolean

  setUser: (user: AuthUser | null) => void
  setSession: (session: AuthSessionTokens | null) => void
  setLoading: (loading: boolean) => void
  login: (email: string, password: string) => Promise<{ error: Error | null }>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

function withBase(path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

function mapMeUser(raw: {
  id: string
  email?: string
  fullName?: string
}): AuthUser {
  return {
    id: raw.id,
    email: raw.email,
    user_metadata: { full_name: raw.fullName },
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const res = await fetch(withBase('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const body = (await res.json()) as {
        message?: string
        error?: string
        user?: { id: string; email?: string; fullName?: string }
        session?: { access_token: string; refresh_token: string; expires_at?: number }
      }

      if (!res.ok) {
        set({ isLoading: false })
        const msg =
          typeof body.message === 'string' && body.message
            ? body.message
            : typeof body.error === 'string' && body.error
              ? body.error
              : res.status === 401
                ? 'Invalid email or password. After `npm run seed:admin` in backend/, use admin@nellai.com / Admin@123, or create a user in the dashboard.'
                : 'Sign-in failed.'
        return { error: new Error(msg) }
      }

      if (!body.user || !body.session?.access_token || !body.session?.refresh_token) {
        set({ isLoading: false })
        return { error: new Error('Invalid response from server.') }
      }

      const user = mapMeUser(body.user)
      const session: AuthSessionTokens = {
        access_token: body.session.access_token,
        refresh_token: body.session.refresh_token,
        expires_at: body.session.expires_at,
      }

      persistAuthState(user, session)

      set({
        user,
        session,
        isAuthenticated: true,
        isLoading: false,
      })

      return { error: null }
    } catch (error) {
      set({ isLoading: false })

      const err = error as Error
      if (
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('CONNECTION_TIMED_OUT') ||
        err.message?.includes('NetworkError') ||
        err.name === 'TypeError'
      ) {
        return {
          error: new Error(
            'Could not reach the API. Start the backend (`npm run dev` in backend/), check VITE_API_URL in frontend/.env, and your network.'
          ),
        }
      }

      return { error: err }
    }
  },

  logout: async () => {
    set({ isLoading: true })
    const token = getAccessToken()
    try {
      if (token) {
        await fetch(withBase('/auth/logout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuthState()
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  checkSession: async () => {
    set({ isLoading: true })
    hydrateAuthFromStorage()

    const tok = getAccessToken()
    if (!tok) {
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      })
      return
    }

    try {
      const fetchMe = () =>
        fetch(withBase('/auth/me'), {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        })

      let res = await fetchMe()

      if (res.status === 401) {
        const ok = await refreshAccessToken()
        if (!ok) {
          clearAuthState()
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          })
          return
        }
        res = await fetchMe()
      }

      if (!res.ok) {
        clearAuthState()
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        })
        return
      }

      const body = (await res.json()) as {
        user: { id: string; email?: string; fullName?: string }
      }
      const user = mapMeUser(body.user)
      const snap = getPersistedAuth()
      if (!snap?.session) {
        clearAuthState()
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        })
        return
      }

      persistAuthState(user, snap.session)

      set({
        user,
        session: snap.session,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      console.error('Session check failed:', error)
      clearAuthState()
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },
}))
