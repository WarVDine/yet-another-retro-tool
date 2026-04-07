import { useState } from 'react'
import { Loader2, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useGuestUser } from '@/contexts/GuestUserContext'

export function GuestUserModal() {
  const { guestUser, createGuestUser } = useGuestUser()
  const [displayName, setDisplayName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Don't show modal if we're still loading or if user already exists
  if (guestUser.isLoading || guestUser.guestId) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!displayName.trim()) {
      setError('Please enter your name')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      await createGuestUser(displayName.trim())
      // Modal will automatically hide once guestUser.guestId is set
    } catch (error) {
      console.error('Failed to create guest user:', error)
      setError('Failed to create user. Please try again.')
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to yet another retro tool</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Let's get started by setting up your profile. What should we call you?
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isCreating}
                className="text-center"
                autoFocus
                maxLength={50}
              />
              {error && <p className="text-sm text-destructive mt-2 text-center">{error}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isCreating || !displayName.trim()}>
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isCreating ? 'Creating Profile...' : 'Get Started'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
