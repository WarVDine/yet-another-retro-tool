import {
  ApiResponse,
  ApiError,
  CreateRoomRequest,
  RoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  DetailedRoomResponse,
  GuestUserResponse,
  CreateCardRequest,
  UpdateCardRequest,
  CardDetailResponse,
} from '@yet-another-retro-tool/shared'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
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
}

// Room API methods
export const roomApi = {
  createRoom: async (roomData: CreateRoomRequest): Promise<RoomResponse> => {
    return apiClient.post<RoomResponse>('/rooms', roomData)
  },

  joinRoom: async (joinData: JoinRoomRequest): Promise<JoinRoomResponse> => {
    return apiClient.post<JoinRoomResponse>('/rooms/join', joinData)
  },

  getRoomById: async (roomId: string, guestId?: string): Promise<DetailedRoomResponse> => {
    const queryParam = guestId ? `?guestId=${encodeURIComponent(guestId)}` : ''
    return apiClient.get<DetailedRoomResponse>(`/rooms/${roomId}${queryParam}`)
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

  deleteCard: async (cardId: string, guestId: string): Promise<void> => {
    return apiClient.delete<void>(`/cards/${cardId}`, { guestId })
  },
}
