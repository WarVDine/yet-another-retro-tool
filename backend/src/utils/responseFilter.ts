import {
  DetailedRoomResponse,
  RoomResponse,
  CardDetailResponse,
  ParticipantResponse,
  VoteResponse,
} from '@yet-another-retro-tool/shared'

/**
 * Filter room response based on user role
 * Removes sensitive data that should not be exposed to non-facilitators
 */
export const filterRoomResponseByRole = (
  room: DetailedRoomResponse,
  userRole: 'facilitator' | 'participant' | null
): DetailedRoomResponse => {
  const filteredRoom = { ...room }

  // Remove facilitator code for non-facilitators
  if (userRole !== 'facilitator') {
    delete (filteredRoom as any).facilitatorCode
  }

  // Filter cards to remove author IDs while preserving ownership flags
  filteredRoom.columns = room.columns.map((column) => ({
    ...column,
    cards: column.cards.map((card) => filterCardResponse(card)),
    cardGroups: column.cardGroups.map((group) => ({
      ...group,
      cards: group.cards.map((card) => filterCardResponse(card)),
    })),
  }))

  return filteredRoom
}

/**
 * Filter card response to remove sensitive author information
 * Preserves ownership flag while removing author ID
 */
export const filterCardResponse = (card: any): CardDetailResponse => {
  const filteredCard = { ...card }

  // Remove author ID for anonymity
  delete (filteredCard as any).authorId

  // Keep isOwner flag as it's needed for frontend functionality
  // but don't expose the actual author ID

  return filteredCard
}

/**
 * Filter vote response to remove user ID exposure
 * Returns minimal vote information without user identification
 */
export const filterVoteResponse = (vote: any): VoteResponse => {
  const { userId, ...filteredVote } = vote
  return filteredVote
}

/**
 * Create minimal room response for operations that don't need full data
 * Used for create/update operations where client only needs basic info
 */
export const createMinimalRoomResponse = (room: any, userRole: 'facilitator' | 'participant' | null): any => {
  const minimalResponse: any = {
    id: room.id,
    name: room.name,
    description: room.description,
    currentPhase: room.currentPhase,
    createdAt: room.createdAt,
    maxVotesPerUser: room.maxVotesPerUser,
    columns: room.columns || [],
  }

  // Only include codes for facilitators
  if (userRole === 'facilitator') {
    minimalResponse.facilitatorCode = room.facilitatorCode
    minimalResponse.participantCode = room.participantCode
  } else if (userRole === 'participant') {
    minimalResponse.participantCode = room.participantCode
  }

  return minimalResponse
}

/**
 * Determine user role in a room
 * Helper function to get user role for filtering decisions
 */
export const getUserRoleInRoom = (
  userId: string,
  participants: ParticipantResponse[]
): 'facilitator' | 'participant' | null => {
  const participant = participants.find((p) => p.id === userId)
  return participant?.role || null
}
