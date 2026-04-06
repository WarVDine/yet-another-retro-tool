import { Router } from 'express'
import { createRoom } from '@/controllers/roomController'

const router = Router()

// Room routes
router.post('/', createRoom)

export { router as roomRouter }