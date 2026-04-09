import { Request, Response, NextFunction } from 'express'
import { eq, and } from 'drizzle-orm'

import { db } from '@/database/connection'
import { users, roomParticipants, cards, columns } from '@/database/schema'
import { CustomResponse } from '@/types'

// Extend Request to include resolved user info
declare global {
  namespace Express {
    interface Request {
      userId?: string
      guestId?: string
    }
  }
}

/**
 * Resolve guestId to userId and attach to request
 */
export const resolveGuestUser = async (guestId: string): Promise<string> => {
  if (!guestId) {
    throw new Error('Guest ID is required')
  }

  const user = await db.query.users.findFirst({
    where: eq(users.guestId, guestId),
  })

  if (!user) {
    throw new Error('Invalid guest ID')
  }

  return user.id
}

/**
 * Extract guest ID from Authorization header
 * Expected format: "Authorization: Guest <guestId>"
 */
export const extractGuestIdFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Guest') {
    return null
  }

  return parts[1] || null
}

/**
 * Middleware to resolve guest user from Authorization header
 */
export const requireGuestUser = async (req: Request, res: CustomResponse, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const guestId = extractGuestIdFromHeader(authHeader)

    if (!guestId) {
      res.status(401).json({
        success: false,
        error: 'Authorization Error',
        message: 'Valid Authorization header is required (format: "Guest <guestId>")',
      })
      return
    }

    const userId = await resolveGuestUser(guestId)
    req.userId = userId
    req.guestId = guestId
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authorization Error',
      message: error instanceof Error ? error.message : 'Invalid user credentials',
    })
  }
}

/**
 * Validate that user is a participant in the specified room
 */
export const validateRoomParticipant = async (userId: string, roomId: string): Promise<boolean> => {
  const participation = await db.query.roomParticipants.findFirst({
    where: and(eq(roomParticipants.userId, userId), eq(roomParticipants.roomId, roomId)),
  })

  return !!participation
}

/**
 * Validate that user is a facilitator in the specified room
 */
export const validateFacilitatorRole = async (userId: string, roomId: string): Promise<boolean> => {
  const participation = await db.query.roomParticipants.findFirst({
    where: and(eq(roomParticipants.userId, userId), eq(roomParticipants.roomId, roomId)),
  })

  return participation?.role === 'facilitator'
}

/**
 * Validate that user owns the specified card
 */
export const validateCardOwnership = async (cardId: string, userId: string): Promise<boolean> => {
  const card = await db.query.cards.findFirst({
    where: eq(cards.id, cardId),
  })

  return card?.authorId === userId
}

/**
 * Get room ID from column ID
 */
export const getRoomIdFromColumn = async (columnId: string): Promise<string | null> => {
  const column = await db.query.columns.findFirst({
    where: eq(columns.id, columnId),
    columns: {
      roomId: true,
    },
  })

  return column?.roomId || null
}

/**
 * Get room ID from card ID (via column)
 */
export const getRoomIdFromCard = async (cardId: string): Promise<string | null> => {
  const card = await db.query.cards.findFirst({
    where: eq(cards.id, cardId),
    with: {
      column: {
        columns: {
          roomId: true,
        },
      },
    },
  })

  return card?.column?.roomId || null
}

/**
 * Middleware to require room participant access
 * Expects roomId in req.params.id
 */
export const requireRoomParticipant = async (req: Request, res: CustomResponse, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Authorization Error',
        message: 'User authentication required',
      })
      return
    }

    const roomId = req.params.id || req.roomId
    if (!roomId) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Room ID is required',
      })
      return
    }

    const isParticipant = await validateRoomParticipant(req.userId, roomId)
    if (!isParticipant) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'You must be a room participant to access this resource',
      })
      return
    }

    next()
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to validate room access',
    })
  }
}

/**
 * Middleware to require facilitator access
 * Expects roomId in req.params.id
 */
export const requireFacilitator = async (req: Request, res: CustomResponse, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Authorization Error',
        message: 'User authentication required',
      })
      return
    }

    const roomId = req.params.id
    if (!roomId) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Room ID is required',
      })
      return
    }

    const isFacilitator = await validateFacilitatorRole(req.userId, roomId)
    if (!isFacilitator) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'Facilitator access required for this operation',
      })
      return
    }

    next()
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to validate facilitator access',
    })
  }
}

/**
 * Middleware to require facilitator access for card operations
 * Gets roomId by looking up the card first
 */
export const requireFacilitatorForCard = async (req: Request, res: CustomResponse, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Authorization Error',
        message: 'User authentication required',
      })
      return
    }

    const cardId = req.params.id
    if (!cardId) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Card ID is required',
      })
      return
    }

    // Get the card to find its room
    const card = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
      with: {
        column: true,
      },
    })

    if (!card) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Card not found',
      })
      return
    }

    const roomId = card.column.roomId
    const isFacilitator = await validateFacilitatorRole(req.userId, roomId)

    if (!isFacilitator) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'Facilitator access required for this action',
      })
      return
    }

    // Store roomId for use in the controller
    req.roomId = roomId
    next()
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to validate facilitator access',
    })
  }
}
