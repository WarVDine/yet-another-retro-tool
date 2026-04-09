import { FacilitatedRetroItem } from '@yet-another-retro-tool/shared'
import { RetroListItem } from './RetroListItem'

interface RetroListProps {
  retros: FacilitatedRetroItem[]
  isLoading?: boolean
  error?: string | null
  emptyMessage?: string
  onRetry?: () => void
}

export function RetroList({ 
  retros, 
  isLoading = false, 
  error = null, 
  emptyMessage = "You haven't facilitated any retros yet.",
  onRetry 
}: RetroListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white shadow-sm animate-pulse"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="flex justify-end pt-2">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-800 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  if (retros.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
          <p className="text-gray-600 mb-4">{emptyMessage}</p>
          <p className="text-sm text-gray-500">
            Create your first retro to get started!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {retros.map((retro) => (
        <RetroListItem key={retro.id} retro={retro} />
      ))}
    </div>
  )
}