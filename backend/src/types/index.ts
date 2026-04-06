import { Request, Response } from 'express'

// Base types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Express types with custom properties
export interface CustomRequest extends Request {
  user?: User // For when authentication is added
}

export interface CustomResponse<T = any> extends Response {
  json(body: ApiResponse<T>): this
}

// Domain types
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

// Request/Response DTOs
export interface CreateRetroSessionDto {
  title: string
  description?: string
}

export interface UpdateRetroSessionDto {
  title?: string
  description?: string
  status?: 'draft' | 'active' | 'completed'
}

export interface CreateRetroItemDto {
  category: 'went_well' | 'improve' | 'action_items'
  content: string
  author?: string
}

export interface UpdateRetroItemDto {
  content?: string
  votes?: number
}

// Error types
export interface ApiError extends Error {
  statusCode?: number
  code?: string
}

// Room creation types (from shared package)
export interface CreateRoomRequest {
  name: string
  description?: string
  template: 'classic' | 'startStopContinue' | 'madSadGlad' | 'fourLs'
  facilitatorName: string
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