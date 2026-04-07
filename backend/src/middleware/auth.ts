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
    where: eq(users.guestId, guestId)
  })

  if (!user) {
    throw new Error('Invalid guest ID')
  }

  return user.id
}

/**
 * Middleware to resolve guest user from request body
 */
export const requireGuestUser = async (
  req: Request,
  res: CustomResponse,
  next: NextFunction
) => {
  try {
    const { guestId } = req.body

    if (!guestId) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Guest ID is required'
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
      message: error instanceof Error ? error.message : 'Invalid user credentials'
    })
  }
}

/**
 * Validate that user is a participant in the specified room
 */
export const validateRoomParticipant = async (
  userId: string,
  roomId: string
): Promise<boolean> => {
  const participation = await db.query.roomParticipants.findFirst({
    where: and(
      eq(roomParticipants.userId, userId),
      eq(roomParticipants.roomId, roomId)
    )
  })

  return !!participation
}

/**
 * Validate that user owns the specified card
 */
export const validateCardOwnership = async (
  cardId: string,
  userId: string
): Promise<boolean> => {
  const card = await db.query.cards.findFirst({
    where: eq(cards.id, cardId)
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
      roomId: true
    }
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
          roomId: true
        }
      }
    }
  })

  return card?.column?.roomId || null
}