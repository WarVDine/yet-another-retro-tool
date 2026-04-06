import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Users, Calendar } from 'lucide-react'

export function HomePage() {
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
            <CardContent className="space-y-4">
              <Input placeholder="Enter session code" />
              <Button variant="outline" className="w-full">
                Join Session
              </Button>
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