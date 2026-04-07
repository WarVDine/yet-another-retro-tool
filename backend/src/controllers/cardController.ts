import { Request } from 'express'
import { eq, and, desc } from 'drizzle-orm'

import { db } from '@/database/connection'
import { cards } from '@/database/schema'
import { asyncHandler } from '@/middleware/errorHandler'
import {
  resolveGuestUser,
  validateRoomParticipant,
  validateCardOwnership,
  getRoomIdFromColumn,
  getRoomIdFromCard,
} from '@/middleware/auth'
import { CustomResponse } from '@/types'
import { CreateCardRequest, UpdateCardRequest, CardDetailResponse } from '@yet-another-retro-tool/shared'

/**
 * Create a new card
 * POST /api/cards
 */
export const createCard = asyncHandler(
  async (req: Request<{}, any, CreateCardRequest>, res: CustomResponse<CardDetailResponse>) => {
    const { columnId, content, guestId } = req.body as CreateCardRequest

    // Validate required fields
    if (!columnId || !content?.trim() || !guestId) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Column ID, content, and guest ID are required',
      })
      return
    }

    try {
      // Resolve guest user to userId
      const userId = await resolveGuestUser(guestId)

      // Get room ID from column and validate participation
      const roomId = await getRoomIdFromColumn(columnId)
      if (!roomId) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Column not found',
        })
        return
      }

      const isParticipant = await validateRoomParticipant(userId, roomId)
      if (!isParticipant) {
        res.status(403).json({
          success: false,
          error: 'Authorization Error',
          message: 'You must be a room participant to create cards',
        })
        return
      }

      // Get next sort order for this column
      const lastCard = await db.query.cards.findFirst({
        where: eq(cards.columnId, columnId),
        orderBy: [desc(cards.sortOrder)],
        columns: { sortOrder: true },
      })

      const nextSortOrder = (lastCard?.sortOrder || 0) + 1

      // Create the card
      const [newCard] = await db
        .insert(cards)
        .values({
          columnId,
          authorId: userId,
          content: content.trim(),
          sortOrder: nextSortOrder,
          isAnonymous: true, // Cards are always anonymous per requirements
        })
        .returning()

      if (!newCard) {
        res.status(500).json({
          success: false,
          error: 'Server Error',
          message: 'Failed to create card',
        })
        return
      }

      // Fetch the created card with author info for response
      const cardWithAuthor = await db.query.cards.findFirst({
        where: eq(cards.id, newCard.id),
        with: {
          author: true,
        },
      })

      if (!cardWithAuthor) {
        res.status(500).json({
          success: false,
          error: 'Server Error',
          message: 'Failed to retrieve created card',
        })
        return
      }

      res.status(201).json({
        success: true,
        data: {
          id: cardWithAuthor.id,
          content: cardWithAuthor.content,
          isAnonymous: cardWithAuthor.isAnonymous,
          authorName: cardWithAuthor.isAnonymous ? undefined : cardWithAuthor.author.displayName,
          sortOrder: cardWithAuthor.sortOrder,
          createdAt: cardWithAuthor.createdAt.toISOString(),
          columnId: cardWithAuthor.columnId,
          authorId: cardWithAuthor.authorId,
          updatedAt: cardWithAuthor.updatedAt.toISOString(),
          isOwner: true, // Always true for the creator
        },
        message: 'Card created successfully',
      })
    } catch (error) {
      console.error('Error creating card:', error)
      res.status(500).json({
        success: false,
        error: 'Server Error',
        message: 'Failed to create card',
      })
    }
  }
)

/**
 * Update an existing card
 * PATCH /api/cards/:id
 */
export const updateCard = asyncHandler(async (req: Request, res: CustomResponse<CardDetailResponse>) => {
  const { id: cardId } = req.params as { id: string }
  const { content, guestId } = req.body as UpdateCardRequest

  // Validate required fields
  if (!content?.trim() || !guestId) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Content and guest ID are required',
    })
    return
  }

  try {
    // Resolve guest user to userId
    const userId = await resolveGuestUser(guestId)

    // Validate card ownership
    const isOwner = await validateCardOwnership(cardId, userId)
    if (!isOwner) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'You can only edit your own cards',
      })
      return
    }

    // Update the card
    const [updatedCard] = await db
      .update(cards)
      .set({
        content: content.trim(),
        updatedAt: new Date(),
      })
      .where(eq(cards.id, cardId))
      .returning()

    if (!updatedCard) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Card not found',
      })
      return
    }

    // Fetch updated card with author info
    const cardWithAuthor = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
      with: {
        author: true,
      },
    })

    if (!cardWithAuthor) {
      res.status(500).json({
        success: false,
        error: 'Server Error',
        message: 'Failed to retrieve updated card',
      })
      return
    }

    res.json({
      success: true,
      data: {
        id: cardWithAuthor.id,
        content: cardWithAuthor.content,
        isAnonymous: cardWithAuthor.isAnonymous,
        authorName: cardWithAuthor.isAnonymous ? undefined : cardWithAuthor.author.displayName,
        sortOrder: cardWithAuthor.sortOrder,
        createdAt: cardWithAuthor.createdAt.toISOString(),
        columnId: cardWithAuthor.columnId,
        authorId: cardWithAuthor.authorId,
        updatedAt: cardWithAuthor.updatedAt.toISOString(),
        isOwner: true, // Always true for the owner making the update
      },
      message: 'Card updated successfully',
    })
  } catch (error) {
    console.error('Error updating card:', error)
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to update card',
    })
  }
})

/**
 * Delete a card
 * DELETE /api/cards/:id
 */
export const deleteCard = asyncHandler(async (req: Request, res: CustomResponse<void>) => {
  const { id: cardId } = req.params as { id: string }
  const { guestId } = req.body as { guestId: string }

  // Validate required fields
  if (!guestId) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Guest ID is required',
    })
    return
  }

  try {
    // Resolve guest user to userId
    const userId = await resolveGuestUser(guestId)

    // Validate card ownership
    const isOwner = await validateCardOwnership(cardId, userId)
    if (!isOwner) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'You can only delete your own cards',
      })
      return
    }

    // Delete the card
    const deletedCards = await db.delete(cards).where(eq(cards.id, cardId)).returning({ id: cards.id })

    if (deletedCards.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Card not found',
      })
      return
    }

    res.json({
      success: true,
      data: undefined,
      message: 'Card deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting card:', error)
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to delete card',
    })
  }
})
