import { Request } from 'express'
import { db } from '@/database/connection'
import { rooms, columns, users, roomParticipants } from '@/database/schema'
import { CreateRoomRequest, RoomResponse, CustomResponse } from '@/types/index'
import { asyncHandler } from '@/middleware/errorHandler'
import { generateCode } from '@/utils/codeGenerator'
import { RETRO_TEMPLATES } from '@/constants/templates'

export const createRoom = asyncHandler(
  async (req: Request, res: CustomResponse<RoomResponse>) => {
    const { name, description, template, facilitatorName }: CreateRoomRequest = req.body
    
    // Validation
    if (!name || !template || !facilitatorName) {
      res.status(400).json({
        success: false,
        error: 'Name, template, and facilitator name are required',
      })
      return
    }

    // Validate template exists
    if (!(template in RETRO_TEMPLATES)) {
      res.status(400).json({
        success: false,
        error: 'Invalid template selected',
      })
      return
    }

    // Generate unique codes
    const facilitatorCode = generateCode(8)
    const participantCode = generateCode(6)
    
    try {
      // Create room, user, columns, and participant in transaction
      const result = await db.transaction(async (tx) => {
        // Create room
        const roomResult = await tx.insert(rooms).values({
          name,
          ...(description && { description }),
          facilitatorCode,
          participantCode
        }).returning()

        if (!roomResult.length) {
          throw new Error('Failed to create room')
        }
        const room = roomResult[0]!

        // Create facilitator user
        const facilitatorResult = await tx.insert(users).values({
          guestId: `facilitator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          displayName: facilitatorName
        }).returning()

        if (!facilitatorResult.length) {
          throw new Error('Failed to create facilitator user')
        }
        const facilitator = facilitatorResult[0]!

        // Add facilitator as room participant
        await tx.insert(roomParticipants).values({
          roomId: room.id,
          userId: facilitator.id,
          role: 'facilitator'
        })

        // Create columns from template
        const templateColumns = RETRO_TEMPLATES[template as keyof typeof RETRO_TEMPLATES]
        const columnData = templateColumns.map((col, index) => ({
          roomId: room.id,
          title: col.title,
          description: col.description,
          color: col.color,
          sortOrder: index
        }))
        
        const createdColumns = await tx.insert(columns).values(columnData).returning()

        return { room, columns: createdColumns }
      })

      res.status(201).json({
        success: true,
        data: {
          id: result.room.id,
          name: result.room.name,
          description: result.room.description || undefined,
          facilitatorCode: result.room.facilitatorCode,
          participantCode: result.room.participantCode,
          currentPhase: result.room.currentPhase,
          maxVotesPerUser: result.room.maxVotesPerUser,
          columns: result.columns.map(col => ({
            id: col.id,
            title: col.title,
            description: col.description || undefined,
            color: col.color,
            sortOrder: col.sortOrder
          })),
          createdAt: result.room.createdAt.toISOString()
        },
        message: 'Room created successfully'
      })
    } catch (error) {
      console.error('Error creating room:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create room',
        message: 'An error occurred while creating the room'
      })
    }
  }
)