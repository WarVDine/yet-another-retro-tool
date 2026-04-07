import {
  ApiResponse,
  ApiError,
  CreateRoomRequest,
  RoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  DetailedRoomResponse,
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
        throw new Error(errorData.message || 'API request failed')
      }

      const data: ApiResponse<T> = await response.json()
      if (!data.data) {
        throw new Error('No data received from API')
      }
      return data.data
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

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// Room API methods
export const roomApi = {
  createRoom: async (roomData: CreateRoomRequest): Promise<RoomResponse> => {
    return apiClient.post<RoomResponse>('/rooms', roomData)
  },

  joinRoom: async (joinData: JoinRoomRequest): Promise<JoinRoomResponse> => {
    return apiClient.post<JoinRoomResponse>('/rooms/join', joinData)
  },

  getRoomById: async (roomId: string): Promise<DetailedRoomResponse> => {
    return apiClient.get<DetailedRoomResponse>(`/rooms/${roomId}`)
  },
}
