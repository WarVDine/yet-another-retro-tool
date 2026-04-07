import { Router } from 'express'

import { createCard, updateCard, deleteCard } from '@/controllers/cardController'

const router = Router()

// Card CRUD routes
router.post('/', createCard)           // POST /api/cards
router.patch('/:id', updateCard)       // PATCH /api/cards/:id  
router.delete('/:id', deleteCard)      // DELETE /api/cards/:id

export { router as cardRouter }