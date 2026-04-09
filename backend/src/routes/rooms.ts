import { Router } from 'express'
import { createRoom, joinRoom, getRoomById, updateRoomPhase, exportRoom } from '@/controllers/roomController'
import { requireGuestUser, requireRoomParticipant, requireFacilitator } from '@/middleware/auth'

const router = Router()

// Room routes
router.post('/', requireGuestUser, createRoom)
router.post('/join', requireGuestUser, joinRoom)
router.get('/:id', requireGuestUser, requireRoomParticipant, getRoomById)
router.patch('/:id/phase', requireGuestUser, requireFacilitator, updateRoomPhase)
router.get('/:id/export', requireGuestUser, requireFacilitator, exportRoom)

export { router as roomRouter }
