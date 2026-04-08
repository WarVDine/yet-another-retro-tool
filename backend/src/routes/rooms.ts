import { Router } from 'express'
import { createRoom, joinRoom, getRoomById, updateRoomPhase } from '@/controllers/roomController'

const router = Router()

// Room routes
router.post('/', createRoom)
router.post('/join', joinRoom)
router.get('/:id', getRoomById)
router.patch('/:id/phase', updateRoomPhase)

export { router as roomRouter }
