import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { Mail, Lock, Eye, EyeOff, WifiOff } from 'lucide-react'

export function LoginPage() {
  const { login, isLoading } = useAuthStore()
  const isOnline = useOnlineStatus()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isOnline) {
      setError('No internet connection. Please check your network and try again.')
      return
    }

    const { error } = await login(email, password)
    if (error) {
      setError(error.message || 'Login failed. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold text-on-surface mb-2">
          Welcome Back
        </h2>
        <p className="text-on-surface-secondary">
          Sign in to manage your bakery inventory
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-error/10 text-error text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-tertiary" size={20} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="
                w-full pl-10 pr-4 py-3 rounded-md
                bg-surface border-none
                text-on-surface placeholder:text-on-surface-tertiary
                focus:outline-none focus:ring-2 focus:ring-primary
                transition-shadow duration-micro
              "
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-tertiary" size={20} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="
                w-full pl-10 pr-12 py-3 rounded-md
                bg-surface border-none
                text-on-surface placeholder:text-on-surface-tertiary
                focus:outline-none focus:ring-2 focus:ring-primary
                transition-shadow duration-micro
              "
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-tertiary hover:text-on-surface transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !isOnline}
        className="
          w-full py-3 px-4 rounded-md
          gradient-primary text-on-primary font-medium
          hover:opacity-90 active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-micro
          flex items-center justify-center gap-2
        "
      >
        {!isOnline ? (
          <>
            <WifiOff size={20} />
            <span>No Connection</span>
          </>
        ) : isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            <span>Signing in...</span>
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  )
}
