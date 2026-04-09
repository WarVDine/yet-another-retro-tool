import { and, eq, sql } from 'drizzle-orm'
import { Request } from 'express'

import { VoteRequest, UnvoteRequest, VoteResponse } from '@yet-another-retro-tool/shared'
import { db } from '@/database/connection'
import { likes, users, cards, cardGroups, cardGroupMemberships, rooms, columns } from '@/database/schema'
import { asyncHandler } from '@/middleware/errorHandler'
import { CustomResponse } from '@/types/index'
import { filterVoteResponse } from '@/utils/responseFilter'

/**
 * Helper function to convert database vote record to VoteResponse
 */
const toVoteResponse = (vote: {
  id: string
  userId: string
  cardId: string | null
  groupId: string | null
  createdAt: Date
}): VoteResponse => {
  const response: VoteResponse = {
    id: vote.id,
    createdAt: vote.createdAt.toISOString(),
  }

  if (vote.cardId) {
    response.cardId = vote.cardId
  }
  if (vote.groupId) {
    response.groupId = vote.groupId
  }

  return response
}

/**
 * Cast a vote on a card or group
 */
export const voteOnTarget = asyncHandler(async (req: Request, res: CustomResponse<VoteResponse>) => {
  const { cardId, groupId }: VoteRequest = req.body
  const roomId = req.roomId!
  const room = req.room!

  // Authentication guaranteed by requireGuestUser middleware
  const userId = req.userId!

  try {
    // Room participation already validated by requireRoomParticipant middleware

    // Check if trying to vote on a card that's in a group
    if (cardId) {
      const cardInGroup = await db.query.cardGroupMemberships.findFirst({
        where: eq(cardGroupMemberships.cardId, cardId),
      })

      if (cardInGroup) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Cannot vote on cards within groups. Vote on the group instead.',
        })
        return
      }
    }

    // Check current vote count for user in this room
    const currentVotesQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(likes)
      .leftJoin(cards, eq(likes.cardId, cards.id))
      .leftJoin(cardGroups, eq(likes.groupId, cardGroups.id))
      .leftJoin(columns, sql`${columns.id} = COALESCE(${cards.columnId}, ${cardGroups.columnId})`)
      .innerJoin(users, eq(likes.userId, users.id))
      .where(
        and(
          eq(likes.userId, userId),
          // Only count votes for cards/groups in this room
          eq(columns.roomId, roomId)
        )
      )

    const currentVoteCount = currentVotesQuery[0]?.count || 0

    if (currentVoteCount >= room.maxVotesPerUser) {
      res.status(403).json({
        success: false,
        error: 'Max Votes Exceeded',
        message: `You have used all ${room.maxVotesPerUser} of your votes. Remove a vote before adding a new one.`,
      })
      return
    }

    // Create the vote
    const insertedVotes = await db
      .insert(likes)
      .values({
        userId,
        cardId: cardId || null,
        groupId: groupId || null,
      })
      .returning()

    const vote = insertedVotes[0]
    if (!vote) {
      throw new Error('Failed to create vote')
    }

    res.status(201).json({
      success: true,
      data: toVoteResponse(vote),
    })
  } catch (error) {
    console.error('Vote creation error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to cast vote',
    })
  }
})

/**
 * Remove a vote from a card or group
 */
export const removeVoteFromTarget = asyncHandler(async (req: Request, res: CustomResponse) => {
  const { cardId, groupId }: UnvoteRequest = req.body

  // Authentication guaranteed by requireGuestUser middleware
  const userId = req.userId!

  try {
    // Room participation already validated by requireRoomParticipant middleware

    // Find and remove one vote for this user on this target
    const voteToRemove = await db.query.likes.findFirst({
      where: and(eq(likes.userId, userId), cardId ? eq(likes.cardId, cardId) : eq(likes.groupId, groupId!)),
    })

    if (!voteToRemove) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'No vote found to remove',
      })
      return
    }

    await db.delete(likes).where(eq(likes.id, voteToRemove.id))

    res.status(200).json({
      success: true,
      message: 'Vote removed successfully',
    })
  } catch (error) {
    console.error('Vote removal error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to remove vote',
    })
  }
})
