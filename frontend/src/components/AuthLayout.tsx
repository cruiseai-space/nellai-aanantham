import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-gradient mb-2">
            Nellai Aanantham
          </h1>
          <p className="text-on-surface-secondary">Bakery Inventory Management</p>
        </div>

        {/* Auth card */}
        <div className="bg-surface-elevated rounded-lg shadow-elevated p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-on-surface-tertiary mt-6">
          © 2026 Nellai Aanantham Bakery. All rights reserved.
        </p>
      </div>
    </div>
  )
}
