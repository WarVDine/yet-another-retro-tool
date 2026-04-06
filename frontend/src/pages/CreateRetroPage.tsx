import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { TemplateSelector } from '@/components/TemplateSelector'
import { roomApi } from '@/utils/api'

export function CreateRetroPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: 'classic' as const,
    facilitatorName: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.facilitatorName.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const room = await roomApi.createRoom({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        template: formData.template,
        facilitatorName: formData.facilitatorName.trim()
      })
      
      // Navigate to the created room (for now, we'll navigate to home with success message)
      // TODO: Replace with actual room page when implemented
      navigate('/', { 
        state: { 
          message: `Room "${room.name}" created successfully! Facilitator code: ${room.facilitatorCode}` 
        }
      })
    } catch (error) {
      console.error('Failed to create room:', error)
      setError(error instanceof Error ? error.message : 'Failed to create room. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null) // Clear error when user starts typing
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Retrospective</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Retrospective Name *
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="Sprint 23 Retrospective"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="facilitatorName" className="block text-sm font-medium mb-2">
                    Your Name (Facilitator) *
                  </label>
                  <Input
                    id="facilitatorName"
                    value={formData.facilitatorName}
                    onChange={(e) => updateFormData('facilitatorName', e.target.value)}
                    placeholder="Your name"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Description (Optional)
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder="What's this retrospective about?"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium mb-4">
                  Choose Template
                </label>
                <TemplateSelector
                  selectedTemplate={formData.template}
                  onTemplateChange={(template) => updateFormData('template', template as typeof formData.template)}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" asChild disabled={isLoading}>
                  <Link to="/">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Retrospective
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}