import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Users, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useGuestUser } from '@/contexts/GuestUserContext'

export function HomePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { guestUser } = useGuestUser()
  const [sessionCode, setSessionCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null)

  // Handle redirect messages from room access attempts
  useEffect(() => {
    const errorParam = searchParams.get('error')
    
    if (errorParam === 'not-participant') {
      setRedirectMessage('You need to join this retrospective with the participant code to access it.')
      // Clear the URL parameter
      setSearchParams({})
    } else if (errorParam === 'room-not-found') {
      setRedirectMessage('The retrospective room you tried to access was not found.')
      // Clear the URL parameter
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

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
      // Navigate directly to the code-based URL - auto-join will happen there
      navigate(`/retro/${sessionCode.trim()}`)
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

        {/* Redirect Message */}
        {redirectMessage && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    {redirectMessage}
                  </p>
                  <p className="text-sm mt-1">
                    Use the form below to join with your participant code.
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setRedirectMessage(null)}
                    className="inline-flex text-amber-400 hover:text-amber-600"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
