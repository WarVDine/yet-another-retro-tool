import React, { createContext, useContext, useEffect, useState } from 'react'

import { useGuestUser } from '@/contexts/GuestUserContext'

interface ModalContextType {
  isOpen: boolean
  mode: 'create' | 'edit'
  openCreateModal: () => void
  openEditModal: () => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function useModal() {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

interface ModalProviderProps {
  children: React.ReactNode
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const { guestUser } = useGuestUser()

  // Auto-open create modal when user needs onboarding
  useEffect(() => {
    if (!guestUser.isLoading && !guestUser.guestId && !isOpen) {
      openCreateModal()
    }
  }, [guestUser.isLoading, guestUser.guestId, isOpen])

  // Auto-close modal when guest user is created (for create mode)
  useEffect(() => {
    if (mode === 'create' && guestUser.guestId && isOpen) {
      closeModal()
    }
  }, [mode, guestUser.guestId, isOpen])

  const openCreateModal = () => {
    setMode('create')
    setIsOpen(true)
  }

  const openEditModal = () => {
    setMode('edit')
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  const contextValue: ModalContextType = {
    isOpen,
    mode,
    openCreateModal,
    openEditModal,
    closeModal,
  }

  return <ModalContext.Provider value={contextValue}>{children}</ModalContext.Provider>
}