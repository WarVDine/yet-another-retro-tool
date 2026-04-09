import { Router } from 'express'
import {
  createCardGroup,
  updateCardGroup,
  deleteCardGroup,
  addCardsToGroup,
  removeCardsFromGroup,
} from '@/controllers/cardGroupController'
import { requireGuestUser } from '@/middleware/auth'

const router = Router()

// Card group routes
router.post('/', requireGuestUser, createCardGroup)
router.patch('/:id', requireGuestUser, updateCardGroup)
router.delete('/:id', requireGuestUser, deleteCardGroup)
router.post('/:id/cards', requireGuestUser, addCardsToGroup)
router.delete('/:id/cards', requireGuestUser, removeCardsFromGroup)

export { router as cardGroupRouter }
