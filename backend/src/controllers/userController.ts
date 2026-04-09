import { Request } from 'express'
import { eq } from 'drizzle-orm'

import { CreateGuestUserRequest, GuestUserResponse, UpdateGuestUserRequest } from '@yet-another-retro-tool/shared'
import { db } from '@/database/connection'
import { users } from '@/database/schema'
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