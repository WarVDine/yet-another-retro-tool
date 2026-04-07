import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Users, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useGuestUser } from '@/contexts/GuestUserContext'
import { roomApi } from '@/utils/api'

export function HomePage() {
  const navigate = useNavigate()
  const { guestUser } = useGuestUser()
  const [sessionCode, setSessionCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sessionCode.trim()) {
      setJoinError('Please enter a session code')
      return
    }

    // Guest user is guaranteed to exist due to the modal
    if (!guestUser.guestId) {
      setJoinError('User profile not ready. Please refresh the page.')
      return
    }

    setIsJoining(true)
    setJoinError(null)

    try {
      const result = await roomApi.joinRoom({
        code: sessionCode.trim(),
        guestId: guestUser.guestId
      })

      navigate(`/retro/${result.roomId}`)
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Failed to join room')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Yet Another Retro Tool</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Run effective retrospectives with your team. Gather feedback, identify improvements, and track action items.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Create Retro</CardTitle>
              <CardDescription>Start a new retrospective session for your team</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link to="/create">Create New Retro</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Join Retro</CardTitle>
              <CardDescription>Join an existing retrospective with a session code</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinSubmit} className="space-y-4">
                {joinError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                    {joinError}
                  </div>
                )}

                <div>
                  <label htmlFor="session-code" className="block text-sm font-medium text-gray-700 mb-1">
                    Session Code
                  </label>
                  <Input
                    id="session-code"
                    placeholder="Enter session code"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value)}
                    disabled={isJoining}
                    aria-describedby="session-code-help"
                  />
                  <p id="session-code-help" className="text-xs text-gray-500 mt-1">
                    The code provided by the facilitator
                  </p>
                </div>

                {guestUser.displayName && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md text-sm">
                    Joining as: <strong>{guestUser.displayName}</strong>
                  </div>
                )}

                <Button 
                  type="submit" 
                  variant="outline" 
                  className="w-full cursor-pointer" 
                  disabled={isJoining || !sessionCode.trim()}
                >
                  {isJoining && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Join Session
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
