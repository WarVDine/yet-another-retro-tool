import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Users, Clock, Settings } from 'lucide-react'
import { roomApi } from '@/utils/api'
import { DetailedRoomResponse } from '@yet-another-retro-tool/shared'

export function RetroPage() {
  const { id } = useParams<{ id: string }>()
  const [room, setRoom] = useState<DetailedRoomResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    
    const loadRoom = async () => {
      try {
        setIsLoading(true)
        const roomData = await roomApi.getRoomById(id)
        setRoom(roomData)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load room')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadRoom()
  }, [id])

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
            <p className="text-gray-600 mb-4">
              {error || 'The requested retrospective could not be found.'}
            </p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {room.name}
            </h1>
            {room.description && (
              <p className="text-gray-600 mb-4">{room.description}</p>
            )}
            
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
                {room.participants.map(participant => (
                  <span 
                    key={participant.id}
                    className={`px-2 py-1 rounded-full text-xs ${
                      participant.role === 'facilitator' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {participant.displayName}
                    {participant.role === 'facilitator' && ' (Facilitator)'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Retro Columns */}
        <div className={`grid gap-6 ${
          room.columns.length === 3 ? 'lg:grid-cols-3' : 
          room.columns.length === 4 ? 'lg:grid-cols-2 xl:grid-cols-4' :
          'lg:grid-cols-2'
        }`}>
          {room.columns.map((column) => (
            <Card key={column.id} className="h-fit">
              <CardHeader style={{ backgroundColor: `${column.color}15` }}>
                <CardTitle 
                  className="flex items-center gap-2"
                  style={{ color: column.color }}
                >
                  {column.title}
                </CardTitle>
                {column.description && (
                  <CardDescription>{column.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cards */}
                {column.cards.length === 0 ? (
                  <p className="text-gray-500 text-sm italic text-center py-4">
                    No cards yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {column.cards.map((card) => (
                      <div 
                        key={card.id}
                        className="p-3 rounded-lg border"
                        style={{ 
                          backgroundColor: `${column.color}08`,
                          borderColor: `${column.color}40`
                        }}
                      >
                        <p className="text-sm">{card.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {card.isAnonymous ? 'Anonymous' : card.authorName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(card.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}