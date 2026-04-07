import { Request } from 'express'
import { db } from '@/database/connection'
import { rooms, columns, users, roomParticipants, cards } from '@/database/schema'
import { CreateRoomRequest, RoomResponse, JoinRoomRequest, JoinRoomResponse, DetailedRoomResponse, RETRO_TEMPLATES } from '@yet-another-retro-tool/shared'
import { CustomResponse } from '@/types/index'
import { asyncHandler } from '@/middleware/errorHandler'
import { generateCode } from '@/utils/codeGenerator'
import { eq, or } from 'drizzle-orm'

export const createRoom = asyncHandler(
  async (req: Request, res: CustomResponse<RoomResponse>) => {
    const { name, description, template, facilitatorName }: CreateRoomRequest = req.body
    
    // Validation
    if (!name || !template || !facilitatorName) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Name, template, and facilitator name are required'
      })
      return
    }

    // Validate template exists
    if (!(template in RETRO_TEMPLATES)) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid template selected'
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
        error: 'Internal Server Error',
        message: 'Failed to create room'
      })
    }
  }
)

export const joinRoom = asyncHandler(
  async (req: Request, res: CustomResponse<JoinRoomResponse>) => {
    const { code, participantName }: JoinRoomRequest = req.body
    
    // Validation
        if (!code || !participantName) {
          res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'Code and participant name are required'
          })
          return
        }

    try {
      // Find room by either facilitator or participant code
      const room = await db.query.rooms.findFirst({
        where: or(
          eq(rooms.facilitatorCode, code),
          eq(rooms.participantCode, code)
        )
      })
      
          if (!room || !room.isActive) {
            res.status(404).json({
              success: false,
              error: 'Not Found',
              message: 'Room not found or inactive'
            })
            return
          }
      
      // Determine role based on which code was used
      const role = room.facilitatorCode === code ? 'facilitator' : 'participant'
      
      // Create user and add as participant in transaction
      const result = await db.transaction(async (tx) => {
        // Create user
        const userResult = await tx.insert(users).values({
          guestId: `${role}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          displayName: participantName
        }).returning()
        
        if (!userResult.length) {
          throw new Error('Failed to create user')
        }
        const user = userResult[0]!
        
        // Add as room participant (handle existing participant gracefully)
        await tx.insert(roomParticipants).values({
          roomId: room.id,
          userId: user.id,
          role
        }).onConflictDoNothing()
        
        return { user }
      })
      
      res.json({
        success: true,
        data: {
          roomId: room.id,
          role,
          participantId: result.user.id
        },
        message: 'Successfully joined room'
      })
    } catch (error) {
      console.error('Error joining room:', error)
          res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to join room'
          })
    }
  }
)

export const getRoomById = asyncHandler(
  async (req: Request, res: CustomResponse<DetailedRoomResponse>) => {
    const { id } = req.params
    
        if (!id) {
          res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'Room ID is required'
          })
          return
        }

    try {
      // Load room with all related data using Drizzle relations
      const room = await db.query.rooms.findFirst({
        where: eq(rooms.id, id),
        with: {
          columns: {
            orderBy: [columns.sortOrder],
            with: {
              cards: {
                orderBy: [columns.sortOrder],
                with: {
                  author: true
                }
              }
            }
          },
          participants: {
            with: {
              user: true
            }
          }
        }
      })
      
          if (!room) {
            res.status(404).json({
              success: false,
              error: 'Not Found',
              message: 'Room not found'
            })
            return
          }
      
      res.json({
        success: true,
        data: {
          id: room.id,
          name: room.name,
          description: room.description || undefined,
          facilitatorCode: room.facilitatorCode,
          participantCode: room.participantCode,
          currentPhase: room.currentPhase,
          maxVotesPerUser: room.maxVotesPerUser,
          isActive: room.isActive,
          columns: room.columns.map(col => ({
            id: col.id,
            title: col.title,
            description: col.description || undefined,
            color: col.color,
            sortOrder: col.sortOrder,
            cards: col.cards.map(card => ({
              id: card.id,
              content: card.content,
              isAnonymous: card.isAnonymous,
              authorName: card.isAnonymous ? undefined : card.author.displayName,
              sortOrder: card.sortOrder,
              createdAt: card.createdAt.toISOString()
            }))
          })),
          participants: room.participants.map(p => ({
            id: p.user.id,
            displayName: p.user.displayName,
            role: p.role,
            joinedAt: p.joinedAt.toISOString()
          })),
          createdAt: room.createdAt.toISOString()
        },
        message: 'Room loaded successfully'
      })
    } catch (error) {
      console.error('Error loading room:', error)
          res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to load room'
          })
    }
  }
)