import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CardResponse } from '@yet-another-retro-tool/shared'

interface AddCardButtonProps {
  columnId: string
  columnColor: string
  onCardCreated: (card: CardResponse) => void
  onCreateCard: (columnId: string, content: string) => Promise<CardResponse>
  disabled?: boolean
}

export function AddCardButton({ 
  columnId, 
  columnColor, 
  onCardCreated, 
  onCreateCard, 
  disabled = false 
}: AddCardButtonProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Focus textarea when entering create mode
  useEffect(() => {
    if (isCreating && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isCreating])

  // Handle click outside to save or cancel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isCreating &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !isLoading
      ) {
        if (content.trim()) {
          handleSave()
        } else {
          handleCancel()
        }
      }
    }

    if (isCreating) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCreating, isLoading, content])

  const handleStartCreating = () => {
    if (disabled) return
    setIsCreating(true)
    setContent('')
    setError(null)
  }

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Card content cannot be empty')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const newCard = await onCreateCard(columnId, content.trim())
      onCardCreated(newCard)
      setIsCreating(false)
      setContent('')
    } catch (error) {
      console.error('Failed to create card:', error)
      setError('Failed to create card. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setContent('')
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      // Ctrl/Cmd + Enter to save
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      // Escape to cancel
      e.preventDefault()
      handleCancel()
    }
  }

  if (isCreating) {
    return (
      <div
        ref={containerRef}
        className='bg-white rounded-lg border-2 border-dashed shadow-sm transition-all duration-200 ring-2 ring-blue-500'
        style={{
          borderLeftColor: columnColor,
          borderLeftWidth: '4px',
          borderLeftStyle: 'solid',
        }}
      >
        <div className='p-3 space-y-2'>
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
      </div>
    )
  }

  return (
    <Button
      variant='ghost'
      onClick={handleStartCreating}
      disabled={disabled}
      className={`
        w-full h-20 border-2 border-dashed border-gray-300 rounded-lg
        hover:border-gray-400 hover:bg-gray-50
        transition-all duration-200 group
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{
        borderLeftColor: columnColor,
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid',
      }}
    >
      <div className='flex flex-col items-center gap-2 text-gray-500 group-hover:text-gray-700'>
        <Plus className='h-5 w-5' />
        <span className='text-sm font-medium'>Add a card</span>
      </div>
    </Button>
  )
}