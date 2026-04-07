import { useState } from 'react'
import { ChevronDown, User, Edit2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useGuestUser } from '@/contexts/GuestUserContext'
import { useModal } from '@/contexts/ModalContext'

export function Header() {
  const { guestUser } = useGuestUser()
  const { openEditModal } = useModal()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Don't render header if user doesn't exist yet (during onboarding)
  if (!guestUser.guestId || !guestUser.displayName) {
    return null
  }

  return (
    <header className='border-b bg-white shadow-sm'>
      <div className='flex justify-between items-center px-6 py-3 max-w-7xl mx-auto'>
        <div className='flex items-center space-x-4'>
          <h1 className='text-xl font-semibold text-gray-900'>
            Yet Another Retro Tool
          </h1>
        </div>

        <div className='relative'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className='flex items-center space-x-2 text-gray-700 hover:text-gray-900'
          >
            <div className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center'>
                <User className='w-4 h-4 text-primary' />
              </div>
              <span className='font-medium'>{guestUser.displayName}</span>
              <ChevronDown className='w-4 h-4' />
            </div>
          </Button>

          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className='fixed inset-0 z-10'
                onClick={() => setIsMenuOpen(false)}
              />
              
              {/* Dropdown Menu */}
              <div className='absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20'>
                <div className='py-1'>
                  <div className='px-4 py-2 text-sm text-gray-500 border-b'>
                    Signed in as
                  </div>
                  <div className='px-4 py-2 text-sm font-medium text-gray-900'>
                    {guestUser.displayName}
                  </div>
                  <div className='border-t'>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        openEditModal()
                      }}
                      className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    >
                      <Edit2 className='w-4 h-4 mr-3' />
                      Change Name
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}