import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Users, Calendar, Loader2 } from 'lucide-react'
import { roomApi } from '@/utils/api'

export function HomePage() {
  const navigate = useNavigate()
  const [joinForm, setJoinForm] = useState({
    code: '',
    participantName: ''
  })
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!joinForm.code.trim() || !joinForm.participantName.trim()) {
      setJoinError('Please enter both code and your name')
      return
    }
    
    setIsJoining(true)
    setJoinError(null)
    
    try {
      const result = await roomApi.joinRoom({
        code: joinForm.code.trim(),
        participantName: joinForm.participantName.trim()
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Yet Another Retro Tool
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Run effective retrospectives with your team. Gather feedback, identify improvements, and track action items.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Create Retro</CardTitle>
              <CardDescription>
                Start a new retrospective session for your team
              </CardDescription>
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
              <CardDescription>
                Join an existing retrospective with a session code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinSubmit} className="space-y-4">
                {joinError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                    {joinError}
                  </div>
                )}
                
                <Input 
                  placeholder="Enter session code"
                  value={joinForm.code}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, code: e.target.value }))}
                  disabled={isJoining}
                />
                
                <Input 
                  placeholder="Your name"
                  value={joinForm.participantName}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, participantName: e.target.value }))}
                  disabled={isJoining}
                />
                
                <Button type="submit" variant="outline" className="w-full" disabled={isJoining}>
                  {isJoining && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Join Session
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Demo Retro</CardTitle>
              <CardDescription>
                Try out the tool with a sample retrospective
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full" asChild>
                <Link to="/retro/demo">View Demo</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}