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
  cards: CardResponse[]
}

export interface CardResponse {
  id: string
  content: string
  isAnonymous: boolean
  authorName?: string | undefined  // Only if not anonymous
  sortOrder: number
  createdAt: string
}

export interface ParticipantResponse {
  id: string
  displayName: string
  role: 'facilitator' | 'participant'
  joinedAt: string
}
