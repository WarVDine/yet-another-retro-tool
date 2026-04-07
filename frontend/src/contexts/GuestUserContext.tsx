import React, { createContext, useContext, useEffect, useState } from 'react'

import { guestUserApi } from '@/utils/api'
import { getStoredGuestId, storeGuestId } from '@/utils/guestUser'

interface GuestUser {
  guestId: string | null
  displayName: string | null
  userId: string | null
  isLoading: boolean
  error: string | null
}

interface GuestUserContextType {
  guestUser: GuestUser
  createGuestUser: (displayName: string) => Promise<void>
  updateDisplayName: (newDisplayName: string) => Promise<void>
  refreshGuestUser: () => Promise<void>
}

const GuestUserContext = createContext<GuestUserContextType | undefined>(undefined)

export function useGuestUser() {
  const context = useContext(GuestUserContext)
  if (context === undefined) {
    throw new Error('useGuestUser must be used within a GuestUserProvider')
  }
  return context
}

interface GuestUserProviderProps {
  children: React.ReactNode
}

export function GuestUserProvider({ children }: GuestUserProviderProps) {
  const [guestUser, setGuestUser] = useState<GuestUser>({
    guestId: null,
    displayName: null,
    userId: null,
    isLoading: true,
    error: null,
  })

  const initializeGuestUser = async () => {
    try {
      setGuestUser((prev) => ({ ...prev, isLoading: true, error: null }))

      // Check if we have a stored guest ID
      const storedGuestId = getStoredGuestId()

      if (storedGuestId) {
        // Try to fetch existing user info from backend
        try {
          const guestUserData = await guestUserApi.getGuestUser(storedGuestId)
          setGuestUser({
            guestId: storedGuestId,
            displayName: guestUserData.displayName,
            userId: guestUserData.userId,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          // Guest ID exists in localStorage but not in backend - clear it
          console.log('Stored guest ID not found in backend, clearing localStorage')
          localStorage.removeItem('retro-guest-id')
          setGuestUser({
            guestId: null,
            displayName: null,
            userId: null,
            isLoading: false,
            error: null,
          })
        }
      } else {
        // No stored guest ID - user needs to create one
        setGuestUser({
          guestId: null,
          displayName: null,
          userId: null,
          isLoading: false,
          error: null,
        })
      }
    } catch (error) {
      console.error('Error initializing guest user:', error)
      setGuestUser((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize guest user',
      }))
    }
  }

  const createGuestUser = async (displayName: string) => {
    try {
      const guestUserData = await guestUserApi.createGuestUser(displayName)

      // Store the guest ID in localStorage
      storeGuestId(guestUserData.guestId)

      setGuestUser({
        guestId: guestUserData.guestId,
        displayName: guestUserData.displayName,
        userId: guestUserData.userId,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('Error creating guest user:', error)
      throw error
    }
  }

  const updateDisplayName = async (newDisplayName: string) => {
    if (!guestUser.guestId) {
      throw new Error('No guest ID available')
    }

    try {
      const updatedUser = await guestUserApi.updateGuestUser(guestUser.guestId, newDisplayName)
      setGuestUser((prev) => ({
        ...prev,
        displayName: updatedUser.displayName,
        userId: updatedUser.userId,
      }))
    } catch (error) {
      console.error('Error updating display name:', error)
      throw error
    }
  }

  const refreshGuestUser = async () => {
    await initializeGuestUser()
  }

  useEffect(() => {
    initializeGuestUser()
  }, [])

  const contextValue: GuestUserContextType = {
    guestUser,
    createGuestUser,
    updateDisplayName,
    refreshGuestUser,
  }

  return <GuestUserContext.Provider value={contextValue}>{children}</GuestUserContext.Provider>
}
