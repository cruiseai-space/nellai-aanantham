import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { supabase } from '@/lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API Service Functions
export const ingredientsApi = {
  getAll: () => api.get('/ingredients'),
  getById: (id: string) => api.get(`/ingredients/${id}`),
  create: (data: unknown) => api.post('/ingredients', data),
  update: (id: string, data: unknown) => api.put(`/ingredients/${id}`, data),
  delete: (id: string) => api.delete(`/ingredients/${id}`),
  getLowStock: () => api.get('/ingredients/low-stock'),
}

export const batchesApi = {
  getAll: () => api.get('/batches'),
  getById: (id: string) => api.get(`/batches/${id}`),
  create: (data: unknown) => api.post('/batches', data),
  update: (id: string, data: unknown) => api.put(`/batches/${id}`, data),
  delete: (id: string) => api.delete(`/batches/${id}`),
  getByIngredient: (ingredientId: string) => api.get(`/batches/ingredient/${ingredientId}`),
  getExpiringSoon: () => api.get('/batches/expiring-soon'),
}

export const recipesApi = {
  getAll: () => api.get('/recipes'),
  getById: (id: string) => api.get(`/recipes/${id}`),
  create: (data: unknown) => api.post('/recipes', data),
  update: (id: string, data: unknown) => api.put(`/recipes/${id}`, data),
  delete: (id: string) => api.delete(`/recipes/${id}`),
  getCost: (id: string) => api.get(`/recipes/${id}/cost`),
}

export const productsApi = {
  getAll: () => api.get('/products'),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: unknown) => api.post('/products', data),
  update: (id: string, data: unknown) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
}

export const ordersApi = {
  getAll: () => api.get('/orders'),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: unknown) => api.post('/orders', data),
  update: (id: string, data: unknown) => api.put(`/orders/${id}`, data),
  delete: (id: string) => api.delete(`/orders/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
  getByStatus: (status: string) => api.get(`/orders/status/${status}`),
  getToday: () => api.get('/orders/today'),
}

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getAlerts: () => api.get('/dashboard/alerts'),
}
