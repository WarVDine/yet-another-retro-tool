import { useState, useRef, useEffect } from 'react'

import { Textarea } from '@/components/ui/textarea'
import { DeleteButton } from '@/components/DeleteButton'
import { VoteButton } from '@/components/VoteButton'
import { CardResponse } from '@yet-another-retro-tool/shared'

interface RetroCardProps {
  card: CardResponse & { isOwner?: boolean; userVotes?: number; voteCount?: number }
  columnColor: string
  currentPhase: 'setup' | 'writing' | 'grouping' | 'voting' | 'discussing'
  onUpdate: (cardId: string, content: string) => Promise<void>
  onDelete: (cardId: string) => Promise<void>
  onEditStart?: (cardId: string) => void
  onEditEnd?: () => void
  onVote?: (cardId: string, targetType: 'card' | 'group') => Promise<void>
  onUnvote?: (cardId: string, targetType: 'card' | 'group') => Promise<void>
  disabled?: boolean
  showBlur?: boolean // Whether to apply blur effect for non-owned cards
  isDraggable?: boolean // Whether this card is in a draggable context
  isInGroup?: boolean // Whether this card is part of a group (prevents voting)
  votingDisabled?: boolean // Whether voting is disabled (e.g., max votes reached)
  canAddVote?: boolean // Whether user can add more votes (not at max limit)
}

export function RetroCard({
  card,
  columnColor,
  currentPhase,
  onUpdate,
  onDelete,
  onEditStart,
  onEditEnd,
  onVote,
  onUnvote,
  disabled = false,
  showBlur = true,
  isDraggable = false,
  isInGroup = false,
  votingDisabled = false,
  canAddVote = true,
}: RetroCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(card.content)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

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
      if (isEditing && cardRef.current && !cardRef.current.contains(event.target as Node) && !isLoading) {
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
    if (card.isOwner && !isEditingDisabled && !isEditing) {
      setIsEditing(true)
      setError(null)
      onEditStart?.(card.id)
    }
  }

  const handleSave = async () => {
    if (!content.trim()) {
      // If content is empty, delete the card instead of showing an error
      try {
        setIsLoading(true)
        await handleDelete()
        // Card will be removed from UI by parent component
      } catch (error) {
        console.error('Failed to delete card:', error)
        setError('Failed to delete card. Please try again.')
        setIsLoading(false)
      }
      return
    }

    if (content.trim() === card.content) {
      // No changes made
      setIsEditing(false)
      onEditEnd?.()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onUpdate(card.id, content.trim())
      setIsEditing(false)
      onEditEnd?.()
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
    if (e.key === 'Enter') {
      // Enter to save (no newlines allowed)
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      // Escape to cancel
      e.preventDefault()
      setContent(card.content)
      setIsEditing(false)
      onEditEnd?.()
      setError(null)
    }
  }

  const handleDelete = async () => {
    await onDelete(card.id)
  }

  const handleVote = async (targetId: string, targetType: 'card' | 'group') => {
    if (onVote) {
      await onVote(targetId, targetType)
    }
  }

  const handleUnvote = async (targetId: string, targetType: 'card' | 'group') => {
    if (onUnvote) {
      await onUnvote(targetId, targetType)
    }
  }

  // Determine if voting should be shown
  const showVoting = currentPhase === 'voting' && !isInGroup && onVote && onUnvote
  const showVoteCount = currentPhase === 'discussing' && card.voteCount !== undefined
  
  // Determine if editing/deleting should be disabled
  const isEditingDisabled = disabled || currentPhase === 'voting' || currentPhase === 'discussing'

  return (
    <div
      ref={cardRef}
      className={`
        relative group bg-white rounded-lg border-2 shadow-sm transition-all duration-200
        ${isDraggable ? '' : (card.isOwner && !isEditingDisabled ? 'cursor-pointer hover:shadow-md' : 'cursor-default')}
        ${isEditing ? 'ring-2 ring-blue-500 shadow-md' : 'border-gray-200'}
      `}
      style={{
        borderLeftColor: columnColor,
        borderLeftWidth: '4px',
      }}
      onClick={card.isOwner && !isEditingDisabled ? handleCardClick : undefined}
    >
      {/* Delete button - only visible for owned cards during editing phases */}
      {card.isOwner && !isEditingDisabled && (
        <DeleteButton
          onDelete={handleDelete}
          disabled={isLoading}
          className={`${isEditing || isLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200`}
        />
      )}

      {/* Vote button - only visible during voting phase for cards not in groups */}
      {showVoting && (
        <VoteButton
          targetId={card.id}
          targetType='card'
          userVotes={card.userVotes || 0}
          disabled={votingDisabled}
          canAddVote={canAddVote}
          onVote={handleVote}
          onUnvote={handleUnvote}
          className='absolute -top-2 -right-2 z-10'
        />
      )}

      <div className="p-3">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="min-h-[60px] resize-none border-none p-0 focus-visible:ring-0"
              placeholder="Enter your thoughts..."
              maxLength={500}
            />

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{content.length}/500</span>
              <div className="flex gap-2">
                <span>Enter to save</span>
                <span>•</span>
                <span>Clear text + Enter to delete</span>
                <span>•</span>
                <span>Esc to cancel</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p
              className={`text-sm text-gray-900 whitespace-pre-wrap break-words ${showBlur && !card.isOwner ? 'blur-sm' : ''}`}
            >
              {card.content}
            </p>

            {/* Vote count display in discussion phase */}
            {showVoteCount && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  {card.voteCount === 1 ? '1 vote' : `${card.voteCount} votes`}
                </p>
                {card.userVotes && card.userVotes > 0 && (
                  <p className="text-xs text-blue-600">
                    You voted {card.userVotes} time{card.userVotes > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Message for cards in groups during voting */}
            {currentPhase === 'voting' && isInGroup && (
              <p className="text-xs text-gray-500 italic">
                Vote on the group instead
              </p>
            )}

            {/* Edit instruction for owned cards */}
            {card.isOwner && !isEditingDisabled && (
              <p className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to edit
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
