import axios from 'axios'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import {
  clearAuthState,
  getAccessToken,
  refreshAccessToken,
  getPersistedAuth,
} from '@/lib/authSession'
import { useAuthStore } from '@/stores/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/** Backend wraps JSON as `{ success, data?, error? }`. Axios `response.data` is that envelope. */
export function unwrapApiData<T>(res: AxiosResponse<unknown>): T {
  const body = res.data as { success?: boolean; data?: unknown; error?: string }
  if (body && typeof body === 'object' && 'success' in body) {
    if (!body.success) {
      throw new Error(typeof body.error === 'string' ? body.error : 'Request failed')
    }
    return body.data as T
  }
  return res.data as T
}

export function unwrapApiList<T>(res: AxiosResponse<unknown>): T[] {
  const raw = unwrapApiData<T[] | null | undefined>(res)
  return Array.isArray(raw) ? raw : []
}

/** Align with backend Supabase fetch budget; billing can run longer (FIFO). */
const DEFAULT_TIMEOUT_MS = 60_000

export const api = axios.create({
  baseURL: API_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})

type RequestConfigWithRetry = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const cfg = error.config as RequestConfigWithRetry | undefined
    const status = error.response?.status

    if (status !== 401 || !cfg) {
      return Promise.reject(error)
    }

    const url = cfg.url ?? ''
    if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    if (cfg._retry) {
      clearAuthState()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    cfg._retry = true
    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      clearAuthState()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    const snap = getPersistedAuth()
    if (snap?.session) {
      useAuthStore.getState().setSession(snap.session)
    }

    cfg.headers = cfg.headers ?? {}
    cfg.headers.Authorization = `Bearer ${getAccessToken() ?? ''}`
    return api(cfg)
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
  updateStatus: (id: string, status: string) => api.put(`/orders/${id}`, { status }),
  getByStatus: (status: string) => api.get(`/orders/status/${status}`),
  getToday: () => api.get('/orders/today'),
  addItem: (orderId: string, body: { product_id: string; quantity: number }) =>
    api.post(`/orders/${orderId}/items`, body),
  removeItem: (orderId: string, itemId: string) =>
    api.delete(`/orders/${orderId}/items/${itemId}`),
  bill: (orderId: string) =>
    api.post(`/orders/${orderId}/bill`, null, { timeout: 120_000 }),
}

/** Bill response includes `summary` alongside `data`; use this instead of `unwrapApiData`. */
export function unwrapBillOrder(res: AxiosResponse<unknown>): {
  order: unknown
  summary: unknown
} {
  const body = res.data as {
    success?: boolean
    data?: unknown
    summary?: unknown
    error?: string
  }
  if (!body || typeof body !== 'object' || body.success !== true) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'Bill order failed')
  }
  return { order: body.data, summary: body.summary }
}

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getAlerts: () => api.get('/dashboard/alerts'),
}
