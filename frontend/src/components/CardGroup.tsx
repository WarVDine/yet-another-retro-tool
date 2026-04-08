import { useState, useRef } from 'react'
import { Edit2, Trash2 } from 'lucide-react'

import { CardGroupResponse } from '@yet-another-retro-tool/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RetroCard } from '@/components/RetroCard'
import { DraggableCard } from '@/components/DraggableCard'

interface CardGroupProps {
  group: CardGroupResponse
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

  return (
    <div
      className="bg-white rounded-lg border-2 shadow-sm p-4 space-y-3"
      style={{
        borderLeftColor: columnColor,
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid',
      }}
    >
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
              onUpdate={onUpdateCard}
              onDelete={onDeleteCard}
              onEditStart={onCardEditStart}
              onEditEnd={onCardEditEnd}
              disabled={!isGroupingPhase} // Cards are disabled outside grouping phase
              showBlur={currentPhase === 'setup' || currentPhase === 'writing'}
            />
          </DraggableCard>
        ))}
      </div>

      {/* Group Info */}
      <div className="text-xs text-gray-500 border-t pt-2">
        {group.cards.length} card{group.cards.length !== 1 ? 's' : ''} in this group
      </div>
    </div>
  )
}