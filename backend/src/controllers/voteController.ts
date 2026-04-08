import { and, eq, sql } from 'drizzle-orm'
import { Request } from 'express'

import { VoteRequest, UnvoteRequest, VoteResponse, UserVotesSummary } from '@yet-another-retro-tool/shared'
import { db } from '@/database/connection'
import { likes, users, cards, cardGroups, cardGroupMemberships, rooms } from '@/database/schema'
import { asyncHandler } from '@/middleware/errorHandler'
import { validateRoomParticipant, resolveGuestUser } from '@/middleware/auth'
import { CustomResponse } from '@/types/index'

/**
 * Helper function to convert database vote record to VoteResponse
 */
const toVoteResponse = (vote: { 
  id: string; 
  userId: string; 
  cardId: string | null; 
  groupId: string | null; 
  createdAt: Date 
}): VoteResponse => {
  const response: VoteResponse = {
    id: vote.id,
    userId: vote.userId,
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
  const { cardId, groupId, guestId }: VoteRequest = req.body
  const roomId = req.roomId!
  const room = req.room!

  try {
    // Resolve guest user to userId
    const userId = await resolveGuestUser(guestId)

    // Validate user is participant in room
    const isParticipant = await validateRoomParticipant(userId, roomId)
    if (!isParticipant) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'You must be a participant in this room to vote',
      })
      return
    }

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
      .innerJoin(users, eq(likes.userId, users.id))
      .where(and(
        eq(users.guestId, guestId),
        eq(likes.userId, userId)
      ))

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
  const { cardId, groupId, guestId }: UnvoteRequest = req.body
  const roomId = req.roomId!

  try {
    // Resolve guest user to userId
    const userId = await resolveGuestUser(guestId)

    // Validate user is participant in room
    const isParticipant = await validateRoomParticipant(userId, roomId)
    if (!isParticipant) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'You must be a participant in this room to remove votes',
      })
      return
    }

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

/**
 * Get user's voting summary for a room
 */
export const getUserVotes = asyncHandler(async (req: Request, res: CustomResponse<UserVotesSummary>) => {
  const { userId, roomId } = req.params

  try {
    // Validate parameters
    if (!userId || !roomId) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Both userId and roomId are required'
      })
      return
    }

    // Validate user is participant in room
    const isParticipant = await validateRoomParticipant(userId, roomId)
    if (!isParticipant) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'You must be a participant in this room to view votes',
      })
      return
    }

    // Get room to check max votes
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, roomId),
      columns: {
        maxVotesPerUser: true,
      },
    })

    if (!room) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Room not found',
      })
      return
    }

    // Get user's votes in this room (need to join through cards/groups to get room)
    const userVotes = await db.query.likes.findMany({
      where: eq(likes.userId, userId),
      with: {
        card: {
          with: {
            column: true,
          },
        },
        group: {
          with: {
            column: true,
          },
        },
      },
    })

    // Filter votes that belong to this room
    const roomVotes = userVotes.filter((vote) => {
      const roomIdFromVote = vote.card?.column?.roomId || vote.group?.column?.roomId
      return roomIdFromVote === roomId
    })

    const votesUsed = roomVotes.length
    const votesRemaining = room.maxVotesPerUser - votesUsed

    res.status(200).json({
      success: true,
      data: {
        userId,
        votesUsed,
        maxVotes: room.maxVotesPerUser,
        votesRemaining,
        votes: roomVotes.map(toVoteResponse),
      },
    })
  } catch (error) {
    console.error('Get user votes error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get user votes',
    })
  }
})
