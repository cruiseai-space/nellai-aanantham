import { AxiosError } from 'axios'

type ApiErrorBody = {
  error?: string
  message?: string
}

/** Normalize backend / network errors for display (toasts, alerts). */
export function getApiErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiErrorBody | string | undefined
    if (data && typeof data === 'object') {
      if (typeof data.error === 'string' && data.error.trim()) return data.error
      if (typeof data.message === 'string' && data.message.trim()) return data.message
    }
    if (typeof data === 'string' && data.trim()) return data

    if (err.code === 'ECONNABORTED') {
      return 'Request timed out. The server may be slow or unreachable—try again in a moment.'
    }
    if (err.response?.status === 503) {
      return 'Service temporarily unavailable (often a database or network issue). Check your connection and try again.'
    }
    if (!err.response) {
      return 'Network error. Is the API server running and VITE_API_URL correct?'
    }
  }
  if (err instanceof Error && err.message) return err.message
  return 'Something went wrong'
}
