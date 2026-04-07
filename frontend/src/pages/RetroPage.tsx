import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, Clock, Settings } from 'lucide-react'

import { DetailedRoomResponse, CardResponse } from '@yet-another-retro-tool/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RetroCard } from '@/components/RetroCard'
import { AddCardButton } from '@/components/AddCardButton'
import { useGuestUser } from '@/contexts/GuestUserContext'
import { roomApi, cardApi } from '@/utils/api'

export function RetroPage() {
  const { id } = useParams<{ id: string }>()
  const { guestUser } = useGuestUser()
  const [room, setRoom] = useState<DetailedRoomResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRoom = useCallback(async () => {
    if (!id) return

    try {
      setIsLoading(true)
      // Pass guestId to get ownership flags for cards
      const roomData = await roomApi.getRoomById(id, guestUser.guestId || undefined)
      setRoom(roomData)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load room')
    } finally {
      setIsLoading(false)
    }
  }, [id, guestUser.guestId])

  useEffect(() => {
    loadRoom()
  }, [loadRoom])

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

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Room Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error || 'The requested retrospective could not be found.'}</p>
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
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

            {/* Participants */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Participants:</h3>
              <div className="flex flex-wrap gap-2">
                {room.participants.map((participant) => {
                  const isCurrentUser = guestUser.userId === participant.id
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
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

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
              <CardHeader style={{ backgroundColor: `${column.color}15` }}>
                <CardTitle className="flex items-center gap-2" style={{ color: column.color }}>
                  {column.title}
                </CardTitle>
                {column.description && <CardDescription>{column.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Interactive Cards */}
                <div className="space-y-3">
                  {column.cards.map((card) => (
                    <RetroCard
                      key={card.id}
                      card={card}
                      columnColor={column.color}
                      onUpdate={handleUpdateCard}
                      onDelete={handleDeleteCard}
                      disabled={!guestUser.guestId}
                    />
                  ))}
                </div>

                {/* Add Card Button */}
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
