import React from 'react'

import { useGuestUser } from '@/contexts/GuestUserContext'
import { LoadingScreen } from '@/components/LoadingScreen'
import { RetryScreen } from '@/components/RetryScreen'
import { CreateUserScreen } from '@/components/CreateUserScreen'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { guestUser } = useGuestUser()

  // Show loading screen while initializing
  if (guestUser.isLoading) {
    return <LoadingScreen message="Setting up your session..." />
  }

  // Show error screen for server issues (has guestId but no userId)
  if (guestUser.guestId && !guestUser.userId && guestUser.error) {
    return <RetryScreen error={guestUser.error} />
  }

  // Force modal for incomplete profiles
  if (!guestUser.guestId || !guestUser.userId || !guestUser.displayName) {
    return <CreateUserScreen /> // Forces GuestUserModal to stay open
  }

  // User is ready - show app
  return <>{children}</>
}