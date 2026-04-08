import { eq, max, and, gte, sql } from 'drizzle-orm'
import { db } from '@/database/connection'
import { cards } from '@/database/schema'

/**
 * Calculate the next sort order for a new card in a column
 */
export async function calculateNextSortOrder(columnId: string): Promise<number> {
  const result = await db
    .select({ maxOrder: max(cards.sortOrder) })
    .from(cards)
    .where(eq(cards.columnId, columnId))

  const maxOrder = result[0]?.maxOrder ?? -1
  return maxOrder + 1
}

/**
 * Reorder cards within a column by updating their sortOrder values
 */
export async function reorderCards(columnId: string, cardIds: string[]): Promise<void> {
  // Update cards with new sort orders based on array position
  const updates = cardIds.map((cardId, index) => 
    db.update(cards)
      .set({ 
        sortOrder: index,
        updatedAt: new Date()
      })
      .where(and(
        eq(cards.id, cardId),
        eq(cards.columnId, columnId)
      ))
  )

  // Execute all updates
  await Promise.all(updates)
}

/**
 * Insert a card at a specific position in a column
 */
export async function insertCardAtPosition(
  cardId: string, 
  columnId: string, 
  position?: number
): Promise<void> {
  let targetPosition: number

  if (position === undefined) {
    // If no position specified, add to end
    targetPosition = await calculateNextSortOrder(columnId)
  } else {
    targetPosition = position
    
    // Shift existing cards at or after this position
    await db.update(cards)
      .set({ 
        sortOrder: sql`${cards.sortOrder} + 1`,
        updatedAt: new Date()
      })
      .where(and(
        eq(cards.columnId, columnId),
        gte(cards.sortOrder, position)
      ))
  }

  // Update the card's position and column
  await db.update(cards)
    .set({ 
      columnId,
      sortOrder: targetPosition,
      updatedAt: new Date()
    })
    .where(eq(cards.id, cardId))
}

/**
 * Move a card to a different column, optionally at a specific position
 */
export async function moveCardToColumn(
  cardId: string,
  targetColumnId: string,
  targetPosition?: number
): Promise<void> {
  // Get current card info
  const [currentCard] = await db
    .select()
    .from(cards)
    .where(eq(cards.id, cardId))

  if (!currentCard) {
    throw new Error('Card not found')
  }

  // If moving to same column, just update position
  if (currentCard.columnId === targetColumnId) {
    if (targetPosition !== undefined && targetPosition !== currentCard.sortOrder) {
      await insertCardAtPosition(cardId, targetColumnId, targetPosition)
    }
    return
  }

  // Moving to different column
  await insertCardAtPosition(cardId, targetColumnId, targetPosition)

  // Compact the old column's sort orders
  await compactSortOrders(currentCard.columnId)
}

/**
 * Compact sort orders in a column to remove gaps
 */
export async function compactSortOrders(columnId: string): Promise<void> {
  // Get all cards in the column ordered by sortOrder
  const columnCards = await db
    .select({ id: cards.id })
    .from(cards)
    .where(eq(cards.columnId, columnId))
    .orderBy(cards.sortOrder)

  // Reorder them with sequential sort orders
  const cardIds = columnCards.map(card => card.id)
  await reorderCards(columnId, cardIds)
}