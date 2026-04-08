import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Clock, Settings, Copy, Check, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { DetailedRoomResponse, CardResponse } from '@yet-another-retro-tool/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RetroCard } from '@/components/RetroCard'
import { DraggableCard } from '@/components/DraggableCard'
import { AddCardButton } from '@/components/AddCardButton'
import { CardGroup } from '@/components/CardGroup'
import { DroppableColumn } from '@/components/DroppableColumn'
import { DroppableGroup } from '@/components/DroppableGroup'
import { useGuestUser } from '@/contexts/GuestUserContext'
import { roomApi, cardApi, cardGroupApi, voteApi } from '@/utils/api'
import { useRoomPolling } from '@/hooks/useRoomPolling'

// Types for vote ranking
interface VotableItem {
  id: string
  voteCount?: number
}

interface RankingInfo {
  id: string
  voteCount: number
  rank: number
  isHighlighted: boolean
  highlightType: 'first' | 'second' | 'third' | null
}

// Utility functions for vote ranking
const calculateVoteRankings = (items: VotableItem[]): RankingInfo[] => {
  // Sort items by vote count descending, then by id for consistent ordering
  const sortedItems = items
    .map(item => ({ ...item, voteCount: item.voteCount || 0 }))
    .sort((a, b) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount
      }
      return a.id.localeCompare(b.id) // Consistent ordering for ties
    })

  // Group by vote count to handle ties
  const voteGroups: { [voteCount: number]: VotableItem[] } = {}
  sortedItems.forEach(item => {
    const count = item.voteCount
    if (!voteGroups[count]) {
      voteGroups[count] = []
    }
    voteGroups[count].push(item)
  })

  // Assign ranks and highlighting
  const rankings: RankingInfo[] = []
  const uniqueVoteCounts = Object.keys(voteGroups)
    .map(Number)
    .sort((a, b) => b - a) // Descending order

  let currentRank = 1
  let highlightedRanks = 0

  for (const voteCount of uniqueVoteCounts) {
    const itemsWithThisCount = voteGroups[voteCount]
    let highlightType: 'first' | 'second' | 'third' | null = null
    let isHighlighted = false

    // Determine highlight type based on current rank and how many ranks we've highlighted
    if (highlightedRanks < 3 && voteCount > 0) {
      if (currentRank === 1) {
        highlightType = 'first'
        isHighlighted = true
      } else if (currentRank === 2 || (currentRank > 2 && highlightedRanks === 1)) {
        highlightType = 'second'
        isHighlighted = true
      } else if (currentRank === 3 || (currentRank > 3 && highlightedRanks === 2)) {
        highlightType = 'third'
        isHighlighted = true
      }
    }

    // Add all items with this vote count
    itemsWithThisCount.forEach(item => {
      rankings.push({
        id: item.id,
        voteCount,
        rank: currentRank,
        isHighlighted,
        highlightType
      })
    })

    // Update counters
    if (isHighlighted) {
      highlightedRanks++
    }
    currentRank += itemsWithThisCount.length
  }

  return rankings
}

export function RetroPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { guestUser } = useGuestUser()
  const [room, setRoom] = useState<DetailedRoomResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [, setError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [isUpdatingPhase, setIsUpdatingPhase] = useState(false)

  // Check if current user is a facilitator
  const isFacilitator = useMemo(() => {
    if (!room || !guestUser.userId) return false
    return room.participants.some((p) => p.id === guestUser.userId && p.role === 'facilitator')
  }, [room, guestUser.userId])

  // Calculate vote rankings for discussion phase
  const { cardRankings, groupRankings } = useMemo(() => {
    if (!room || room.currentPhase !== 'discussing') {
      return { cardRankings: new Map(), groupRankings: new Map() }
    }

    // Collect all cards (not in groups) and groups
    const allCards: VotableItem[] = []
    const allGroups: VotableItem[] = []

    room.columns.forEach(column => {
      // Add ungrouped cards
      const ungroupedCards = column.cards.filter(card => 
        !column.cardGroups.some(group => 
          group.cards.some(groupCard => groupCard.id === card.id)
        )
      )
      allCards.push(...ungroupedCards.map(card => ({ id: card.id, voteCount: card.voteCount })))

      // Add groups
      allGroups.push(...column.cardGroups.map(group => ({ id: group.id, voteCount: group.voteCount })))
    })

    const cardRankingsList = calculateVoteRankings(allCards)
    const groupRankingsList = calculateVoteRankings(allGroups)

    return {
      cardRankings: new Map(cardRankingsList.map(r => [r.id, r])),
      groupRankings: new Map(groupRankingsList.map(r => [r.id, r]))
    }
  }, [room])

  const loadRoom = useCallback(async () => {
    if (!id) return

    try {
      setIsLoading(true)
      // Pass guestId to get ownership flags for cards
      const roomData = await roomApi.getRoomById(id, guestUser.guestId || undefined)
      setRoom(roomData)
    } catch (error) {
      // Check if it's a 403 (not a participant) or 404 (room not found)
      const errorStatus = (error as any)?.status

      if (errorStatus === 403) {
        // User is not a participant - redirect to homepage with message
        navigate('/?error=not-participant', { replace: true })
        return
      } else if (errorStatus === 404) {
        // Room not found - redirect to homepage with message
        navigate('/?error=room-not-found', { replace: true })
        return
      }

      // For other errors, show error state on current page
      setError(error instanceof Error ? error.message : 'Failed to load room')
    } finally {
      setIsLoading(false)
    }
  }, [id, guestUser.guestId])

  useEffect(() => {
    loadRoom()
  }, [loadRoom])

  // Smart merging function for polling updates
  const handlePollingUpdate = useCallback(
    (polledRoom: DetailedRoomResponse) => {
      setRoom((currentRoom) => {
        if (!currentRoom) return polledRoom

        // If no card is being edited, just use the polled data
        if (!editingCardId) {
          return polledRoom
        }

        // Find the editing card in current room to preserve its content
        let editingCardContent: string | undefined
        for (const column of currentRoom.columns) {
          const editingCard = column.cards.find((card) => card.id === editingCardId)
          if (editingCard) {
            editingCardContent = editingCard.content
            break
          }
        }

        // If we couldn't find the editing card, just use polled data
        if (editingCardContent === undefined) {
          return polledRoom
        }

        // Merge polled data while preserving editing card content
        return {
          ...polledRoom,
          columns: polledRoom.columns.map((column) => ({
            ...column,
            cards: column.cards.map((card) => {
              if (card.id === editingCardId) {
                // Preserve the content being edited, but allow other metadata updates
                return {
                  ...card,
                  content: editingCardContent,
                }
              }
              return card
            }),
          })),
        }
      })
    },
    [editingCardId]
  )

  // Set up room polling for real-time updates
  const {
    isPolling,
    lastSyncTime,
    error: pollingError,
    manualRefresh,
  } = useRoomPolling({
    roomId: id || null,
    guestId: guestUser.guestId,
    enabled: !!room && !isLoading, // Only start polling after initial load
    interval: 5000, // 5 seconds
    onUpdate: handlePollingUpdate,
    onError: (error) => {
      console.error('Polling error:', error)
      // Don't set the main error state for polling errors to avoid disrupting UX
    },
  })

  // Card CRUD handlers with optimistic updates
  const handleCreateCard = useCallback(
    async (columnId: string, content: string): Promise<CardResponse> => {
      if (!guestUser.guestId) {
        throw new Error('User not authenticated')
      }

      const newCard = await cardApi.createCard({
        columnId,
        content,
        guestId: guestUser.guestId,
      })

      // Update UI after successful creation
      setRoom((prevRoom) => {
        if (!prevRoom) return prevRoom

        return {
          ...prevRoom,
          columns: prevRoom.columns.map((col) =>
            col.id === columnId
              ? {
                  ...col,
                  cards: [...col.cards, newCard].sort((a, b) => a.sortOrder - b.sortOrder),
                }
              : col
          ),
        }
      })

      return newCard
    },
    [guestUser.guestId]
  )

  const handleUpdateCard = useCallback(
    async (cardId: string, content: string) => {
      if (!guestUser.guestId) {
        throw new Error('User not authenticated')
      }

      const updatedCard = await cardApi.updateCard(cardId, {
        content,
        guestId: guestUser.guestId,
      })

      // Update UI after successful update
      setRoom((prevRoom) => {
        if (!prevRoom) return prevRoom

        return {
          ...prevRoom,
          columns: prevRoom.columns.map((col) => ({
            ...col,
            cards: col.cards.map((card) => (card.id === cardId ? { ...card, content: updatedCard.content } : card)),
          })),
        }
      })
    },
    [guestUser.guestId]
  )

  const handleDeleteCard = useCallback(
    async (cardId: string) => {
      console.log('handleDeleteCard called with cardId:', cardId)
      if (!guestUser.guestId) {
        throw new Error('User not authenticated')
      }

      // Make API call first
      await cardApi.deleteCard(cardId, guestUser.guestId)

      // Only update UI after successful deletion
      setRoom((prevRoom) => {
        if (!prevRoom) return prevRoom

        return {
          ...prevRoom,
          columns: prevRoom.columns.map((col) => ({
            ...col,
            cards: col.cards.filter((card) => card.id !== cardId),
          })),
        }
      })
    },
    [guestUser.guestId]
  )

  // Editing state handlers
  const handleCardEditStart = useCallback((cardId: string) => {
    setEditingCardId(cardId)
  }, [])

  const handleCardEditEnd = useCallback(() => {
    setEditingCardId(null)
  }, [])

  const handlePhaseTransition = useCallback(
    async (newPhase: 'setup' | 'writing' | 'grouping' | 'voting' | 'discussing') => {
      if (!id || !guestUser.guestId || !isFacilitator) return

      setIsUpdatingPhase(true)
      try {
        await roomApi.updateRoomPhase(id, {
          phase: newPhase,
          guestId: guestUser.guestId,
        })

        // Reload room data to get updated phase
        await loadRoom()
      } catch (error) {
        console.error('Failed to update room phase:', error)
        setError('Failed to update room phase. Please try again.')
      } finally {
        setIsUpdatingPhase(false)
      }
    },
    [id, guestUser.guestId, isFacilitator, loadRoom]
  )

  const handleUpdateGroup = useCallback(
    async (groupId: string, title: string) => {
      if (!guestUser.guestId) return

      try {
        await cardGroupApi.updateCardGroup(groupId, {
          title,
          guestId: guestUser.guestId,
        })

        // Reload room data to get updated groups
        await loadRoom()
      } catch (error) {
        console.error('Failed to update group:', error)
        throw error
      }
    },
    [guestUser.guestId, loadRoom]
  )

  const handleDeleteGroup = useCallback(
    async (groupId: string) => {
      if (!guestUser.guestId) return

      try {
        await cardGroupApi.deleteCardGroup(groupId, guestUser.guestId)

        // Reload room data to get updated groups
        await loadRoom()
      } catch (error) {
        console.error('Failed to delete group:', error)
        throw error
      }
    },
    [guestUser.guestId, loadRoom]
  )

  const handleDropCard = useCallback(
    async (draggedCardId: string, targetCardId: string) => {
      if (!guestUser.guestId || !isFacilitator || room?.currentPhase !== 'grouping') return

      try {
        // Find the dragged card and check if it's currently in a group
        let draggedCardCurrentGroup = null
        for (const column of room.columns) {
          for (const group of column.cardGroups) {
            if (group.cards.some((card) => card.id === draggedCardId)) {
              draggedCardCurrentGroup = group
              break
            }
          }
          if (draggedCardCurrentGroup) break
        }

        // Find the target card and its location
        let targetCard = null
        let targetColumn = null
        let targetGroup = null

        // Check if target card is in a group
        for (const column of room.columns) {
          for (const group of column.cardGroups) {
            const foundCard = group.cards.find((card) => card.id === targetCardId)
            if (foundCard) {
              targetCard = foundCard
              targetColumn = column
              targetGroup = group
              break
            }
          }
          if (targetCard) break
        }

        // If not found in groups, check individual cards
        if (!targetCard) {
          for (const column of room.columns) {
            const foundCard = column.cards.find((card) => card.id === targetCardId)
            if (foundCard) {
              targetCard = foundCard
              targetColumn = column
              break
            }
          }
        }

        if (!targetCard || !targetColumn) return

        // Step 1: Remove dragged card from its current group (if any)
        if (draggedCardCurrentGroup) {
          await cardGroupApi.removeCardsFromGroup(draggedCardCurrentGroup.id, {
            cardIds: [draggedCardId],
            guestId: guestUser.guestId,
          })
        }

        // Step 2: Add to new location
        if (targetGroup) {
          // Add dragged card to existing group
          await cardGroupApi.addCardsToGroup(targetGroup.id, {
            cardIds: [draggedCardId],
            guestId: guestUser.guestId,
          })
        } else {
          // Create new group with both cards
          await cardGroupApi.createCardGroup({
            columnId: targetColumn.id,
            title: 'New Group',
            cardIds: [targetCardId, draggedCardId],
            guestId: guestUser.guestId,
          })
        }

        // Reload room data
        await loadRoom()
      } catch (error) {
        console.error('Failed to group cards:', error)
        // Don't redirect user, just show a temporary error message
        setError('Failed to group cards. Please try again.')
        setTimeout(() => setError(null), 3000) // Clear error after 3 seconds
      }
    },
    [guestUser.guestId, isFacilitator, room, loadRoom]
  )

  // Handler for dropping a card on a column (to move it out of a group or to a different column)
  const handleDropCardOnColumn = useCallback(
    async (draggedCardId: string, targetColumnId: string) => {
      if (!guestUser.guestId || !isFacilitator || room?.currentPhase !== 'grouping') return

      try {
        // Find the dragged card and its current location
        let draggedCard = null
        let currentGroup = null
        let currentColumn = null

        // Check if card is in a group
        for (const column of room.columns) {
          for (const group of column.cardGroups) {
            const foundCard = group.cards.find((card) => card.id === draggedCardId)
            if (foundCard) {
              draggedCard = foundCard
              currentGroup = group
              currentColumn = column
              break
            }
          }
          if (draggedCard) break
        }

        // If not found in groups, check individual cards
        if (!draggedCard) {
          for (const column of room.columns) {
            const foundCard = column.cards.find((card) => card.id === draggedCardId)
            if (foundCard) {
              draggedCard = foundCard
              currentColumn = column
              break
            }
          }
        }

        if (!draggedCard || !currentColumn) {
          console.log('Card not found, ignoring drop')
          return
        }

        // If card is in a group, remove it from the group first
        if (currentGroup) {
          await cardGroupApi.removeCardsFromGroup(currentGroup.id, {
            cardIds: [draggedCardId],
            guestId: guestUser.guestId,
          })
        }

        // If moving to a different column, use the move API
        if (currentColumn.id !== targetColumnId) {
          await cardApi.moveCard(draggedCardId, {
            targetColumnId,
            guestId: guestUser.guestId,
          })
        }

        // Reload room data
        await loadRoom()
      } catch (error) {
        console.error('Failed to move card to column:', error)
        // Don't redirect user, just show a temporary error message
        setError('Failed to move card. Please try again.')
        setTimeout(() => setError(null), 3000) // Clear error after 3 seconds
      }
    },
    [guestUser.guestId, isFacilitator, room, loadRoom]
  )

  // Handler for dropping a card on a group
  const handleDropCardOnGroup = useCallback(
    async (draggedCardId: string, targetGroupId: string) => {
      if (!guestUser.guestId || !isFacilitator || room?.currentPhase !== 'grouping') return

      try {
        // Find the dragged card and check if it's currently in a group
        let draggedCardCurrentGroup = null
        for (const column of room.columns) {
          for (const group of column.cardGroups) {
            if (group.cards.some((card) => card.id === draggedCardId)) {
              draggedCardCurrentGroup = group
              break
            }
          }
          if (draggedCardCurrentGroup) break
        }

        // Step 1: Remove dragged card from its current group (if any and if different from target)
        if (draggedCardCurrentGroup && draggedCardCurrentGroup.id !== targetGroupId) {
          await cardGroupApi.removeCardsFromGroup(draggedCardCurrentGroup.id, {
            cardIds: [draggedCardId],
            guestId: guestUser.guestId,
          })
        }

        // Step 2: Add dragged card to target group (only if not already in it)
        if (!draggedCardCurrentGroup || draggedCardCurrentGroup.id !== targetGroupId) {
          await cardGroupApi.addCardsToGroup(targetGroupId, {
            cardIds: [draggedCardId],
            guestId: guestUser.guestId,
          })
        }

        // Reload room data
        await loadRoom()
      } catch (error) {
        console.error('Failed to add card to group:', error)
        // Don't redirect user, just show a temporary error message
        setError('Failed to add card to group. Please try again.')
        setTimeout(() => setError(null), 3000) // Clear error after 3 seconds
      }
    },
    [guestUser.guestId, isFacilitator, room, loadRoom]
  )

  const handleCopyJoinCode = useCallback(async () => {
    if (!room?.participantCode) return

    try {
      await navigator.clipboard.writeText(room.participantCode)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000) // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy join code:', error)
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = room.participantCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }, [room?.participantCode])

  // Voting handlers
  const handleVote = useCallback(
    async (targetId: string, targetType: 'card' | 'group') => {
      if (!guestUser.guestId || room?.currentPhase !== 'voting') return

      try {
        if (targetType === 'card') {
          await voteApi.voteOnCard(targetId, guestUser.guestId)
        } else {
          await voteApi.voteOnGroup(targetId, guestUser.guestId)
        }
        
        // Reload room data to get updated vote counts
        await loadRoom()
      } catch (error) {
        console.error('Failed to cast vote:', error)
        setError('Failed to cast vote. Please try again.')
        setTimeout(() => setError(null), 3000)
      }
    },
    [guestUser.guestId, room?.currentPhase, loadRoom]
  )

  const handleUnvote = useCallback(
    async (targetId: string, targetType: 'card' | 'group') => {
      if (!guestUser.guestId || room?.currentPhase !== 'voting') return

      try {
        if (targetType === 'card') {
          await voteApi.unvoteCard(targetId, guestUser.guestId)
        } else {
          await voteApi.unvoteGroup(targetId, guestUser.guestId)
        }
        
        // Reload room data to get updated vote counts
        await loadRoom()
      } catch (error) {
        console.error('Failed to remove vote:', error)
        setError('Failed to remove vote. Please try again.')
        setTimeout(() => setError(null), 3000)
      }
    },
    [guestUser.guestId, room?.currentPhase, loadRoom]
  )

  // Check if user has reached max votes
  const currentUserVotes = useMemo(() => {
    if (!room || !guestUser.userId || room.currentPhase !== 'voting') return { used: 0, remaining: 0 }
    
    const participant = room.participants.find(p => p.id === guestUser.userId)
    return {
      used: participant?.votesUsed || 0,
      remaining: participant?.votesRemaining || 0
    }
  }, [room, guestUser.userId])

  const votingDisabled = false // Keep voting enabled for removing votes
  const canAddVote = currentUserVotes.remaining > 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading retrospective...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Room Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{'The requested retrospective could not be found.'}</p>
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{room.name}</h1>
              {room.description && <p className="text-gray-600 mb-4">{room.description}</p>}

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{room.participants.length} participants</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Phase: {room.currentPhase}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Created {new Date(room.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Phase Transition Controls - Only for facilitators */}
              {isFacilitator && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-amber-900 mb-1">Facilitator Controls</h3>
                      <p className="text-xs text-amber-700">
                        Current phase: <strong>{room.currentPhase}</strong>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {room.currentPhase === 'setup' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePhaseTransition('writing')}
                          disabled={isUpdatingPhase}
                        >
                          Start Writing Phase
                        </Button>
                      )}
                      {room.currentPhase === 'writing' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePhaseTransition('grouping')}
                          disabled={isUpdatingPhase}
                        >
                          Start Grouping Phase
                        </Button>
                      )}
                      {room.currentPhase === 'grouping' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePhaseTransition('voting')}
                          disabled={isUpdatingPhase}
                        >
                          Start Voting Phase
                        </Button>
                      )}
                      {room.currentPhase === 'voting' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePhaseTransition('discussing')}
                          disabled={isUpdatingPhase}
                        >
                          Start Discussion Phase
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Discussion Phase Header */}
              {room.currentPhase === 'discussing' && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-green-900 mb-1">Discussion Phase</h3>
                      <p className="text-xs text-green-700">
                        Voting is complete! Review the results and discuss the top-voted items.
                      </p>
                    </div>
                    
                    {(() => {
                      // Calculate total votes across all cards and groups
                      let totalVotes = 0
                      let totalItems = 0
                      let topVoteCount = 0
                      
                      room.columns.forEach(column => {
                        // Count ungrouped cards
                        const ungroupedCards = column.cards.filter(card => 
                          !column.cardGroups.some(group => 
                            group.cards.some(groupCard => groupCard.id === card.id)
                          )
                        )
                        ungroupedCards.forEach(card => {
                          const voteCount = card.voteCount || 0
                          totalVotes += voteCount
                          totalItems++
                          topVoteCount = Math.max(topVoteCount, voteCount)
                        })
                        
                        // Count groups
                        column.cardGroups.forEach(group => {
                          const voteCount = group.voteCount || 0
                          totalVotes += voteCount
                          totalItems++
                          topVoteCount = Math.max(topVoteCount, voteCount)
                        })
                      })

                      return (
                        <div className="flex items-center justify-between text-xs text-green-700">
                          <div className="flex items-center gap-4">
                            <span>
                              <strong>{totalVotes}</strong> total votes cast
                            </span>
                            <span>
                              <strong>{totalItems}</strong> items to discuss
                            </span>
                            {topVoteCount > 0 && (
                              <span>
                                Top item: <strong>{topVoteCount}</strong> votes
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-green-600 font-medium">
                              🏆 Top items are highlighted
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Join Code Section */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">Invite Others to Join</h3>
                    <p className="text-xs text-blue-700">Share this code for others to join the retrospective</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-mono font-bold text-blue-900 tracking-wider">
                        {room.participantCode}
                      </div>
                      <div className="text-xs text-blue-600">Join Code</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyJoinCode}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                      title={isCopied ? 'Copied!' : 'Copy join code'}
                    >
                      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sync Status Section */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  {/* Sync Status Indicator */}
                  <div className="flex items-center gap-2">
                    {pollingError ? (
                      <>
                        <WifiOff className="w-4 h-4 text-red-500" />
                        <span className="text-red-600">Connection issue</span>
                      </>
                    ) : isPolling ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                        <span className="text-blue-600">Syncing...</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="w-4 h-4 text-green-500" />
                        <span className="text-green-600">Connected</span>
                      </>
                    )}
                  </div>

                  {/* Last Sync Time */}
                  {lastSyncTime && <div className="text-gray-500">Last sync: {lastSyncTime.toLocaleTimeString()}</div>}
                </div>

                {/* Manual Refresh Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={manualRefresh}
                  disabled={isPolling}
                  className="text-gray-600 hover:text-gray-800"
                  title="Refresh now"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isPolling ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Participants */}
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Participants:</h3>
                <div className="flex flex-wrap gap-2">
                  {room.participants.map((participant) => {
                    const isCurrentUser = guestUser.userId === participant.id
                    const showVoteCounts = room.currentPhase === 'voting' && 
                      participant.votesUsed !== undefined && 
                      participant.votesRemaining !== undefined
                    
                    return (
                      <span
                        key={participant.id}
                        className={`px-2 py-1 rounded-full text-xs ${
                          isCurrentUser
                            ? 'bg-green-100 text-green-800 ring-2 ring-green-300'
                            : participant.role === 'facilitator'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {participant.displayName}
                        {participant.role === 'facilitator' && ' (Facilitator)'}
                        {isCurrentUser && ' (You)'}
                        {showVoteCounts && (
                          <span className={`ml-1 font-medium ${
                            participant.votesRemaining! < 0 
                              ? 'text-red-600' 
                              : participant.votesRemaining === 0 
                                ? 'text-amber-600' 
                                : 'text-green-600'
                          }`}>
                            ({participant.votesUsed}/{participant.votesUsed! + participant.votesRemaining!} votes)
                            {participant.votesRemaining! < 0 && (
                              <span className="text-red-600 text-xs ml-1">
                                ({Math.abs(participant.votesRemaining!)} over)
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Vote limit info for current user */}
          {room.currentPhase === 'voting' && (() => {
            const currentParticipant = room.participants.find(p => p.id === guestUser.userId)
            if (!currentParticipant) return null
            
            const isAtLimit = currentParticipant.votesRemaining === 0
            const maxVotes = currentParticipant.votesUsed! + currentParticipant.votesRemaining!
            
            return isAtLimit ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                      You've reached your vote limit
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>
                        You've used all {maxVotes} of your votes. Remove a vote from another card/group to add votes elsewhere.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          })()}

          {/* Retro Columns */}
          <div
            className={`grid gap-6 ${
              room.columns.length === 3
                ? 'lg:grid-cols-3'
                : room.columns.length === 4
                  ? 'lg:grid-cols-2 xl:grid-cols-4'
                  : 'lg:grid-cols-2'
            }`}
          >
            {room.columns.map((column) => (
              <Card key={column.id} className="h-fit">
                <DroppableColumn
                  columnId={column.id}
                  isFacilitator={isFacilitator}
                  isGroupingPhase={room.currentPhase === 'grouping'}
                  onDropCard={handleDropCardOnColumn}
                >
                  <CardHeader style={{ backgroundColor: `${column.color}15` }}>
                    <CardTitle className="flex items-center gap-2" style={{ color: column.color }}>
                      {column.title}
                    </CardTitle>
                    {column.description && <CardDescription>{column.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6 pb-4">
                    {/* Interactive Cards (not in groups) */}
                    <div className="space-y-3">
                      {column.cards
                        .filter(
                          (card) =>
                            !column.cardGroups.some((group) =>
                              group.cards.some((groupCard) => groupCard.id === card.id)
                            )
                        )
                        .map((card) => (
                          <DraggableCard
                            key={card.id}
                            id={card.id}
                            type="card"
                            isFacilitator={isFacilitator}
                            isGroupingPhase={room.currentPhase === 'grouping'}
                            onDropCard={handleDropCard}
                          >
                            <RetroCard
                              card={{
                                ...card,
                                // Override ownership display for non-writing phases
                                isOwner:
                                  room.currentPhase === 'setup' || room.currentPhase === 'writing'
                                    ? card.isOwner || false
                                    : false,
                              }}
                              columnColor={column.color}
                              currentPhase={room.currentPhase}
                              onUpdate={handleUpdateCard}
                              onDelete={handleDeleteCard}
                              onEditStart={handleCardEditStart}
                              onEditEnd={handleCardEditEnd}
                              onVote={handleVote}
                              onUnvote={handleUnvote}
                              disabled={
                                !guestUser.guestId ||
                                room.currentPhase === 'grouping' ||
                                room.currentPhase === 'voting' ||
                                room.currentPhase === 'discussing'
                              }
                              showBlur={room.currentPhase === 'setup' || room.currentPhase === 'writing'}
                              isDraggable={isFacilitator && room.currentPhase === 'grouping'}
                              isInGroup={false}
                              votingDisabled={votingDisabled}
                              canAddVote={canAddVote}
                              rankingInfo={cardRankings.get(card.id)}
                            />
                          </DraggableCard>
                        ))}
                    </div>

                    {/* Card Groups */}
                    {column.cardGroups && column.cardGroups.length > 0 && (
                      <div className="space-y-3">
                        {column.cardGroups.map((group) => (
                          <DroppableGroup
                            key={group.id}
                            groupId={group.id}
                            isFacilitator={isFacilitator}
                            isGroupingPhase={room.currentPhase === 'grouping'}
                            onDropCard={handleDropCardOnGroup}
                          >
                            <CardGroup
                              group={group}
                              columnColor={column.color}
                              isFacilitator={isFacilitator}
                              isGroupingPhase={room.currentPhase === 'grouping'}
                              currentPhase={room.currentPhase}
                              onUpdateGroup={handleUpdateGroup}
                              onDeleteGroup={handleDeleteGroup}
                              onUpdateCard={handleUpdateCard}
                              onDeleteCard={handleDeleteCard}
                              onCardEditStart={handleCardEditStart}
                              onCardEditEnd={handleCardEditEnd}
                              onDropCard={handleDropCard}
                              onVote={handleVote}
                              onUnvote={handleUnvote}
                              votingDisabled={votingDisabled}
                              canAddVote={canAddVote}
                              rankingInfo={groupRankings.get(group.id)}
                            />
                          </DroppableGroup>
                        ))}
                      </div>
                    )}

                    {/* Add Card Button or Empty Drop Zone */}
                    {(room.currentPhase === 'setup' || room.currentPhase === 'writing') ? (
                      <AddCardButton
                        columnId={column.id}
                        columnColor={column.color}
                        onCardCreated={(newCard) => {
                          // This is handled by the optimistic update in handleCreateCard
                          console.log('Card created:', newCard.id)
                        }}
                        onCreateCard={handleCreateCard}
                        disabled={!guestUser.guestId}
                      />
                    ) : (
                      /* Empty droppable space for card placement */
                      <div className="h-12 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 transition-colors" />
                    )}
                  </CardContent>
                </DroppableColumn>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  )
}
