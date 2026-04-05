import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiErrors'

/**
 * Run an async admin mutation; show Sonner success on resolve, error on reject.
 * Re-throws so callers can still branch (e.g. skip closing a modal on failure).
 */
export async function withAdminToast<T>(promise: Promise<T>, successMessage: string): Promise<T> {
  try {
    const result = await promise
    toast.success(successMessage)
    return result
  } catch (e) {
    toast.error(getApiErrorMessage(e))
    throw e
  }
}
