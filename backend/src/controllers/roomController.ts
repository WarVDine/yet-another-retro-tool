import { and, eq, or } from 'drizzle-orm'
import { Request } from 'express'

import {
  CreateRoomRequest,
  RoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  DetailedRoomResponse,
  UpdateRoomPhaseRequest,
  RETRO_TEMPLATES,
} from '@yet-another-retro-tool/shared'
import { db } from '@/database/connection'
import { rooms, columns, users, roomParticipants, cards, cardGroups, cardGroupMemberships } from '@/database/schema'
import { asyncHandler } from '@/middleware/errorHandler'
import { validateFacilitatorRole, validateRoomParticipant } from '@/middleware/auth'
import { CustomResponse } from '@/types/index'
import { generateCode } from '@/utils/codeGenerator'

export const createRoom = asyncHandler(async (req: Request, res: CustomResponse<RoomResponse>) => {
  const { name, description, template, guestId }: CreateRoomRequest = req.body

  // Validation
  if (!name || !template || !guestId) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Name, template, and guest ID are required',
    })
    return
  }

  // Validate template exists
  if (!(template in RETRO_TEMPLATES)) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid template selected',
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
      const roomResult = await tx
        .insert(rooms)
        .values({
          name,
          ...(description && { description }),
          facilitatorCode,
          participantCode,
        })
        .returning()

      if (!roomResult.length) {
        throw new Error('Failed to create room')
      }
      const room = roomResult[0]!

      // Find facilitator user by guest ID
      const facilitator = await tx.query.users.findFirst({
        where: eq(users.guestId, guestId),
      })

      if (!facilitator) {
        throw new Error('Guest user not found. Please create guest user first.')
      }

      // Add facilitator as room participant
      await tx.insert(roomParticipants).values({
        roomId: room.id,
        userId: facilitator.id,
        role: 'facilitator',
      })

      // Create columns from template
      const templateColumns = RETRO_TEMPLATES[template as keyof typeof RETRO_TEMPLATES]
      const columnData = templateColumns.map((col, index) => ({
        roomId: room.id,
        title: col.title,
        description: col.description,
        color: col.color,
        sortOrder: index,
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
        columns: result.columns.map((col) => ({
          id: col.id,
          title: col.title,
          description: col.description || undefined,
          color: col.color,
          sortOrder: col.sortOrder,
        })),
        createdAt: result.room.createdAt.toISOString(),
      },
      message: 'Room created successfully',
    })
  } catch (error) {
    console.error('Error creating room:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create room',
    })
  }
})

export const joinRoom = asyncHandler(async (req: Request, res: CustomResponse<JoinRoomResponse>) => {
  const { code, guestId }: JoinRoomRequest = req.body

  // Validation
  if (!code || !guestId) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Code and guest ID are required',
    })
    return
  }

  try {
    // Find room by either facilitator or participant code
    const room = await db.query.rooms.findFirst({
      where: or(eq(rooms.facilitatorCode, code), eq(rooms.participantCode, code)),
    })

    if (!room || !room.isActive) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Room not found or inactive',
      })
      return
    }

    // Determine role based on which code was used
    const role = room.facilitatorCode === code ? 'facilitator' : 'participant'

    // Handle user lookup and room participation in transaction
    const result = await db.transaction(async (tx) => {
      // Find user by guest ID
      const user = await tx.query.users.findFirst({
        where: eq(users.guestId, guestId),
      })

      if (!user) {
        throw new Error('Guest user not found. Please create guest user first.')
      }

      // Add as room participant - if the user is already a participant, update the role
      await tx
        .insert(roomParticipants)
        .values({
          roomId: room.id,
          userId: user.id,
          role,
        })
        .onConflictDoUpdate({
          target: [roomParticipants.roomId, roomParticipants.userId],
          set: {
            role,
          },
        })

      return { user }
    })

    res.json({
      success: true,
      data: {
        roomId: room.id,
        role,
        participantId: result.user.id,
      },
      message: 'Successfully joined room',
    })
  } catch (error) {
    console.error('Error joining room:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to join room',
    })
  }
})

export const getRoomById = asyncHandler(async (req: Request, res: CustomResponse<DetailedRoomResponse>) => {
  const { id } = req.params
  const { guestId } = req.query as { guestId?: string }

  if (!id) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Room ID is required',
    })
    return
  }

  try {
    // Resolve current user if guestId is provided (for ownership flags)
    let currentUserId: string | null = null
    if (guestId) {
      try {
        const user = await db.query.users.findFirst({
          where: eq(users.guestId, guestId),
        })
        currentUserId = user?.id || null
      } catch (error) {
        // If guest ID is invalid, continue without ownership flags
        console.warn('Invalid guest ID provided for room lookup:', guestId)
      }
    }

    // Load room with all related data using Drizzle relations
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, id),
      with: {
        columns: {
          orderBy: [columns.sortOrder],
          with: {
            cards: {
              orderBy: [cards.sortOrder], // Fix: use cards.sortOrder instead of columns.sortOrder
              with: {
                author: true,
              },
            },
            cardGroups: {
              orderBy: [cardGroups.sortOrder],
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
            },
          },
        },
        participants: {
          with: {
            user: true,
          },
        },
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

    // Validate participant access if guestId is provided
    if (guestId && currentUserId) {
      const isParticipant = await validateRoomParticipant(currentUserId, room.id)
      if (!isParticipant) {
        res.status(403).json({
          success: false,
          error: 'Authorization Error',
          message: 'You must be a room participant to access this room',
        })
        return
      }
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
        columns: room.columns.map((col) => ({
          id: col.id,
          title: col.title,
          description: col.description || undefined,
          color: col.color,
          sortOrder: col.sortOrder,
          cards: col.cards.map((card) => ({
            id: card.id,
            content: card.content,
            isAnonymous: card.isAnonymous,
            authorName: card.isAnonymous ? undefined : card.author.displayName,
            sortOrder: card.sortOrder,
            createdAt: card.createdAt.toISOString(),
            // Add CardDetailResponse specific fields
            columnId: card.columnId,
            authorId: card.authorId,
            updatedAt: card.updatedAt.toISOString(),
            // Add ownership flag for frontend (only if currentUserId is available)
            ...(currentUserId && { isOwner: currentUserId === card.authorId }),
          })),
          cardGroups: col.cardGroups.map((group) => ({
            id: group.id,
            columnId: group.columnId,
            title: group.title,
            description: group.description || null,
            sortOrder: group.sortOrder,
            createdAt: group.createdAt.toISOString(),
            updatedAt: group.updatedAt.toISOString(),
            cards: group.cardMemberships.map((membership) => ({
              id: membership.card.id,
              columnId: membership.card.columnId,
              authorId: membership.card.authorId,
              content: membership.card.content,
              isAnonymous: membership.card.isAnonymous,
              sortOrder: membership.card.sortOrder,
              createdAt: membership.card.createdAt.toISOString(),
              updatedAt: membership.card.updatedAt.toISOString(),
              // Add ownership flag for frontend (only if currentUserId is available)
              ...(currentUserId && { isOwner: currentUserId === membership.card.authorId }),
            })),
          })),
        })),
        participants: room.participants.map((p) => ({
          id: p.user.id,
          displayName: p.user.displayName,
          role: p.role,
          joinedAt: p.joinedAt.toISOString(),
        })),
        createdAt: room.createdAt.toISOString(),
      },
      message: 'Room loaded successfully',
    })
  } catch (error) {
    console.error('Error loading room:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to load room',
    })
  }
})

export const updateRoomPhase = asyncHandler(async (req: Request, res: CustomResponse<RoomResponse>) => {
  const { id } = req.params
  const { phase, guestId }: UpdateRoomPhaseRequest = req.body

  if (!id || !phase || !guestId) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Room ID, phase, and guest ID are required',
    })
    return
  }

  try {
    // Resolve guest ID to user ID
    const user = await db.query.users.findFirst({
      where: eq(users.guestId, guestId),
    })

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found',
      })
      return
    }

    // Use auth utility function to validate facilitator role
    const isFacilitator = await validateFacilitatorRole(user.id, id)
    if (!isFacilitator) {
      res.status(403).json({
        success: false,
        error: 'Authorization Error',
        message: 'Only facilitators can change room phases',
      })
      return
    }

    // Update the room phase
    const [updatedRoom] = await db
      .update(rooms)
      .set({
        currentPhase: phase,
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, id))
      .returning()

    if (!updatedRoom) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Room not found',
      })
      return
    }

    res.json({
      success: true,
      data: {
        id: updatedRoom.id,
        name: updatedRoom.name,
        description: updatedRoom.description || undefined,
        facilitatorCode: updatedRoom.facilitatorCode,
        participantCode: updatedRoom.participantCode,
        currentPhase: updatedRoom.currentPhase,
        maxVotesPerUser: updatedRoom.maxVotesPerUser,
        columns: [], // Phase updates don't need to return full room data
        createdAt: updatedRoom.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error updating room phase:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update room phase',
    })
  }
})
