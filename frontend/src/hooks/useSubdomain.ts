import { useLocation } from 'react-router-dom'

/** Paths that belong to the admin SPA (must match admin.routes.tsx). */
const ADMIN_PATHS = [
  '/login',
  '/dashboard',
  '/ingredients',
  '/batches',
  '/recipes',
  '/products',
  '/orders',
]

export const useSubdomain = () => {
  // Subscribe to client-side navigation so AppContent switches admin vs customer when path changes.
  const location = useLocation()

  if (typeof window === 'undefined') {
    return { subdomain: 'customer' as const }
  }

  const hostname = window.location.hostname
  const isDev = hostname.includes('localhost') || hostname.includes('127.0.0.1')

  if (isDev) {
    const params = new URLSearchParams(window.location.search)
    if (params.get('scope') === 'admin') {
      return { subdomain: 'admin' as const }
    }

    const path = location.pathname
    const isAdminPath = ADMIN_PATHS.some(
      (p) => path === p || path.startsWith(`${p}/`)
    )
    if (isAdminPath) {
      return { subdomain: 'admin' as const }
    }
    return { subdomain: 'customer' as const }
  }

  const parts = hostname.split('.')
  if (parts.length > 2 && parts[0] === 'admin') {
    return { subdomain: 'admin' as const }
  }

  return { subdomain: 'customer' as const }
}
