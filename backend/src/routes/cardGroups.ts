import { Router } from 'express'
import { 
  createCardGroup, 
  updateCardGroup, 
  deleteCardGroup, 
  addCardsToGroup, 
  removeCardsFromGroup 
} from '@/controllers/cardGroupController'

const router = Router()

// Card group routes
router.post('/', createCardGroup)
router.patch('/:id', updateCardGroup)
router.delete('/:id', deleteCardGroup)
router.post('/:id/cards', addCardsToGroup)
router.delete('/:id/cards', removeCardsFromGroup)

export { router as cardGroupRouter }