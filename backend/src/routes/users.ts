import { Router } from 'express'

import { getGuestUser, createGuestUser, updateGuestUser } from '@/controllers/userController'

const router = Router()

// Guest user routes
router.post('/guest', createGuestUser) // Create new guest user (returns guest ID)
router.get('/guest/:guestId', getGuestUser) // Get guest user by ID
router.put('/guest/:guestId', updateGuestUser) // Update guest user display name

export { router as userRouter }