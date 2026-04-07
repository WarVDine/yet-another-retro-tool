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

// Re-export shared types
export type {
  ApiResponse,
  ApiError,
  CreateRoomRequest,
  RoomResponse,
  ColumnResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  DetailedRoomResponse,
  DetailedColumnResponse,
  CardResponse,
  ParticipantResponse
} from '@yet-another-retro-tool/shared'