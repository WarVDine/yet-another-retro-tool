import { db, checkDatabaseConnection } from './connection'
import {
  rooms,
  users,
  columns,
  roomParticipants,
  cards,
  cardGroups,
  likes,
} from './schema'
import { count } from 'drizzle-orm'

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n')

  try {
    // Test connection
    console.log('1. Testing database connection...')
    const isConnected = await checkDatabaseConnection()
    if (isConnected) {
      console.log('   ✅ Database connection successful')
    } else {
      console.log('   ❌ Database connection failed')
      return
    }

    // Check if tables exist and count records
    console.log('\n2. Checking tables and record counts...')

    const tables = [
      { name: 'rooms', table: rooms },
      { name: 'users', table: users },
      { name: 'room_participants', table: roomParticipants },
      { name: 'columns', table: columns },
      { name: 'cards', table: cards },
      { name: 'card_groups', table: cardGroups },
      { name: 'likes', table: likes },
    ]

    for (const { name, table } of tables) {
      try {
        const result = await db.select({ count: count() }).from(table)
        const recordCount = result[0]?.count || 0
        console.log(`   ✅ ${name.padEnd(20)} - ${recordCount} records`)
      } catch (error) {
        console.log(`   ❌ ${name.padEnd(20)} - Table not found or error`)
        console.log(`      Error: ${(error as Error).message}`)
      }
    }

    // Show sample data
    console.log('\n3. Sample data preview...')

    try {
      const sampleRooms = await db
        .select({
          name: rooms.name,
          facilitatorCode: rooms.facilitatorCode,
          participantCode: rooms.participantCode,
          phase: rooms.currentPhase,
          isActive: rooms.isActive,
        })
        .from(rooms)
        .limit(3)

      if (sampleRooms.length > 0) {
        console.log('   📋 Sample Rooms:')
        sampleRooms.forEach((room, index) => {
          console.log(`   ${index + 1}. ${room.name}`)
          console.log(`      Facilitator Code: ${room.facilitatorCode}`)
          console.log(`      Participant Code: ${room.participantCode}`)
          console.log(`      Phase: ${room.phase}`)
          console.log(`      Active: ${room.isActive}`)
          console.log('')
        })
      }
    } catch (error) {
      console.log('   ❌ Could not fetch sample room data')
    }

    try {
      const sampleUsers = await db
        .select({
          displayName: users.displayName,
          guestId: users.guestId,
        })
        .from(users)
        .limit(5)

      if (sampleUsers.length > 0) {
        console.log('   👥 Sample Users:')
        sampleUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.displayName} (${user.guestId})`)
        })
        console.log('')
      }
    } catch (error) {
      console.log('   ❌ Could not fetch sample user data')
    }

    try {
      const sampleColumns = await db
        .select({
          title: columns.title,
          color: columns.color,
          sortOrder: columns.sortOrder,
        })
        .from(columns)
        .limit(10)

      if (sampleColumns.length > 0) {
        console.log('   📊 Sample Columns:')
        sampleColumns.forEach((column, index) => {
          console.log(
            `   ${index + 1}. ${column.title} (${column.color}) - Order: ${column.sortOrder}`
          )
        })
        console.log('')
      }
    } catch (error) {
      console.log('   ❌ Could not fetch sample column data')
    }

    console.log('🎉 Database verification completed!')
    console.log('\n💡 Next steps:')
    console.log('   - Run `npm run db:studio` to open the database GUI')
    console.log('   - Start your backend: `npm run dev:backend`')
    console.log('   - Check the access codes above to test room joining')
  } catch (error) {
    console.error('❌ Verification failed:', error)
    throw error
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyDatabase()
    .then(() => {
      console.log('\nVerification process finished')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\nVerification process failed:', error)
      process.exit(1)
    })
}
