import { db } from './connection'
import {
  rooms,
  users,
  roomParticipants,
  columns,
  type NewRoom,
  type NewUser,
  type NewRoomParticipant,
  type NewColumn,
} from './schema'

// Generate random codes for rooms
const generateCode = (length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Column templates for different retro formats
const retroTemplates = {
  classic: [
    {
      title: 'What went well?',
      description: 'Things that worked well this sprint',
      color: '#10B981',
    }, // green
    {
      title: 'What could be improved?',
      description: 'Areas for improvement',
      color: '#F59E0B',
    }, // yellow
    {
      title: 'Action items',
      description: 'Concrete next steps',
      color: '#3B82F6',
    }, // blue
  ],
  startStopContinue: [
    {
      title: 'Start doing',
      description: 'New practices to adopt',
      color: '#10B981',
    }, // green
    {
      title: 'Stop doing',
      description: 'Practices to discontinue',
      color: '#EF4444',
    }, // red
    {
      title: 'Continue doing',
      description: 'Practices to keep',
      color: '#3B82F6',
    }, // blue
  ],
  madSadGlad: [
    {
      title: 'Mad',
      description: 'Things that frustrated us',
      color: '#EF4444',
    }, // red
    {
      title: 'Sad',
      description: 'Things that disappointed us',
      color: '#F59E0B',
    }, // yellow
    {
      title: 'Glad',
      description: 'Things that made us happy',
      color: '#10B981',
    }, // green
  ],
  fourLs: [
    { title: 'Liked', description: 'What we enjoyed', color: '#10B981' }, // green
    { title: 'Learned', description: 'What we discovered', color: '#3B82F6' }, // blue
    { title: 'Lacked', description: 'What was missing', color: '#F59E0B' }, // yellow
    {
      title: 'Longed for',
      description: 'What we wished for',
      color: '#8B5CF6',
    }, // purple
  ],
}

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...')

  try {
    // Create test users
    console.log('Creating test users...')
    const testUsers: NewUser[] = [
      {
        guestId: 'facilitator-001',
        displayName: 'Alice (Facilitator)',
      },
      {
        guestId: 'participant-001',
        displayName: 'Bob',
      },
      {
        guestId: 'participant-002',
        displayName: 'Charlie',
      },
      {
        guestId: 'participant-003',
        displayName: 'Diana',
      },
    ]

    const createdUsers = await db.insert(users).values(testUsers).returning()
    console.log(`✅ Created ${createdUsers.length} test users`)

    // Create test rooms with different templates
    console.log('Creating test rooms...')
    const testRooms: NewRoom[] = [
      {
        name: 'Sprint 23 Retrospective',
        description: 'End of sprint retrospective for the development team',
        facilitatorCode: generateCode(8),
        participantCode: generateCode(6),
        currentPhase: 'setup',
        maxVotesPerUser: 3,
        isActive: true,
      },
      {
        name: 'Q1 Team Retro',
        description: 'Quarterly team retrospective session',
        facilitatorCode: generateCode(8),
        participantCode: generateCode(6),
        currentPhase: 'writing',
        maxVotesPerUser: 5,
        isActive: true,
      },
      {
        name: 'Project Kickoff Retro',
        description: 'Retrospective for project planning phase',
        facilitatorCode: generateCode(8),
        participantCode: generateCode(6),
        currentPhase: 'setup',
        maxVotesPerUser: 3,
        isActive: false,
      },
    ]

    const createdRooms = await db.insert(rooms).values(testRooms).returning()
    console.log(`✅ Created ${createdRooms.length} test rooms`)

    // Add room participants
    console.log('Adding room participants...')
    const facilitator = createdUsers[0] // Alice
    const participants = createdUsers.slice(1) // Bob, Charlie, Diana

    const roomParticipantData: NewRoomParticipant[] = []

    // Add facilitator to all rooms
    for (const room of createdRooms) {
      roomParticipantData.push({
        roomId: room.id,
        userId: facilitator!.id,
        role: 'facilitator',
      })
    }

    // Add participants to first two rooms
    for (const participant of participants) {
      // Add to first room
      roomParticipantData.push({
        roomId: createdRooms[0]!.id,
        userId: participant.id,
        role: 'participant',
      })

      // Add first two participants to second room
      if (participant.id !== participants[2]!.id) {
        roomParticipantData.push({
          roomId: createdRooms[1]!.id,
          userId: participant.id,
          role: 'participant',
        })
      }
    }

    await db.insert(roomParticipants).values(roomParticipantData)
    console.log(`✅ Added ${roomParticipantData.length} room participants`)

    // Create columns for each room using different templates
    console.log('Creating columns with different templates...')
    const columnData: NewColumn[] = []

    // Room 1: Classic template
    const classicColumns = retroTemplates.classic.map((col, index) => ({
      roomId: createdRooms[0]!.id,
      title: col.title,
      description: col.description,
      color: col.color,
      sortOrder: index,
    }))
    columnData.push(...classicColumns)

    // Room 2: Start/Stop/Continue template
    const sscColumns = retroTemplates.startStopContinue.map((col, index) => ({
      roomId: createdRooms[1]!.id,
      title: col.title,
      description: col.description,
      color: col.color,
      sortOrder: index,
    }))
    columnData.push(...sscColumns)

    // Room 3: Mad/Sad/Glad template
    const msgColumns = retroTemplates.madSadGlad.map((col, index) => ({
      roomId: createdRooms[2]!.id,
      title: col.title,
      description: col.description,
      color: col.color,
      sortOrder: index,
    }))
    columnData.push(...msgColumns)

    await db.insert(columns).values(columnData)
    console.log(`✅ Created ${columnData.length} columns across all rooms`)

    // Print room access codes for testing
    console.log('\n🔑 Room Access Codes:')
    for (const room of createdRooms) {
      console.log(`📋 ${room.name}`)
      console.log(`   Facilitator Code: ${room.facilitatorCode}`)
      console.log(`   Participant Code: ${room.participantCode}`)
      console.log(`   Phase: ${room.currentPhase}`)
      console.log(`   Active: ${room.isActive ? 'Yes' : 'No'}`)
      console.log('')
    }

    console.log('🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding finished')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seeding failed:', error)
      process.exit(1)
    })
}
