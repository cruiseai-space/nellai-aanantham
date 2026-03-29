import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSubdomain } from '@/hooks/useSubdomain'
import { AdminRoutes, CustomerRoutes } from '@/routes'
import { OfflineBanner } from '@/components/OfflineBanner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function AppContent() {
  const { subdomain } = useSubdomain()

  if (subdomain === 'admin') {
    return <AdminRoutes />
  }

  return <CustomerRoutes />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OfflineBanner />
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
