import { useEffect, useRef, useCallback, useState } from 'react'

import { roomApi } from '@/utils/api'
import { DetailedRoomResponse } from '@yet-another-retro-tool/shared'

interface UseRoomPollingOptions {
  roomId: string | null
  guestId: string | null
  enabled: boolean
  interval?: number // milliseconds, default 5000
  onUpdate?: (room: DetailedRoomResponse) => void
  onError?: (error: Error) => void
}

interface UseRoomPollingReturn {
  isPolling: boolean
  lastSyncTime: Date | null
  error: string | null
  manualRefresh: () => Promise<void>
}

export function useRoomPolling({
  roomId,
  guestId,
  enabled,
  interval = 5000,
  onUpdate,
  onError,
}: UseRoomPollingOptions): UseRoomPollingReturn {
  const [isPolling, setIsPolling] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(true)

  // Track tab visibility to pause polling when tab is inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const fetchRoomData = useCallback(async (): Promise<DetailedRoomResponse | null> => {
    if (!roomId) return null

    try {
      console.log('fetchRoomData', roomId, guestId)
      setError(null)
      const roomData = await roomApi.getRoomById(roomId, guestId || undefined)
      console.log('roomData', roomData)
      setLastSyncTime(new Date())
      return roomData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync room data'

      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return null
    }
  }, [roomId, guestId, onError])

  const manualRefresh = useCallback(async () => {
    if (!enabled || !roomId) return

    setIsPolling(true)
    try {
      const roomData = await fetchRoomData()
      if (roomData) {
        onUpdate?.(roomData)
      }
    } finally {
      setIsPolling(false)
    }
  }, [enabled, roomId, fetchRoomData, onUpdate])

  const pollRoom = useCallback(async () => {
    console.log('pollRoom', { isVisible: isVisibleRef.current, enabled, roomId })
    // Don't poll if tab is not visible, not enabled, or no room ID
    if (!isVisibleRef.current || !enabled || !roomId) {
      return
    }

    setIsPolling(true)
    try {
      const roomData = await fetchRoomData()
      if (roomData) {
        onUpdate?.(roomData)
      }
    } finally {
      setIsPolling(false)
    }
  }, [enabled, roomId, fetchRoomData, onUpdate])

  // Set up polling interval
  useEffect(() => {
    if (!enabled || !roomId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Start polling
    intervalRef.current = setInterval(pollRoom, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, roomId, interval, pollRoom])

  return {
    isPolling,
    lastSyncTime,
    error,
    manualRefresh,
  }
}
