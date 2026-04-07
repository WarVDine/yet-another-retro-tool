import { useState, useEffect } from 'react'
import { Loader2, Users, Edit2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useGuestUser } from '@/contexts/GuestUserContext'
import { useModal } from '@/contexts/ModalContext'

export function GuestUserModal() {
  const { guestUser, createGuestUser, updateDisplayName } = useGuestUser()
  const { isOpen, mode, closeModal } = useModal()
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill name in edit mode
  useEffect(() => {
    if (mode === 'edit' && guestUser.displayName) {
      setDisplayName(guestUser.displayName)
    }
  }, [mode, guestUser.displayName])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setIsLoading(false)
      if (mode === 'create') {
        setDisplayName('')
      } else if (mode === 'edit' && guestUser.displayName) {
        setDisplayName(guestUser.displayName)
      }
    }
  }, [isOpen, mode, guestUser.displayName])

  if (!isOpen) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!displayName.trim()) {
      setError('Please enter your name')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (mode === 'create') {
        await createGuestUser(displayName.trim())
        // Modal will automatically close via ModalContext effect
      } else {
        await updateDisplayName(displayName.trim())
        closeModal()
      }
    } catch (error) {
      console.error(`Failed to ${mode} guest user:`, error)
      setError(`Failed to ${mode === 'create' ? 'create user' : 'update name'}. Please try again.`)
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (mode === 'edit') {
      setError(null)
      setDisplayName(guestUser.displayName || '')
      closeModal()
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <Card className='w-full max-w-md mx-4'>
        <CardHeader className='text-center relative'>
          {mode === 'edit' && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClose}
              className='absolute right-2 top-2 h-8 w-8 p-0'
            >
              <X className='h-4 w-4' />
            </Button>
          )}
          
          <div className='flex justify-center mb-4'>
            <div className='p-3 bg-primary/10 rounded-full'>
              {mode === 'create' ? (
                <Users className='h-8 w-8 text-primary' />
              ) : (
                <Edit2 className='h-8 w-8 text-primary' />
              )}
            </div>
          </div>
          
          <CardTitle className='text-2xl'>
            {mode === 'create' ? 'Welcome to Retro Tool' : 'Update Your Name'}
          </CardTitle>
          
          <p className='text-sm text-muted-foreground mt-2'>
            {mode === 'create' 
              ? "Let's get started by setting up your profile. What should we call you?"
              : 'Change how you appear to other participants in retrospectives.'
            }
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <Input
                type='text'
                placeholder='Enter your name'
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
                className='text-center'
                autoFocus
                maxLength={50}
              />
              {error && (
                <p className='text-sm text-destructive mt-2 text-center'>{error}</p>
              )}
            </div>
            
            <div className='flex gap-3'>
              {mode === 'edit' && (
                <Button 
                  type='button'
                  variant='outline'
                  className='flex-1'
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              
              <Button 
                type='submit' 
                className={mode === 'edit' ? 'flex-1' : 'w-full'}
                disabled={isLoading || !displayName.trim()}
              >
                {isLoading && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
                {isLoading 
                  ? (mode === 'create' ? 'Creating Profile...' : 'Updating Name...')
                  : (mode === 'create' ? 'Get Started' : 'Update Name')
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
