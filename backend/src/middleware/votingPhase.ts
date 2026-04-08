import { Request, Response, NextFunction } from 'express'
import { eq } from 'drizzle-orm'

import { db } from '@/database/connection'
import { rooms, cards, cardGroups, columns } from '@/database/schema'
import { CustomResponse } from '@/types'

// Extend Request to include resolved room info
declare global {
  namespace Express {
    interface Request {
      roomId?: string
      room?: {
        id: string
        currentPhase: 'setup' | 'writing' | 'grouping' | 'voting' | 'discussing'
        maxVotesPerUser: number
      }
    }
  }
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

/**
 * Get room ID from group ID (via column)
 */
export const getRoomIdFromGroup = async (groupId: string): Promise<string | null> => {
  const group = await db.query.cardGroups.findFirst({
    where: eq(cardGroups.id, groupId),
    with: {
      column: {
        columns: {
          roomId: true
        }
      }
    }
  })

  return group?.column?.roomId || null
}

/**
 * Resolve room ID from vote target (card or group)
 */
export const resolveRoomFromVoteTarget = async (
  cardId?: string,
  groupId?: string
): Promise<string | null> => {
  if (cardId) {
    return await getRoomIdFromCard(cardId)
  }
  
  if (groupId) {
    return await getRoomIdFromGroup(groupId)
  }
  
  return null
}

/**
 * Middleware to validate that voting operations can only occur during voting phase
 * Must be used on all voting endpoints
 */
export const validateVotingPhase = async (
  req: Request,
  res: CustomResponse,
  next: NextFunction
) => {
  try {
    const { cardId, groupId } = req.body

    // Validate exactly one target is provided
    if (!cardId && !groupId) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Either cardId or groupId must be provided'
      })
      return
    }

    if (cardId && groupId) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Cannot vote on both card and group simultaneously'
      })
      return
    }

    // Resolve room from vote target
    const roomId = await resolveRoomFromVoteTarget(cardId, groupId)
    
    if (!roomId) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: cardId ? 'Card not found' : 'Group not found'
      })
      return
    }

    // Get room details
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, roomId),
      columns: {
        id: true,
        currentPhase: true,
        maxVotesPerUser: true
      }
    })

    if (!room) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Room not found'
      })
      return
    }

    // Validate room is in voting phase
    if (room.currentPhase !== 'voting') {
      res.status(409).json({
        success: false,
        error: 'Invalid Phase',
        message: `Voting is only allowed during the voting phase. Current phase: ${room.currentPhase}`
      })
      return
    }

    // Attach room info to request for downstream use
    req.roomId = roomId
    req.room = room
    next()
  } catch (error) {
    console.error('Voting phase validation error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to validate voting phase'
    })
  }
}