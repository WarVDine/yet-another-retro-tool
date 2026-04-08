// Shared API types used by both frontend and backend

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface ApiError {
  success: false
  error: string
  message: string
  statusCode?: number
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Room creation types
export interface CreateRoomRequest {
  name: string
  description?: string
  template: 'classic' | 'startStopContinue' | 'madSadGlad' | 'fourLs'
  guestId: string // Required guest ID - name comes from guest user
}

export interface RoomResponse {
  id: string
  name: string
  description?: string | undefined
  facilitatorCode: string
  participantCode: string
  currentPhase: 'setup' | 'writing' | 'grouping' | 'voting' | 'discussing'
  maxVotesPerUser: number
  columns: ColumnResponse[]
  createdAt: string
}

export interface ColumnResponse {
  id: string
  title: string
  description?: string | undefined
  color: string
  sortOrder: number
}

// Room joining types
export interface JoinRoomRequest {
  code: string
  guestId: string // Required guest ID - name comes from guest user
}

export interface JoinRoomResponse {
  roomId: string
  role: 'facilitator' | 'participant'
  participantId: string
}

// Guest user management types
export interface CreateGuestUserRequest {
  displayName: string
}

export interface GuestUserResponse {
  userId: string
  guestId: string
  displayName: string
  createdAt: string
}

export interface UpdateGuestUserRequest {
  displayName: string
}

// Extended room response with participants and cards
export interface DetailedRoomResponse {
  id: string
  name: string
  description?: string | undefined
  facilitatorCode: string  // Only shown to facilitators
  participantCode: string  // Only shown to facilitators
  currentPhase: 'setup' | 'writing' | 'grouping' | 'voting' | 'discussing'
  maxVotesPerUser: number
  isActive: boolean
  columns: DetailedColumnResponse[]
  participants: ParticipantResponse[]
  createdAt: string
}

export interface DetailedColumnResponse {
  id: string
  title: string
  description?: string | undefined
  color: string
  sortOrder: number
  cards: CardDetailResponse[]
  cardGroups: CardGroupResponse[]
}

export interface CardResponse {
  id: string
  content: string
  isAnonymous: boolean
  authorName?: string | undefined  // Only if not anonymous
  sortOrder: number
  createdAt: string
}

// Card CRUD types
export interface CreateCardRequest {
  columnId: string
  content: string
  guestId: string
}

export interface UpdateCardRequest {
  content: string
  guestId: string
}

export interface MoveCardRequest {
  targetColumnId: string
  targetPosition?: number // Optional sort order
  guestId: string
}

export interface UpdateCardPositionRequest {
  sortOrder: number
  guestId: string
}

export interface CardDetailResponse extends CardResponse {
  columnId: string
  authorId: string
  updatedAt: string
  isOwner?: boolean // Frontend-only flag for ownership indication
  voteCount?: number // Only shown in discussion phase
  userVotes?: number // Number of votes current user has on this card
}

export interface ParticipantResponse {
  id: string
  displayName: string
  role: 'facilitator' | 'participant'
  joinedAt: string
  votesUsed?: number
  votesRemaining?: number
}

export interface UpdateRoomPhaseRequest {
  phase: 'setup' | 'writing' | 'grouping' | 'voting' | 'discussing'
  guestId: string
}

// Card group types
export interface CreateCardGroupRequest {
  columnId: string
  title: string
  cardIds: string[] // Initial cards to add to the group
  guestId: string
}

export interface UpdateCardGroupRequest {
  title?: string
  guestId: string
}

export interface AddCardsToGroupRequest {
  cardIds: string[]
  guestId: string
}

export interface RemoveCardsFromGroupRequest {
  cardIds: string[]
  guestId: string
}

export interface CardGroupResponse {
  id: string
  columnId: string
  title: string | null
  description: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  cards: CardDetailResponse[]
  voteCount?: number // Only shown in discussion phase
  userVotes?: number // Number of votes current user has on this group
}

// Vote management types
/**
 * Request to cast a vote on a card or group
 * Exactly one of cardId or groupId must be provided
 */
export interface VoteRequest {
  /** ID of card to vote on (exclusive with groupId) */
  cardId?: string
  /** ID of group to vote on (exclusive with cardId) */
  groupId?: string
  /** Guest ID of the voting user */
  guestId: string
}

/**
 * Request to remove a vote from a card or group
 * Exactly one of cardId or groupId must be provided
 */
export interface UnvoteRequest {
  /** ID of card to remove vote from (exclusive with groupId) */
  cardId?: string
  /** ID of group to remove vote from (exclusive with cardId) */
  groupId?: string
  /** Guest ID of the voting user */
  guestId: string
}

/**
 * Response when a vote is successfully cast
 */
export interface VoteResponse {
  id: string
  userId: string
  cardId?: string
  groupId?: string
  createdAt: string
}

/**
 * Summary of a user's voting activity in a room
 */
export interface UserVotesSummary {
  userId: string
  votesUsed: number
  maxVotes: number
  votesRemaining: number
  votes: VoteResponse[]
}
