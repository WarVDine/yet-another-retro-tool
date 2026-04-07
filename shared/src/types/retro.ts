// Shared retrospective types

export type RetroSessionStatus = 'draft' | 'active' | 'completed'
export type RetroItemCategory = 'went_well' | 'improve' | 'action_items'

export interface RetroSession {
  id: string
  title: string
  description?: string
  createdAt: Date
  updatedAt: Date
  status: RetroSessionStatus
  facilitator?: string
  participants?: string[]
}

export interface RetroItem {
  id: string
  sessionId: string
  category: RetroItemCategory
  content: string
  author?: string
  votes: number
  createdAt: Date
  updatedAt?: Date
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

// DTOs (Data Transfer Objects)
export interface CreateRetroSessionDto {
  title: string
  description?: string
}

export interface UpdateRetroSessionDto {
  title?: string
  description?: string
  status?: RetroSessionStatus
}

export interface CreateRetroItemDto {
  category: RetroItemCategory
  content: string
  author?: string
}

export interface UpdateRetroItemDto {
  content?: string
  votes?: number
}

export interface VoteRetroItemDto {
  increment: boolean // true to add vote, false to remove vote
}
