import { useState, useRef } from 'react'
import { Edit2, Trash2 } from 'lucide-react'

import { CardGroupResponse } from '@yet-another-retro-tool/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RetroCard } from '@/components/RetroCard'
import { DraggableCard } from '@/components/DraggableCard'
import { VoteButton } from '@/components/VoteButton'

interface RankingInfo {
  id: string
  voteCount: number
  rank: number
  isHighlighted: boolean
  highlightType: 'first' | 'second' | 'third' | null
}

interface CardGroupProps {
  group: CardGroupResponse & { userVotes?: number; voteCount?: number }
  columnColor: string
  isFacilitator: boolean
  isGroupingPhase: boolean
  currentPhase: 'setup' | 'writing' | 'grouping' | 'voting' | 'discussing'
  onUpdateGroup: (groupId: string, title: string) => Promise<void>
  onDeleteGroup: (groupId: string) => Promise<void>
  onUpdateCard: (cardId: string, content: string) => Promise<void>
  onDeleteCard: (cardId: string) => Promise<void>
  onCardEditStart?: (cardId: string) => void
  onCardEditEnd?: () => void
  onDropCard?: (draggedCardId: string, targetCardId: string) => void
  onVote?: (targetId: string, targetType: 'card' | 'group') => Promise<void>
  onUnvote?: (targetId: string, targetType: 'card' | 'group') => Promise<void>
  votingDisabled?: boolean // Whether voting is disabled (e.g., max votes reached)
  canAddVote?: boolean // Whether user can add more votes (not at max limit)
  rankingInfo?: RankingInfo // Vote ranking information for discussion phase
}

export function CardGroup({
  group,
  columnColor,
  isFacilitator,
  isGroupingPhase,
  currentPhase,
  onUpdateGroup,
  onDeleteGroup,
  onUpdateCard,
  onDeleteCard,
  onCardEditStart,
  onCardEditEnd,
  onDropCard,
  onVote,
  onUnvote,
  votingDisabled = false,
  canAddVote = true,
  rankingInfo,
}: CardGroupProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(group.title || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleTitleClick = () => {
    if (isFacilitator && isGroupingPhase) {
      setIsEditingTitle(true)
      setTitle(group.title || '')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const handleTitleSave = async () => {
    if (!title.trim()) {
      setError('Group title cannot be empty')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onUpdateGroup(group.id, title.trim())
      setIsEditingTitle(false)
    } catch (error) {
      console.error('Failed to update group title:', error)
      setError('Failed to update group title')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTitleCancel = () => {
    setIsEditingTitle(false)
    setTitle(group.title || '')
    setError(null)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTitleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleTitleCancel()
    }
  }

  const handleDeleteGroup = async () => {
    if (!isFacilitator || !isGroupingPhase) return

    const confirmed = window.confirm('Are you sure you want to delete this group? All cards will be ungrouped.')
    if (!confirmed) return

    setIsLoading(true)
    try {
      await onDeleteGroup(group.id)
    } catch (error) {
      console.error('Failed to delete group:', error)
      setError('Failed to delete group')
    } finally {
      setIsLoading(false)
    }
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
  const showVoting = currentPhase === 'voting' && onVote && onUnvote
  const showVoteCount = currentPhase === 'discussing' && group.voteCount !== undefined

  // Generate highlighting classes based on ranking
  const getHighlightClasses = () => {
    if (!rankingInfo?.isHighlighted) return 'border-gray-200'
    
    switch (rankingInfo.highlightType) {
      case 'first':
        return 'ring-2 ring-yellow-400 bg-yellow-50 border-yellow-300'
      case 'second':
        return 'ring-2 ring-gray-400 bg-gray-50 border-gray-300'
      case 'third':
        return 'ring-2 ring-orange-400 bg-orange-50 border-orange-300'
      default:
        return 'border-gray-200'
    }
  }

  return (
    <div
      className={`relative bg-white rounded-lg border-2 shadow-sm p-4 space-y-3 transition-all duration-200 ${getHighlightClasses()}`}
      style={{
        borderLeftColor: columnColor,
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid',
      }}
    >
      {/* Vote button - only visible during voting phase */}
      {showVoting && (
        <VoteButton
          targetId={group.id}
          targetType='group'
          userVotes={group.userVotes || 0}
          disabled={votingDisabled}
          canAddVote={canAddVote}
          onVote={handleVote}
          onUnvote={handleUnvote}
          className='absolute -top-2 -right-2 z-10'
        />
      )}
      {/* Group Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isEditingTitle ? (
            <div className="space-y-2">
              <Input
                ref={inputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleTitleSave}
                disabled={isLoading}
                className="text-sm font-medium"
                placeholder="Enter group title..."
              />
              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}
            </div>
          ) : (
            <h3
              className={`text-sm font-medium text-gray-900 ${
                isFacilitator && isGroupingPhase ? 'cursor-pointer hover:text-gray-700' : ''
              }`}
              onClick={handleTitleClick}
            >
              {group.title || 'Untitled Group'}
              {isFacilitator && isGroupingPhase && (
                <Edit2 className="inline-block w-3 h-3 ml-1 opacity-50" />
              )}
            </h3>
          )}
        </div>

        {/* Group Actions */}
        {isFacilitator && isGroupingPhase && (
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteGroup}
              disabled={isLoading}
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Group Cards */}
      <div className="space-y-2">
        {group.cards.map((card) => (
          <DraggableCard
            key={card.id}
            id={card.id}
            type="card"
            isFacilitator={isFacilitator}
            isGroupingPhase={isGroupingPhase}
            onDropCard={onDropCard || (() => {})}
          >
            <RetroCard
              card={{
                ...card,
                // Override ownership display for non-writing phases
                isOwner: (currentPhase === 'setup' || currentPhase === 'writing') ? (card.isOwner || false) : false
              }}
              columnColor={columnColor}
              currentPhase={currentPhase}
              onUpdate={onUpdateCard}
              onDelete={onDeleteCard}
              onEditStart={onCardEditStart}
              onEditEnd={onCardEditEnd}
              onVote={handleVote}
              onUnvote={handleUnvote}
              disabled={!isGroupingPhase} // Cards are disabled outside grouping phase
              showBlur={currentPhase === 'setup' || currentPhase === 'writing'}
              isDraggable={isFacilitator && isGroupingPhase}
              isInGroup={true} // Cards in groups cannot be voted on individually
              votingDisabled={votingDisabled}
              canAddVote={canAddVote}
            />
          </DraggableCard>
        ))}
      </div>

      {/* Group Info */}
      <div className="text-xs text-gray-500 border-t pt-2 space-y-1">
        <div>
          {group.cards.length} card{group.cards.length !== 1 ? 's' : ''} in this group
        </div>
        
        {/* Vote count display in discussion phase */}
        {showVoteCount && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">
                  {group.voteCount === 1 ? '1 vote' : `${group.voteCount || 0} votes`}
                </span>
                {rankingInfo?.isHighlighted && (
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${rankingInfo.highlightType === 'first' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${rankingInfo.highlightType === 'second' ? 'bg-gray-100 text-gray-800' : ''}
                    ${rankingInfo.highlightType === 'third' ? 'bg-orange-100 text-orange-800' : ''}
                  `}>
                    {rankingInfo.highlightType === 'first' ? '🥇' : ''}
                    {rankingInfo.highlightType === 'second' ? '🥈' : ''}
                    {rankingInfo.highlightType === 'third' ? '🥉' : ''}
                    #{rankingInfo.rank}
                  </span>
                )}
              </div>
              {group.userVotes && group.userVotes > 0 && (
                <span className="text-blue-600">
                  You voted {group.userVotes} time{group.userVotes > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}