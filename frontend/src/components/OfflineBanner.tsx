import { AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useEffect, useState } from 'react'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const [showReconnected, setShowReconnected] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
    } else if (wasOffline && isOnline) {
      // Show "reconnected" message briefly
      setShowReconnected(true)
      const timer = setTimeout(() => {
        setShowReconnected(false)
        setWasOffline(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline])

  if (isOnline && !showReconnected) {
    return null
  }

  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-3 shadow-lg">
        <div className="container mx-auto flex items-center justify-center gap-2">
          <Wifi className="h-5 w-5" />
          <p className="text-sm font-medium">
            Connection restored
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <WifiOff className="h-5 w-5" />
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm font-medium">
          No internet connection. Please check your network and try again.
        </p>
      </div>
    </div>
  )
}
