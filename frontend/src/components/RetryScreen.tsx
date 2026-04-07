import { RefreshCw, WifiOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useGuestUser } from '@/contexts/GuestUserContext'

interface RetryScreenProps {
  error: string
}

export function RetryScreen({ error }: RetryScreenProps) {
  const { refreshGuestUser } = useGuestUser()

  const handleRetry = async () => {
    // Simply retry initialization - errors are handled via state in GuestUserContext
    await refreshGuestUser()
  }

  const handleCreateNew = () => {
    // Clear localStorage to force new user creation
    localStorage.removeItem('retro-guest-id')
    // Refresh to trigger the create flow
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6">
          <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Connection Issue
          </h2>
          <p className="text-gray-600 mb-2">
            We're having trouble connecting to our servers.
          </p>
          <p className="text-sm text-gray-500 bg-gray-100 p-3 rounded-md">
            {error}
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleRetry}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            onClick={handleCreateNew}
            variant="ghost"
            className="w-full"
          >
            Start Fresh
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          If the problem persists, try starting fresh to create a new session.
        </p>
      </div>
    </div>
  )
}