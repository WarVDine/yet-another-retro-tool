// Frontend-specific types
export interface RetroSession {
  id: string
  title: string
  description?: string
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'active' | 'completed'
}

export interface RetroItem {
  id: string
  sessionId: string
  category: 'went_well' | 'improve' | 'action_items'
  content: string
  author?: string
  votes: number
  createdAt: Date
}

export interface User {
  id: string
  name: string
  email: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
  message: string
}

// Room creation types
export interface CreateRoomRequest {
  name: string
  description?: string
  template: 'classic' | 'startStopContinue' | 'madSadGlad' | 'fourLs'
  facilitatorName: string
}

export interface RoomResponse {
  id: string
  name: string
  description?: string
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
  description?: string
  color: string
  sortOrder: number
}