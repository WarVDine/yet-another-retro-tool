import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, ThumbsUp, AlertTriangle, CheckSquare } from 'lucide-react'

export function RetroPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Retrospective: {id}
          </h1>
          <p className="text-gray-600 mt-2">
            Share your thoughts and help the team improve for the next sprint.
          </p>
        </div>

        {/* Retro Columns */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* What went well */}
          <Card className="h-fit">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <ThumbsUp className="w-5 h-5" />
                What went well?
              </CardTitle>
              <CardDescription>
                Share positive feedback and successes from this sprint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Add your positive feedback here..."
                className="min-h-[100px]"
              />
              <Button size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
              
              {/* Sample items */}
              <div className="space-y-2">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm">Great team collaboration during the planning phase</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">Anonymous</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">👍 3</span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm">Successfully delivered all features on time</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">Team Member</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">👍 5</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What could be improved */}
          <Card className="h-fit">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-5 h-5" />
                What could be improved?
              </CardTitle>
              <CardDescription>
                Identify areas for improvement and potential solutions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Add areas for improvement here..."
                className="min-h-[100px]"
              />
              <Button size="sm" variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
              
              {/* Sample items */}
              <div className="space-y-2">
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm">Need better communication tools for remote work</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">Anonymous</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">👍 2</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action items */}
          <Card className="h-fit">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <CheckSquare className="w-5 h-5" />
                Action items
              </CardTitle>
              <CardDescription>
                Concrete steps to take for the next sprint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Add action items for next sprint here..."
                className="min-h-[100px]"
              />
              <Button size="sm" variant="secondary" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Action
              </Button>
              
              {/* Sample items */}
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm">Research and implement new communication platform</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">Assigned: John</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Due: Next Sprint</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}