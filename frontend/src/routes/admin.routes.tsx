import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { MainLayout, AuthLayout } from '@/components'
import {
  LoginPage,
  DashboardPage,
  IngredientsPage,
  BatchesPage,
  RecipesPage,
  ProductsPage,
  OrdersPage,
} from '@/pages'

export function AdminRoutes() {
  const { checkSession } = useAuthStore()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  return (
    <Routes>
      {/* Auth routes */}
      <Route
        path="/login"
        element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <MainLayout>
            <DashboardPage />
          </MainLayout>
        }
      />
      <Route
        path="/ingredients"
        element={
          <MainLayout>
            <IngredientsPage />
          </MainLayout>
        }
      />
      <Route
        path="/batches"
        element={
          <MainLayout>
            <BatchesPage />
          </MainLayout>
        }
      />
      <Route
        path="/recipes"
        element={
          <MainLayout>
            <RecipesPage />
          </MainLayout>
        }
      />
      <Route
        path="/products"
        element={
          <MainLayout>
            <ProductsPage />
          </MainLayout>
        }
      />
      <Route
        path="/orders"
        element={
          <MainLayout>
            <OrdersPage />
          </MainLayout>
        }
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
