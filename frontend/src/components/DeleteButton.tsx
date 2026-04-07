import { useState, useRef, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface DeleteButtonProps {
  onDelete: () => Promise<void>
  disabled?: boolean
  className?: string
}

export function DeleteButton({ onDelete, disabled = false, className = '' }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const deleteIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startDelete = useCallback(() => {
    if (disabled || isDeleting) return

    setIsDeleting(true)
    setDeleteProgress(0)
    setError(null)

    // Progress animation
    const startTime = Date.now()
    const duration = 3000 // 3 seconds hold time
    
    deleteIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / duration) * 100, 100)
      setDeleteProgress(progress)
    }, 16) // ~60fps

    // Auto-delete after hold duration
    deleteTimeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true)
        await onDelete()
        // Reset state after successful deletion
        setIsLoading(false)
        cancelDelete()
      } catch (error) {
        console.error('Failed to delete:', error)
        setError('Failed to delete. Please try again.')
        setIsLoading(false)
        cancelDelete()
      }
    }, duration)
  }, [disabled, isDeleting, onDelete])

  const cancelDelete = useCallback(() => {
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current)
      deleteTimeoutRef.current = null
    }
    if (deleteIntervalRef.current) {
      clearInterval(deleteIntervalRef.current)
      deleteIntervalRef.current = null
    }
    setIsDeleting(false)
    setDeleteProgress(0)
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      cancelDelete()
    }
  }, [cancelDelete])

  return (
    <div className={`absolute -top-3 -right-3 z-10 ${className}`}>
      <Button
        variant='ghost'
        size='sm'
        onClick={(e) => {
          // Prevent parent element interactions
          e.stopPropagation()
          e.preventDefault()
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
          startDelete()
        }}
        onMouseUp={(e) => {
          e.stopPropagation()
          e.preventDefault()
          if (isDeleting && deleteProgress < 100) {
            cancelDelete()
          }
        }}
        onMouseLeave={(e) => {
          e.stopPropagation()
          if (isDeleting && deleteProgress < 100) {
            cancelDelete()
          }
        }}
        onTouchStart={(e) => {
          e.stopPropagation()
          e.preventDefault()
          startDelete()
        }}
        onTouchEnd={(e) => {
          e.stopPropagation()
          e.preventDefault()
          if (isDeleting && deleteProgress < 100) {
            cancelDelete()
          }
        }}
        disabled={isLoading || disabled}
        className={`
          relative h-8 w-8 p-0 rounded-full overflow-hidden shadow-lg
          ${isDeleting 
            ? 'bg-red-600 ring-2 ring-red-200' 
            : 'bg-red-500 hover:bg-red-600 hover:shadow-xl'
          }
          text-white
          transition-all duration-200
        `}
        aria-label={isDeleting ? 'Hold to delete' : 'Hold to delete'}
        title='Hold to delete'
      >
        {/* Progress circle background */}
        {isDeleting && (
          <div className='absolute inset-0'>
            <svg className='w-full h-full -rotate-90' viewBox='0 0 32 32'>
              {/* Background circle */}
              <circle
                cx='16'
                cy='16'
                r='14'
                stroke='rgba(255,255,255,0.2)'
                strokeWidth='3'
                fill='none'
              />
              {/* Progress circle */}
              <circle
                cx='16'
                cy='16'
                r='14'
                stroke='#fbbf24'
                strokeWidth='3'
                fill='none'
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - deleteProgress / 100)}`}
                className='transition-all duration-75 ease-linear drop-shadow-sm'
                style={{
                  filter: 'drop-shadow(0 0 2px rgba(251, 191, 36, 0.5))'
                }}
              />
            </svg>
          </div>
        )}
        
        {/* X icon */}
        <X className={`h-4 w-4 relative z-10 ${isDeleting ? 'animate-pulse' : ''}`} />
      </Button>
      
      {/* Hold instruction tooltip */}
      {isDeleting && (
        <div className='absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-20'>
          <div className='bg-gray-900 text-white text-xs px-3 py-1 rounded-md shadow-lg'>
            Hold to delete...
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className='absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-20'>
          <div className='bg-red-600 text-white text-xs px-3 py-1 rounded-md shadow-lg'>
            {error}
          </div>
        </div>
      )}
    </div>
  )
}