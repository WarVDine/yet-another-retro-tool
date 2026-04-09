import { Router } from 'express'

import { createCard, updateCard, deleteCard, moveCard, updateCardPosition } from '@/controllers/cardController'
import { requireFacilitator, requireGuestUser } from '@/middleware/auth'

const router = Router()

// Card CRUD routes
router.post('/', requireGuestUser, createCard) // POST /api/cards
router.patch('/:id', requireGuestUser, updateCard) // PATCH /api/cards/:id
router.delete('/:id', requireGuestUser, deleteCard) // DELETE /api/cards/:id

// Card position routes
router.patch('/:id/move', requireGuestUser, requireFacilitator, moveCard) // PATCH /api/cards/:id/move
router.patch('/:id/position', requireGuestUser, requireFacilitator, updateCardPosition) // PATCH /api/cards/:id/position

export { router as cardRouter }
