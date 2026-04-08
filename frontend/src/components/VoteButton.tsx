import { useState } from 'react'
import { ThumbsUp, Loader2, Plus, Minus } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * Reusable voting button component for cards and groups
 * Handles vote/unvote actions with visual feedback
 */
interface VoteButtonProps {
  /** Unique identifier for the vote target */
  targetId: string
  /** Type of target being voted on */
  targetType: 'card' | 'group'
  /** Number of votes current user has on this target */
  userVotes: number
  /** Whether voting is currently disabled */
  disabled: boolean
  /** Whether user can add more votes (not at max limit) */
  canAddVote: boolean
  /** Callback when user adds a vote */
  onVote: (targetId: string, targetType: 'card' | 'group') => Promise<void>
  /** Callback when user removes a vote */
  onUnvote: (targetId: string, targetType: 'card' | 'group') => Promise<void>
  /** Additional CSS classes */
  className?: string
}

export function VoteButton({
  targetId,
  targetType,
  userVotes,
  disabled,
  canAddVote,
  onVote,
  onUnvote,
  className = '',
}: VoteButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddVote = async (e: React.MouseEvent) => {
    // Prevent parent element interactions
    e.stopPropagation()
    e.preventDefault()

    if (disabled || isLoading || !canAddVote) return

    setIsLoading(true)
    setError(null)

    try {
      await onVote(targetId, targetType)
    } catch (error) {
      console.error('Add vote failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to add vote')
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveVote = async (e: React.MouseEvent) => {
    // Prevent parent element interactions
    e.stopPropagation()
    e.preventDefault()

    if (disabled || isLoading || userVotes === 0) return

    setIsLoading(true)
    setError(null)

    try {
      await onUnvote(targetId, targetType)
    } catch (error) {
      console.error('Remove vote failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to remove vote')
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }


  if (userVotes === 0) {
    // Show single "add vote" button when user has no votes
    return (
      <div className={`relative ${className}`}>
        <Button
          variant='outline'
          size='sm'
          onClick={handleAddVote}
          disabled={disabled || isLoading || !canAddVote}
          className={`
            relative h-8 min-w-[2.5rem] px-2 rounded-md transition-all duration-200
            ${canAddVote 
              ? 'bg-white hover:bg-blue-50 text-gray-700 border-gray-300 hover:border-blue-300' 
              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : canAddVote ? 'cursor-pointer' : 'cursor-not-allowed'}
            ${isLoading ? 'opacity-75' : ''}
          `}
          aria-label={canAddVote ? `Add vote to ${targetType}` : `Cannot add vote - at maximum votes`}
          title={canAddVote ? `Click to add a vote to this ${targetType}` : `You've reached your maximum votes. Remove a vote first.`}
        >
          {isLoading ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <ThumbsUp className='h-4 w-4' />
          )}
        </Button>

        {/* Error tooltip */}
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

  // Show add/remove buttons when user has votes
  return (
    <div className={`relative flex items-center gap-1 ${className}`}>
      {/* Remove vote button */}
      <Button
        variant='outline'
        size='sm'
        onClick={handleRemoveVote}
        disabled={disabled || isLoading}
        className={`
          h-6 w-6 p-0 rounded-md transition-all duration-200
          bg-white hover:bg-red-50 text-gray-700 border-gray-300 hover:border-red-300
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isLoading ? 'opacity-75' : ''}
        `}
        aria-label={`Remove one vote from ${targetType}`}
        title={`Remove one vote (currently ${userVotes})`}
      >
        {isLoading ? (
          <Loader2 className='h-3 w-3 animate-spin' />
        ) : (
          <Minus className='h-3 w-3' />
        )}
      </Button>

      {/* Vote count display */}
      <div className='flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md text-xs font-medium'>
        <ThumbsUp className='h-3 w-3 fill-current' />
        <span>{userVotes}</span>
      </div>

      {/* Add vote button */}
      <Button
        variant='outline'
        size='sm'
        onClick={handleAddVote}
        disabled={disabled || isLoading || !canAddVote}
        className={`
          h-6 w-6 p-0 rounded-md transition-all duration-200
          ${canAddVote 
            ? 'bg-white hover:bg-blue-50 text-gray-700 border-gray-300 hover:border-blue-300' 
            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : canAddVote ? 'cursor-pointer' : 'cursor-not-allowed'}
          ${isLoading ? 'opacity-75' : ''}
        `}
        aria-label={canAddVote ? `Add another vote to ${targetType}` : `Cannot add vote - at maximum votes`}
        title={canAddVote ? `Add another vote (currently ${userVotes})` : `You've reached your maximum votes. Remove a vote first.`}
      >
        {isLoading ? (
          <Loader2 className='h-3 w-3 animate-spin' />
        ) : (
          <Plus className='h-3 w-3' />
        )}
      </Button>

      {/* Error tooltip */}
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