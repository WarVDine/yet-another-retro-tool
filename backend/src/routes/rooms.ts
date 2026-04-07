import { Router } from 'express'
import { createRoom, joinRoom, getRoomById } from '@/controllers/roomController'

const router = Router()

// Room routes
router.post('/', createRoom)
router.post('/join', joinRoom)
router.get('/:id', getRoomById)

export { router as roomRouter }