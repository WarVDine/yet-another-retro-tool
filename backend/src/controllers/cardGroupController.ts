import { and, eq, inArray } from 'drizzle-orm'
import { Request } from 'express'

import {
  CreateCardGroupRequest,
  UpdateCardGroupRequest,
  AddCardsToGroupRequest,
  RemoveCardsFromGroupRequest,
  CardGroupResponse,
} from '@yet-another-retro-tool/shared'
import { db } from '@/database/connection'
import { cardGroups, cardGroupMemberships, cards, columns } from '@/database/schema'
import { asyncHandler } from '@/middleware/errorHandler'
import { validateFacilitatorRole } from '@/middleware/auth'
import { CustomResponse } from '@/types/index'

export const createCardGroup = asyncHandler(async (req: Request, res: CustomResponse<CardGroupResponse>) => {
  const { columnId, title, cardIds }: CreateCardGroupRequest = req.body

  if (!columnId || !title || !cardIds || cardIds.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Column ID, title, and card IDs are required',
    })
    return
  }

  try {
    // Get room ID from column
    const column = await db.query.columns.findFirst({
      where: eq(columns.id, columnId),
    })

    if (!column) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Column not found',
      })
      return
    }

    // Authentication guaranteed by requireGuestUser middleware
    const userId = req.userId!

    // Validate user is a facilitator of the room
    const isFacilitator = await validateFacilitatorRole(userId, column.roomId)
    if (!isFacilitator) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'Only facilitators can create card groups',
      })
      return
    }

    // Verify all cards exist and belong to the same room
    const existingCards = await db.query.cards.findMany({
      where: inArray(cards.id, cardIds),
      with: {
        column: true,
      },
    })

    if (existingCards.length !== cardIds.length) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Some cards do not exist',
      })
      return
    }

    // Verify all cards belong to the same room
    const roomIds = [...new Set(existingCards.map((card) => card.column.roomId))]
    if (roomIds.length !== 1 || roomIds[0] !== column.roomId) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'All cards must belong to the same room',
      })
      return
    }

    // Create the card group
    const [newGroup] = await db
      .insert(cardGroups)
      .values({
        columnId,
        title,
        sortOrder: 0, // TODO: Calculate proper sort order
      })
      .returning()

    if (!newGroup) {
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create card group',
      })
      return
    }

    // Update cards' columnId to match the group's column (exclusive location model)
    await db
      .update(cards)
      .set({
        columnId: columnId,
        updatedAt: new Date(),
      })
      .where(inArray(cards.id, cardIds))

    // Add cards to the group
    const memberships = cardIds.map((cardId) => ({
      cardId,
      groupId: newGroup.id,
    }))

    await db.insert(cardGroupMemberships).values(memberships)

    // Fetch the complete group with cards
    const groupWithCards = await db.query.cardGroups.findFirst({
      where: eq(cardGroups.id, newGroup.id),
      with: {
        cardMemberships: {
          with: {
            card: {
              with: {
                author: true,
              },
            },
          },
        },
      },
    })

    if (!groupWithCards) {
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch created group',
      })
      return
    }

    // Format response
    const response: CardGroupResponse = {
      id: groupWithCards.id,
      columnId: groupWithCards.columnId,
      title: groupWithCards.title,
      description: groupWithCards.description,
      sortOrder: groupWithCards.sortOrder,
      createdAt: groupWithCards.createdAt.toISOString(),
      updatedAt: groupWithCards.updatedAt.toISOString(),
      cards: groupWithCards.cardMemberships.map((membership) => ({
        id: membership.card.id,
        columnId: membership.card.columnId,
        authorId: membership.card.authorId,
        content: membership.card.content,
        isAnonymous: membership.card.isAnonymous,
        sortOrder: membership.card.sortOrder,
        createdAt: membership.card.createdAt.toISOString(),
        updatedAt: membership.card.updatedAt.toISOString(),
        isOwner: false, // this isn't needed during card grouping
      })),
    }

    res.status(201).json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Error creating card group:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create card group',
    })
  }
})

export const updateCardGroup = asyncHandler(async (req: Request, res: CustomResponse<CardGroupResponse>) => {
  const { id } = req.params
  const { title }: UpdateCardGroupRequest = req.body

  if (!id) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Group ID is required',
    })
    return
  }

  try {
    // Get the group and validate it exists
    const group = await db.query.cardGroups.findFirst({
      where: eq(cardGroups.id, id),
      with: {
        column: true,
      },
    })

    if (!group) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Card group not found',
      })
      return
    }

    // Authentication guaranteed by requireGuestUser middleware
    const userId = req.userId!

    // Validate user is a facilitator of the room
    const isFacilitator = await validateFacilitatorRole(userId, group.column.roomId)
    if (!isFacilitator) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'Only facilitators can update card groups',
      })
      return
    }

    // Update the group
    const updateData: Partial<typeof cardGroups.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (title !== undefined) {
      updateData.title = title
    }

    const [updatedGroup] = await db.update(cardGroups).set(updateData).where(eq(cardGroups.id, id)).returning()

    if (!updatedGroup) {
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update card group',
      })
      return
    }

    // Fetch the complete group with cards
    const groupWithCards = await db.query.cardGroups.findFirst({
      where: eq(cardGroups.id, id),
      with: {
        cardMemberships: {
          with: {
            card: {
              with: {
                author: true,
              },
            },
          },
        },
      },
    })

    if (!groupWithCards) {
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch updated group',
      })
      return
    }

    // Format response
    const response: CardGroupResponse = {
      id: groupWithCards.id,
      columnId: groupWithCards.columnId,
      title: groupWithCards.title,
      description: groupWithCards.description,
      sortOrder: groupWithCards.sortOrder,
      createdAt: groupWithCards.createdAt.toISOString(),
      updatedAt: groupWithCards.updatedAt.toISOString(),
      cards: groupWithCards.cardMemberships.map((membership) => ({
        id: membership.card.id,
        columnId: membership.card.columnId,
        authorId: membership.card.authorId,
        content: membership.card.content,
        isAnonymous: membership.card.isAnonymous,
        sortOrder: membership.card.sortOrder,
        createdAt: membership.card.createdAt.toISOString(),
        updatedAt: membership.card.updatedAt.toISOString(),
        isOwner: false, // this isn't needed during card grouping
      })),
    }

    res.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Error updating card group:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update card group',
    })
  }
})

export const deleteCardGroup = asyncHandler(async (req: Request, res: CustomResponse<void>) => {
  const { id } = req.params

  if (!id) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Group ID is required',
    })
    return
  }

  try {
    // Get the group and validate it exists
    const group = await db.query.cardGroups.findFirst({
      where: eq(cardGroups.id, id),
      with: {
        column: true,
      },
    })

    if (!group) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Card group not found',
      })
      return
    }

    // Authentication guaranteed by requireGuestUser middleware
    const userId = req.userId!

    // Validate user is a facilitator of the room
    const isFacilitator = await validateFacilitatorRole(userId, group.column.roomId)
    if (!isFacilitator) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'Only facilitators can delete card groups',
      })
      return
    }

    // Delete the group (memberships will be cascade deleted)
    await db.delete(cardGroups).where(eq(cardGroups.id, id))

    res.json({
      success: true,
      message: 'Card group deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting card group:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete card group',
    })
  }
})

export const addCardsToGroup = asyncHandler(async (req: Request, res: CustomResponse<CardGroupResponse>) => {
  const { id } = req.params
  const { cardIds }: AddCardsToGroupRequest = req.body

  if (!id || !cardIds || cardIds.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Group ID and card IDs are required',
    })
    return
  }

  try {
    // Get the group and validate it exists
    const group = await db.query.cardGroups.findFirst({
      where: eq(cardGroups.id, id),
      with: {
        column: true,
      },
    })

    if (!group) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Card group not found',
      })
      return
    }

    // Authentication guaranteed by requireGuestUser middleware
    const userId = req.userId!

    // Validate user is a facilitator of the room
    const isFacilitator = await validateFacilitatorRole(userId, group.column.roomId)
    if (!isFacilitator) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'Only facilitators can modify card groups',
      })
      return
    }

    // Verify all cards exist
    const existingCards = await db.query.cards.findMany({
      where: inArray(cards.id, cardIds),
    })

    if (existingCards.length !== cardIds.length) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Some cards do not exist',
      })
      return
    }

    // Update cards' columnId to match the group's column (exclusive location model)
    await db
      .update(cards)
      .set({
        columnId: group.columnId,
        updatedAt: new Date(),
      })
      .where(inArray(cards.id, cardIds))

    // Add cards to the group (ignore if already in group)
    const memberships = cardIds.map((cardId) => ({
      cardId,
      groupId: id,
    }))

    await db.insert(cardGroupMemberships).values(memberships).onConflictDoNothing()

    // Fetch the complete group with cards
    const groupWithCards = await db.query.cardGroups.findFirst({
      where: eq(cardGroups.id, id),
      with: {
        cardMemberships: {
          with: {
            card: {
              with: {
                author: true,
              },
            },
          },
        },
      },
    })

    if (!groupWithCards) {
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch updated group',
      })
      return
    }

    // Format response
    const response: CardGroupResponse = {
      id: groupWithCards.id,
      columnId: groupWithCards.columnId,
      title: groupWithCards.title,
      description: groupWithCards.description,
      sortOrder: groupWithCards.sortOrder,
      createdAt: groupWithCards.createdAt.toISOString(),
      updatedAt: groupWithCards.updatedAt.toISOString(),
      cards: groupWithCards.cardMemberships.map((membership) => ({
        id: membership.card.id,
        columnId: membership.card.columnId,
        authorId: membership.card.authorId,
        content: membership.card.content,
        isAnonymous: membership.card.isAnonymous,
        sortOrder: membership.card.sortOrder,
        createdAt: membership.card.createdAt.toISOString(),
        updatedAt: membership.card.updatedAt.toISOString(),
        isOwner: false, // Always false for card group operations
      })),
    }

    res.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Error adding cards to group:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to add cards to group',
    })
  }
})

export const removeCardsFromGroup = asyncHandler(
  async (req: Request, res: CustomResponse<CardGroupResponse | void>) => {
    const { id } = req.params
    const { cardIds }: RemoveCardsFromGroupRequest = req.body

    if (!id || !cardIds || cardIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Group ID and card IDs are required',
      })
      return
    }

    try {
      // Get the group and validate it exists
      const group = await db.query.cardGroups.findFirst({
        where: eq(cardGroups.id, id),
        with: {
          column: true,
        },
      })

      if (!group) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Card group not found',
        })
        return
      }

      // Authentication guaranteed by requireGuestUser middleware
      const userId = req.userId!

      // Validate user is a facilitator of the room
      const isFacilitator = await validateFacilitatorRole(userId, group.column.roomId)
      if (!isFacilitator) {
        res.status(403).json({
          success: false,
          error: 'Authorization Error',
          message: 'Only facilitators can modify card groups',
        })
        return
      }

      // Remove cards from the group
      await db
        .delete(cardGroupMemberships)
        .where(and(eq(cardGroupMemberships.groupId, id), inArray(cardGroupMemberships.cardId, cardIds)))

      // Check if group still has cards
      const remainingMemberships = await db.query.cardGroupMemberships.findMany({
        where: eq(cardGroupMemberships.groupId, id),
      })

      // If no cards left, delete the group
      if (remainingMemberships.length === 0) {
        await db.delete(cardGroups).where(eq(cardGroups.id, id))

        res.json({
          success: true,
          message: 'Card group deleted (no cards remaining)',
        })
        return
      }

      // Fetch the updated group with remaining cards
      const groupWithCards = await db.query.cardGroups.findFirst({
        where: eq(cardGroups.id, id),
        with: {
          cardMemberships: {
            with: {
              card: {
                with: {
                  author: true,
                },
              },
            },
          },
        },
      })

      if (!groupWithCards) {
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to fetch updated group',
        })
        return
      }

      // Format response
      const response: CardGroupResponse = {
        id: groupWithCards.id,
        columnId: groupWithCards.columnId,
        title: groupWithCards.title,
        description: groupWithCards.description,
        sortOrder: groupWithCards.sortOrder,
        createdAt: groupWithCards.createdAt.toISOString(),
        updatedAt: groupWithCards.updatedAt.toISOString(),
        cards: groupWithCards.cardMemberships.map((membership) => ({
          id: membership.card.id,
          columnId: membership.card.columnId,
          authorId: membership.card.authorId,
          content: membership.card.content,
          isAnonymous: membership.card.isAnonymous,
          sortOrder: membership.card.sortOrder,
          createdAt: membership.card.createdAt.toISOString(),
          updatedAt: membership.card.updatedAt.toISOString(),
          isOwner: false, // Always false for card group operations
        })),
      }

      res.json({
        success: true,
        data: response,
      })
    } catch (error) {
      console.error('Error removing cards from group:', error)
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to remove cards from group',
      })
    }
  }
)
