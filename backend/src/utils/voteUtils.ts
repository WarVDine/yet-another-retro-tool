import { eq, or, and, inArray } from 'drizzle-orm'

import { db } from '@/database/connection'
import { likes, cards, cardGroups, columns } from '@/database/schema'

/**
 * Efficiently get all votes for a specific room
 * Uses proper SQL joins instead of loading all votes and filtering in memory
 */
export async function getVotesForRoom(roomId: string) {
  // Get votes for cards in this room
  const cardVotesQuery = db
    .select({
      id: likes.id,
      userId: likes.userId,
      cardId: likes.cardId,
      groupId: likes.groupId,
      createdAt: likes.createdAt,
    })
    .from(likes)
    .innerJoin(cards, eq(likes.cardId, cards.id))
    .innerJoin(columns, eq(cards.columnId, columns.id))
    .where(eq(columns.roomId, roomId))

  // Get votes for groups in this room
  const groupVotesQuery = db
    .select({
      id: likes.id,
      userId: likes.userId,
      cardId: likes.cardId,
      groupId: likes.groupId,
      createdAt: likes.createdAt,
    })
    .from(likes)
    .innerJoin(cardGroups, eq(likes.groupId, cardGroups.id))
    .innerJoin(columns, eq(cardGroups.columnId, columns.id))
    .where(eq(columns.roomId, roomId))

  // Execute both queries
  const [cardVotes, groupVotes] = await Promise.all([
    cardVotesQuery,
    groupVotesQuery,
  ])

  // Combine results
  const allVotes = [...cardVotes, ...groupVotes]

  // Now get the full vote data with relations for the votes we found
  const voteIds = allVotes.map(vote => vote.id)
  
  if (voteIds.length === 0) {
    return []
  }

  const fullVotes = await db.query.likes.findMany({
    where: (likes, { inArray }) => inArray(likes.id, voteIds),
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

  return fullVotes
}

/**
 * Type for the vote data returned by getVotesForRoom
 */
export type RoomVote = Awaited<ReturnType<typeof getVotesForRoom>>[0]