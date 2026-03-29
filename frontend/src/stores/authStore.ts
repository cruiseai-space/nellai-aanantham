import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  login: (email: string, password: string) => Promise<{ error: Error | null }>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            set({ isLoading: false })
            return { error }
          }

          set({
            user: data.user,
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
          })

          return { error: null }
        } catch (error) {
          set({ isLoading: false })
          
          // Enhanced error handling for network issues
          const err = error as Error
          if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
            return {
              error: new Error('Unable to connect to server. Please check your internet connection and try again.')
            }
          }
          
          return { error: err }
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await supabase.auth.signOut()
        } catch (error) {
          console.error('Logout error:', error)
          // Continue with local logout even if network call fails
        } finally {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      checkSession: async () => {
        set({ isLoading: true })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            set({
              user: session.user,
              session,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch (error) {
          // Silently fail for session checks but log the error
          console.error('Session check failed:', error)
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Set up auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  const store = useAuthStore.getState()
  
  if (event === 'SIGNED_IN' && session) {
    store.setUser(session.user)
    store.setSession(session)
  } else if (event === 'SIGNED_OUT') {
    store.setUser(null)
    store.setSession(null)
  } else if (event === 'TOKEN_REFRESHED' && session) {
    store.setSession(session)
  }
})
