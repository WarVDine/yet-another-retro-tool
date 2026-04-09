import {
  ApiResponse,
  ApiError,
  CreateRoomRequest,
  RoomResponse,
  DetailedRoomResponse,
  UpdateRoomPhaseRequest,
  ValidateRoomCodeResponse,
  GuestUserResponse,
  CreateCardRequest,
  UpdateCardRequest,
  MoveCardRequest,
  UpdateCardPositionRequest,
  CardDetailResponse,
  CreateCardGroupRequest,
  UpdateCardGroupRequest,
  AddCardsToGroupRequest,
  RemoveCardsFromGroupRequest,
  CardGroupResponse,
  VoteRequest,
  UnvoteRequest,
  VoteResponse,
  FacilitatedRetrosResponse,
} from '@yet-another-retro-tool/shared'
import { getStoredGuestId } from './guestUser'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    // Get guest ID from localStorage for Authorization header
    const guestId = getStoredGuestId()
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(guestId && { 'Authorization': `Guest ${guestId}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData: ApiError = await response.json()
        const error = new Error(errorData.message || 'API request failed')
        // Attach the HTTP status code to the error for better error handling
        ;(error as any).status = response.status
        throw error
      }

      const responseData: ApiResponse<T> = await response.json()
      if (!responseData.success) {
        throw new Error(responseData.message || 'API request failed')
      }
      // For void responses (like DELETE), data will be undefined, which is correct for Promise<void>
      return responseData.data as T
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, { 
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// Guest user API methods
export const guestUserApi = {
  createGuestUser: async (displayName: string): Promise<GuestUserResponse> => {
    return apiClient.post<GuestUserResponse>('/users/guest', { displayName })
  },

  getGuestUser: async (guestId: string): Promise<GuestUserResponse> => {
    return apiClient.get<GuestUserResponse>(`/users/guest/${guestId}`)
  },

  updateGuestUser: async (guestId: string, displayName: string): Promise<GuestUserResponse> => {
    return apiClient.put<GuestUserResponse>(`/users/guest/${guestId}`, { displayName })
  },

  getFacilitatedRetros: async (guestId: string, limit?: number): Promise<FacilitatedRetrosResponse> => {
    const params = limit ? `?limit=${limit}` : ''
    return apiClient.get<FacilitatedRetrosResponse>(`/users/guest/${guestId}/facilitated-retros${params}`)
  },
}

// Room API methods
export const roomApi = {
  createRoom: async (roomData: CreateRoomRequest): Promise<RoomResponse> => {
    return apiClient.post<RoomResponse>('/rooms', roomData)
  },

  validateRoomCode: async (code: string): Promise<ValidateRoomCodeResponse> => {
    return apiClient.get<ValidateRoomCodeResponse>(`/rooms/validate/${code}`)
  },

  getRoomById: async (roomId: string): Promise<DetailedRoomResponse> => {
    return apiClient.get<DetailedRoomResponse>(`/rooms/${roomId}`)
  },

  getRoomByCode: async (code: string): Promise<DetailedRoomResponse> => {
    return apiClient.get<DetailedRoomResponse>(`/rooms/by-code/${code}`)
  },

  updateRoomPhase: async (roomId: string, request: UpdateRoomPhaseRequest): Promise<RoomResponse> => {
    return apiClient.patch<RoomResponse>(`/rooms/${roomId}/phase`, request)
  },

  exportRoom: async (roomId: string): Promise<{ success: boolean; filename?: string }> => {
    try {
      const guestId = getStoredGuestId()
      if (!guestId) {
        throw new Error('Guest ID not found')
      }

      const url = `${API_BASE_URL}/rooms/${roomId}/export`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Guest ${guestId}`,
        },
      })

      if (!response.ok) {
        // Try to parse error response
        try {
          const errorData: ApiError = await response.json()
          const error = new Error(errorData.message || 'Export failed')
          ;(error as any).status = response.status
          throw error
        } catch {
          // If JSON parsing fails, throw generic error
          throw new Error(`Export failed with status ${response.status}`)
        }
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/)
      const filename = filenameMatch?.[1] || 'retro-export.md'

      // Get the file content as blob
      const blob = await response.blob()

      // Create download link and trigger download
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      return { success: true, filename }
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  },
}

// Card API methods
export const cardApi = {
  createCard: async (request: CreateCardRequest): Promise<CardDetailResponse> => {
    return apiClient.post<CardDetailResponse>('/cards', request)
  },

  updateCard: async (cardId: string, request: UpdateCardRequest): Promise<CardDetailResponse> => {
    return apiClient.patch<CardDetailResponse>(`/cards/${cardId}`, request)
  },

  deleteCard: async (cardId: string): Promise<void> => {
    return apiClient.delete<void>(`/cards/${cardId}`)
  },

  moveCard: async (cardId: string, request: MoveCardRequest): Promise<CardDetailResponse> => {
    return apiClient.patch<CardDetailResponse>(`/cards/${cardId}/move`, request)
  },

  updateCardPosition: async (cardId: string, request: UpdateCardPositionRequest): Promise<CardDetailResponse> => {
    return apiClient.patch<CardDetailResponse>(`/cards/${cardId}/position`, request)
  },
}

// Card group API methods
export const cardGroupApi = {
  createCardGroup: async (request: CreateCardGroupRequest): Promise<CardGroupResponse> => {
    return apiClient.post<CardGroupResponse>('/card-groups', request)
  },

  updateCardGroup: async (groupId: string, request: UpdateCardGroupRequest): Promise<CardGroupResponse> => {
    return apiClient.patch<CardGroupResponse>(`/card-groups/${groupId}`, request)
  },

  deleteCardGroup: async (groupId: string): Promise<void> => {
    return apiClient.delete<void>(`/card-groups/${groupId}`)
  },

  addCardsToGroup: async (groupId: string, request: AddCardsToGroupRequest): Promise<CardGroupResponse> => {
    return apiClient.post<CardGroupResponse>(`/card-groups/${groupId}/cards`, request)
  },

  removeCardsFromGroup: async (groupId: string, request: RemoveCardsFromGroupRequest): Promise<CardGroupResponse | void> => {
    return apiClient.delete<CardGroupResponse | void>(`/card-groups/${groupId}/cards`, request)
  },
}

// Vote API methods
export const voteApi = {
  /**
   * Cast a vote on a card or group
   * Exactly one of cardId or groupId must be provided
   */
  vote: async (request: VoteRequest): Promise<VoteResponse> => {
    return apiClient.post<VoteResponse>('/votes', request)
  },

  /**
   * Remove a vote from a card or group
   * Exactly one of cardId or groupId must be provided
   */
  unvote: async (request: UnvoteRequest): Promise<void> => {
    return apiClient.delete<void>('/votes', request)
  },


  /**
   * Convenience method to vote on a card
   */
  voteOnCard: async (cardId: string): Promise<VoteResponse> => {
    return apiClient.post<VoteResponse>('/votes', { cardId })
  },

  /**
   * Convenience method to vote on a group
   */
  voteOnGroup: async (groupId: string): Promise<VoteResponse> => {
    return apiClient.post<VoteResponse>('/votes', { groupId })
  },

  /**
   * Convenience method to remove vote from a card
   */
  unvoteCard: async (cardId: string): Promise<void> => {
    return apiClient.delete<void>('/votes', { cardId })
  },

  /**
   * Convenience method to remove vote from a group
   */
  unvoteGroup: async (groupId: string): Promise<void> => {
    return apiClient.delete<void>('/votes', { groupId })
  },
}
