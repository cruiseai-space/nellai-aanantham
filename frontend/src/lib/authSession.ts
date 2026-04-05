/**
 * Browser auth state: tokens + user snapshot. All auth and DB access go through the backend API;
 * the SPA never talks to Supabase directly.
 */

const STORAGE_KEY = 'nellai-auth-session'

export interface AuthSessionTokens {
  access_token: string
  refresh_token: string
  expires_at?: number
}

export interface AuthUser {
  id: string
  email?: string
  user_metadata?: { full_name?: string }
}

interface PersistedPayload {
  user: AuthUser
  session: AuthSessionTokens
}

let memory: PersistedPayload | null = null

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
}

function withBase(path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function hydrateAuthFromStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      memory = null
      return
    }
    memory = JSON.parse(raw) as PersistedPayload
  } catch {
    memory = null
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function persistAuthState(user: AuthUser, session: AuthSessionTokens): void {
  memory = { user, session }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
  }
}

export function updateSessionTokens(session: AuthSessionTokens): void {
  if (!memory) {
    memory = { user: { id: '' }, session }
  } else {
    memory = { user: memory.user ?? { id: '' }, session }
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
  }
}

export function clearAuthState(): void {
  memory = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function getAccessToken(): string | null {
  return memory?.session?.access_token ?? null
}

export function getRefreshToken(): string | null {
  return memory?.session?.refresh_token ?? null
}

export function getPersistedAuth(): PersistedPayload | null {
  return memory
}

let refreshInFlight: Promise<boolean> | null = null

export async function refreshAccessToken(): Promise<boolean> {
  hydrateAuthFromStorage()

  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const rt = getRefreshToken()
    if (!rt) return false

    const res = await fetch(withBase('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    })

    if (!res.ok) return false

    const body = (await res.json()) as {
      session?: { access_token: string; refresh_token: string; expires_at?: number }
    }
    const s = body.session
    if (!s?.access_token || !s?.refresh_token) return false

    updateSessionTokens({
      access_token: s.access_token,
      refresh_token: s.refresh_token,
      expires_at: s.expires_at,
    })
    return true
  })().finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}

if (typeof window !== 'undefined') {
  hydrateAuthFromStorage()
}
