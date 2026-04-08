import { Router } from 'express'

import { createCard, updateCard, deleteCard, moveCard, updateCardPosition } from '@/controllers/cardController'

const router = Router()

// Card CRUD routes
router.post('/', createCard)           // POST /api/cards
router.patch('/:id', updateCard)       // PATCH /api/cards/:id  
router.delete('/:id', deleteCard)      // DELETE /api/cards/:id

// Card position routes
router.patch('/:id/move', moveCard)           // PATCH /api/cards/:id/move
router.patch('/:id/position', updateCardPosition) // PATCH /api/cards/:id/position

export { router as cardRouter }