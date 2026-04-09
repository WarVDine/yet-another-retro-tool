import { Request } from 'express'
import { eq, and, desc } from 'drizzle-orm'

import { 
  CreateGuestUserRequest, 
  GuestUserResponse, 
  UpdateGuestUserRequest,
  FacilitatedRetrosResponse 
} from '@yet-another-retro-tool/shared'
import { db } from '@/database/connection'
import { users, rooms, roomParticipants, cards } from '@/database/schema'
import { asyncHandler } from '@/middleware/errorHandler'
import { CustomResponse } from '@/types/index'

export const getGuestUser = asyncHandler(
  async (req: Request, res: CustomResponse<GuestUserResponse>) => {
    const { guestId } = req.params

    if (!guestId) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Guest ID is required'
      })
      return
    }

    // Ownership validation - user can only access their own profile
    const authenticatedGuestId = req.guestId // From requireGuestUser middleware
    if (guestId !== authenticatedGuestId) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'You can only access your own profile'
      })
      return
    }

    try {
      const user = await db.query.users.findFirst({
        where: eq(users.guestId, guestId)
      })

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Guest user not found'
        })
        return
      }

      res.json({
        success: true,
        data: {
          userId: user.id,
          guestId: user.guestId,
          displayName: user.displayName,
          createdAt: user.createdAt.toISOString()
        },
        message: 'Guest user retrieved successfully'
      })
    } catch (error) {
      console.error('Error retrieving guest user:', error)
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve guest user'
      })
    }
  }
)

export const createGuestUser = asyncHandler(
  async (req: Request, res: CustomResponse<GuestUserResponse>) => {
    const { displayName }: CreateGuestUserRequest = req.body

    // Validation
    if (!displayName || !displayName.trim()) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Display name is required'
      })
      return
    }

    try {
      // Generate secure guest ID on server
      const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create new guest user
      const userResult = await db.insert(users).values({
        guestId,
        displayName: displayName.trim()
      }).returning()

      if (!userResult.length) {
        throw new Error('Failed to create guest user')
      }

      const user = userResult[0]!

      res.status(201).json({
        success: true,
        data: {
          userId: user.id,
          guestId: user.guestId,
          displayName: user.displayName,
          createdAt: user.createdAt.toISOString()
        },
        message: 'Guest user created successfully'
      })
    } catch (error) {
      console.error('Error creating guest user:', error)
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create guest user'
      })
    }
  }
)

export const updateGuestUser = asyncHandler(
  async (req: Request, res: CustomResponse<GuestUserResponse>) => {
    const { guestId } = req.params
    const { displayName }: UpdateGuestUserRequest = req.body

    if (!guestId) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Guest ID is required'
      })
      return
    }

    if (!displayName || !displayName.trim()) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Display name is required'
      })
      return
    }

    // Ownership validation - user can only update their own profile
    const authenticatedGuestId = req.guestId // From requireGuestUser middleware
    if (guestId !== authenticatedGuestId) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'You can only access your own profile'
      })
      return
    }

    try {
      // Update the user's display name
      const userResult = await db
        .update(users)
        .set({ displayName: displayName.trim() })
        .where(eq(users.guestId, guestId))
        .returning()

      if (!userResult.length) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Guest user not found'
        })
        return
      }

      const user = userResult[0]!

      res.json({
        success: true,
        data: {
          userId: user.id,
          guestId: user.guestId,
          displayName: user.displayName,
          createdAt: user.createdAt.toISOString()
        },
        message: 'Guest user updated successfully'
      })
    } catch (error) {
      console.error('Error updating guest user:', error)
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update guest user'
      })
    }
  }
)

export const getFacilitatedRetros = asyncHandler(
  async (req: Request, res: CustomResponse<FacilitatedRetrosResponse>) => {
    const { guestId } = req.params
    const { limit } = req.query

    if (!guestId) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Guest ID is required'
      })
      return
    }

    // Ownership validation - user can only access their own facilitated retros
    const authenticatedGuestId = req.guestId // From requireGuestUser middleware
    if (guestId !== authenticatedGuestId) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'You can only access your own facilitated retros'
      })
      return
    }

    try {
      // First find the user by guestId
      const user = await db.query.users.findFirst({
        where: eq(users.guestId, guestId)
      })

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Guest user not found'
        })
        return
      }

      // Query room participations where user is facilitator, then get rooms
      const facilitatorParticipations = await db.query.roomParticipants.findMany({
        where: and(
          eq(roomParticipants.userId, user.id),
          eq(roomParticipants.role, 'facilitator')
        ),
        with: {
          room: {
            with: {
              participants: true,
              columns: {
                with: {
                  cards: true
                }
              }
            }
          }
        }
      })

      // Extract rooms and sort by updatedAt
      const facilitatedRooms = facilitatorParticipations
        .map(participation => participation.room)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, limit ? parseInt(limit as string) : undefined)

      // Transform to include counts and format data
      const retros = facilitatedRooms.map(room => {
        const participantCount = room.participants.length
        const cardCount = room.columns.reduce((total, column) => total + column.cards.length, 0)

        return {
          id: room.id,
          name: room.name,
          currentPhase: room.currentPhase,
          isActive: room.isActive,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
          participantCount,
          cardCount,
          facilitatorCode: room.facilitatorCode,
          participantCode: room.participantCode
        }
      })

      res.json({
        success: true,
        data: {
          retros,
          totalCount: retros.length
        },
        message: 'Facilitated retros retrieved successfully'
      })
    } catch (error) {
      console.error('Error retrieving facilitated retros:', error)
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve facilitated retros'
      })
    }
  }
)