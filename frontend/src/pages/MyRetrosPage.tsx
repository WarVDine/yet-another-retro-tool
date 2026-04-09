import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useGuestUser } from '@/contexts/GuestUserContext'
import { guestUserApi } from '@/utils/api'
import { RetroList } from '@/components/RetroList'
import { FacilitatedRetroItem } from '@yet-another-retro-tool/shared'

export function MyRetrosPage() {
  const { guestUser } = useGuestUser()
  const [retros, setRetros] = useState<FacilitatedRetroItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRetros = async () => {
      if (!guestUser.guestId) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await guestUserApi.getFacilitatedRetros(guestUser.guestId)
        setRetros(response.retros)
      } catch (error) {
        console.error('Failed to load facilitated retros:', error)
        setError('Failed to load your facilitated retros.')
      } finally {
        setIsLoading(false)
      }
    }

    loadRetros()
  }, [guestUser.guestId])

  const handleRetry = async () => {
    if (!guestUser.guestId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await guestUserApi.getFacilitatedRetros(guestUser.guestId)
      setRetros(response.retros)
    } catch (error) {
      console.error('Failed to load facilitated retros:', error)
      setError('Failed to load your facilitated retros.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Facilitated Retros</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              View and manage all the retrospectives you've facilitated
            </p>
          </div>
        </div>

        {/* Retros List */}
        <div className="mb-8">
          <RetroList
            retros={retros}
            isLoading={isLoading}
            error={error}
            emptyMessage="You haven't facilitated any retros yet."
            onRetry={handleRetry}
          />
        </div>

        {/* Create New Retro CTA */}
        {!isLoading && retros.length === 0 && !error && (
          <div className="text-center">
            <Button asChild size="lg">
              <Link to="/create">Create Your First Retro</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}