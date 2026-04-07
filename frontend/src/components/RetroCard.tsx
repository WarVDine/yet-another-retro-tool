import { useState, useRef, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CardResponse } from '@yet-another-retro-tool/shared'

interface RetroCardProps {
  card: CardResponse & { isOwner?: boolean }
  columnColor: string
  onUpdate: (cardId: string, content: string) => Promise<void>
  onDelete: (cardId: string) => Promise<void>
  disabled?: boolean
}

export function RetroCard({ card, columnColor, onUpdate, onDelete, disabled = false }: RetroCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(card.content)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const deleteIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Select all text for easy editing
      textareaRef.current.select()
    }
  }, [isEditing])

  // Handle click outside to save changes
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isEditing &&
        cardRef.current &&
        !cardRef.current.contains(event.target as Node) &&
        !isLoading
      ) {
        handleSave()
      }
    }

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing, isLoading, content])

  const handleCardClick = () => {
    // Only allow editing if user owns the card and it's not disabled
    if (card.isOwner && !disabled && !isEditing) {
      setIsEditing(true)
      setError(null)
    }
  }

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Card content cannot be empty')
      return
    }

    if (content.trim() === card.content) {
      // No changes made
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onUpdate(card.id, content.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update card:', error)
      setError('Failed to save changes. Please try again.')
      // Revert content on error
      setContent(card.content)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      // Ctrl/Cmd + Enter to save
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      // Escape to cancel
      e.preventDefault()
      setContent(card.content)
      setIsEditing(false)
      setError(null)
    }
  }

  const startDelete = useCallback(() => {
    if (!card.isOwner || disabled || isDeleting) return

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
        await onDelete(card.id)
        // Card will disappear when parent component updates state after successful API call
        // Reset local state in case component doesn't unmount immediately
        setIsLoading(false)
        cancelDelete()
      } catch (error) {
        console.error('Failed to delete card:', error)
        setError('Failed to delete card. Please try again.')
        setIsLoading(false)
        cancelDelete()
      }
    }, duration)
  }, [card.isOwner, card.id, disabled, isDeleting, onDelete])

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
    <div
      ref={cardRef}
      className={`
        relative group bg-white rounded-lg border-2 shadow-sm transition-all duration-200
        ${card.isOwner ? 'cursor-pointer hover:shadow-md' : ''}
        ${isEditing ? 'ring-2 ring-blue-500 shadow-md' : 'border-gray-200'}
        ${disabled ? 'opacity-50' : ''}
      `}
      style={{
        borderLeftColor: columnColor,
        borderLeftWidth: '4px',
      }}
      onClick={handleCardClick}
    >
      {/* Delete button - only visible for owned cards */}
      {card.isOwner && !disabled && (
        <div className='absolute -top-2 -right-2'>
          <Button
            variant='ghost'
            size='sm'
            onMouseDown={(e) => {
              e.stopPropagation()
              startDelete()
            }}
            onMouseUp={(e) => {
              e.stopPropagation()
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
              startDelete()
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              if (isDeleting && deleteProgress < 100) {
                cancelDelete()
              }
            }}
            disabled={isLoading}
            className={`
              relative h-6 w-6 p-0 rounded-full overflow-hidden
              ${isDeleting 
                ? 'bg-red-600' 
                : 'bg-red-500 hover:bg-red-600'
              }
              text-white
              ${isEditing || isLoading || isDeleting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              transition-opacity duration-200
            `}
            aria-label={isDeleting ? 'Hold to delete card' : 'Hold to delete card'}
            title='Hold to delete'
          >
            {/* Progress circle background */}
            {isDeleting && (
              <div className='absolute inset-0'>
                <svg className='w-full h-full -rotate-90' viewBox='0 0 24 24'>
                  <circle
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='rgba(255,255,255,0.3)'
                    strokeWidth='2'
                    fill='none'
                  />
                  <circle
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='white'
                    strokeWidth='2'
                    fill='none'
                    strokeDasharray={`${2 * Math.PI * 10}`}
                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - deleteProgress / 100)}`}
                    className='transition-all duration-75 ease-linear'
                  />
                </svg>
              </div>
            )}
            
            {/* X icon */}
            <X className={`h-3 w-3 relative z-10 ${isDeleting ? 'animate-pulse' : ''}`} />
          </Button>
          
          {/* Hold instruction tooltip */}
          {isDeleting && (
            <div className='absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap'>
              <div className='bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg'>
                Hold to delete...
              </div>
            </div>
          )}
        </div>
      )}

      <div className='p-3'>
        {isEditing ? (
          <div className='space-y-2'>
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className='min-h-[60px] resize-none border-none p-0 focus-visible:ring-0'
              placeholder='Enter your thoughts...'
              maxLength={500}
            />
            
            {error && (
              <p className='text-xs text-red-600'>{error}</p>
            )}
            
            <div className='flex justify-between items-center text-xs text-gray-500'>
              <span>{content.length}/500</span>
              <div className='flex gap-2'>
                <span>Ctrl+Enter to save</span>
                <span>•</span>
                <span>Esc to cancel</span>
              </div>
            </div>
          </div>
        ) : (
          <div className='space-y-2'>
            <p className='text-sm text-gray-900 whitespace-pre-wrap break-words'>
              {card.content}
            </p>
            
            <div className='flex justify-between items-center text-xs text-gray-500'>
              <span>
                {card.isOwner ? 'You' : (card.authorName || 'Anonymous')}
              </span>
              <span>
                {new Date(card.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            {card.isOwner && !disabled && (
              <p className='text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity'>
                Click to edit
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}