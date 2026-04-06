import { Router } from 'express'
import {
  getRetroSessions,
  getRetroSession,
  createRetroSession,
  updateRetroSession,
  deleteRetroSession,
  getRetroItems,
  createRetroItem,
  updateRetroItem,
  deleteRetroItem,
} from '@/controllers/retroController'

const router = Router()

// Retro session routes
router.get('/sessions', getRetroSessions)
router.get('/sessions/:id', getRetroSession)
router.post('/sessions', createRetroSession)
router.put('/sessions/:id', updateRetroSession)
router.delete('/sessions/:id', deleteRetroSession)

// Retro item routes
router.get('/sessions/:sessionId/items', getRetroItems)
router.post('/sessions/:sessionId/items', createRetroItem)
router.put('/items/:id', updateRetroItem)
router.delete('/items/:id', deleteRetroItem)

export { router as retroRouter }