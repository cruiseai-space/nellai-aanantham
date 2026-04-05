import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import {
  LayoutDashboard,
  Package,
  Boxes,
  ChefHat,
  ShoppingCart,
  ClipboardList,
  LogOut,
  Menu,
} from 'lucide-react'
import { useState } from 'react'

interface MainLayoutProps {
  children: ReactNode
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/ingredients', label: 'Ingredients', icon: Package },
  { path: '/batches', label: 'Batches', icon: Boxes },
  { path: '/recipes', label: 'Recipes', icon: ChefHat },
  { path: '/products', label: 'Products', icon: ShoppingCart },
  { path: '/orders', label: 'Orders', icon: ClipboardList },
]

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated, isLoading, logout, user } = useAuthStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-surface-elevated shadow-elevated
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-surface-container">
            <h1 className="text-xl font-display font-bold text-gradient">
              Nellai Aanantham
            </h1>
            <p className="text-sm text-on-surface-secondary mt-1">Bakery Inventory</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-md
                    transition-all duration-micro
                    ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-subtle'
                        : 'text-on-surface hover:bg-surface-container'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-surface-container">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email || 'User'}</p>
                <p className="text-xs text-on-surface-secondary">Admin</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="
                w-full flex items-center justify-center gap-2
                px-4 py-2 rounded-md
                text-error bg-error/10 hover:bg-error/20
                transition-colors duration-micro
              "
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden bg-surface-elevated shadow-subtle p-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-surface-container transition-colors"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-display font-bold text-gradient">
            Nellai Aanantham
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
