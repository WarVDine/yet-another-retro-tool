import { eq, sql } from 'drizzle-orm'
import { db } from '../connection'
import { cards, cardGroups, cardGroupMemberships } from '../schema'

/**
 * Migration to fix card position inconsistencies
 * 
 * This migration addresses the exclusive location model by:
 * 1. Updating cards' columnId to match their group's columnId (if they're in a group)
 * 2. Recalculating sortOrder values to ensure proper ordering
 * 3. Fixing any orphaned or inconsistent data
 */
export async function fixCardPositions() {
  console.log('Starting card position migration...')

  try {
    // Step 1: Update cards' columnId to match their group's columnId
    console.log('Step 1: Updating card columnIds for grouped cards...')
    
    const result = await db.execute(sql`
      UPDATE cards 
      SET column_id = cg.column_id, updated_at = NOW()
      FROM card_group_memberships cgm
      JOIN card_groups cg ON cgm.group_id = cg.id
      WHERE cards.id = cgm.card_id 
      AND cards.column_id != cg.column_id
    `)
    
    console.log(`Updated ${result.rowCount} cards to match their group's column`)

    // Step 2: Recalculate sort orders within each column
    console.log('Step 2: Recalculating sort orders...')
    
    // Get all columns with cards
    const columnsWithCards = await db.execute(sql`
      SELECT DISTINCT column_id 
      FROM cards 
      ORDER BY column_id
    `)

    for (const { column_id } of columnsWithCards.rows) {
      // Get all cards in this column ordered by creation date (fallback ordering)
      const columnCards = await db.execute(sql`
        SELECT id 
        FROM cards 
        WHERE column_id = ${column_id}
        ORDER BY created_at, id
      `)

      // Update sort orders sequentially
      for (let i = 0; i < columnCards.rows.length; i++) {
        const { id: cardId } = columnCards.rows[i]
        await db.execute(sql`
          UPDATE cards 
          SET sort_order = ${i}, updated_at = NOW()
          WHERE id = ${cardId}
        `)
      }
    }

    console.log(`Recalculated sort orders for ${columnsWithCards.rows.length} columns`)

    // Step 3: Update group sort orders (currently all 0)
    console.log('Step 3: Updating group sort orders...')
    
    const columnsWithGroups = await db.execute(sql`
      SELECT DISTINCT column_id 
      FROM card_groups 
      ORDER BY column_id
    `)

    for (const { column_id } of columnsWithGroups.rows) {
      // Get all groups in this column ordered by creation date
      const columnGroups = await db.execute(sql`
        SELECT id 
        FROM card_groups 
        WHERE column_id = ${column_id}
        ORDER BY created_at, id
      `)

      // Update sort orders sequentially
      for (let i = 0; i < columnGroups.rows.length; i++) {
        const { id: groupId } = columnGroups.rows[i]
        await db.execute(sql`
          UPDATE card_groups 
          SET sort_order = ${i}, updated_at = NOW()
          WHERE id = ${groupId}
        `)
      }
    }

    console.log(`Updated sort orders for ${columnsWithGroups.rows.length} columns with groups`)

    // Step 4: Verify data consistency
    console.log('Step 4: Verifying data consistency...')
    
    const inconsistentCards = await db.execute(sql`
      SELECT c.id, c.column_id as card_column, cg.column_id as group_column
      FROM cards c
      JOIN card_group_memberships cgm ON c.id = cgm.card_id
      JOIN card_groups cg ON cgm.group_id = cg.id
      WHERE c.column_id != cg.column_id
    `)

    if (inconsistentCards.rows.length > 0) {
      console.warn(`Found ${inconsistentCards.rows.length} cards with inconsistent columnId:`)
      console.warn(inconsistentCards.rows)
    } else {
      console.log('✓ All grouped cards have consistent columnId')
    }

    // Check for duplicate sort orders
    const duplicateSortOrders = await db.execute(sql`
      SELECT column_id, sort_order, COUNT(*) as count
      FROM cards
      GROUP BY column_id, sort_order
      HAVING COUNT(*) > 1
    `)

    if (duplicateSortOrders.rows.length > 0) {
      console.warn(`Found duplicate sort orders:`)
      console.warn(duplicateSortOrders.rows)
    } else {
      console.log('✓ All cards have unique sort orders within their columns')
    }

    console.log('Card position migration completed successfully!')

  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Run migration if called directly
if (require.main === module) {
  fixCardPositions()
    .then(() => {
      console.log('Migration completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}