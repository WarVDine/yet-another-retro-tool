import { Router } from 'express'

import { getGuestUser, createGuestUser, updateGuestUser, getFacilitatedRetros } from '@/controllers/userController'
import { requireGuestUser } from '@/middleware/auth'

const router = Router()

// Guest user routes
router.post('/guest', createGuestUser) // Create new guest user (returns guest ID) - Public endpoint
router.get('/guest/:guestId', requireGuestUser, getGuestUser) // Get guest user by ID - Requires auth
router.put('/guest/:guestId', requireGuestUser, updateGuestUser) // Update guest user display name - Requires auth
router.get('/guest/:guestId/facilitated-retros', requireGuestUser, getFacilitatedRetros) // Get user's facilitated retros - Requires auth

export { router as userRouter }