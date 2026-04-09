import { and, eq, or, sql } from 'drizzle-orm'
import { Request } from 'express'

import {
  CreateRoomRequest,
  RoomResponse,
  DetailedRoomResponse,
  UpdateRoomPhaseRequest,
  RETRO_TEMPLATES,
} from '@yet-another-retro-tool/shared'
import { db } from '@/database/connection'
import {
  rooms,
  columns,
  users,
  roomParticipants,
  cards,
  cardGroups,
  cardGroupMemberships,
  likes,
} from '@/database/schema'
import { asyncHandler } from '@/middleware/errorHandler'
import { validateFacilitatorRole, validateRoomParticipant } from '@/middleware/auth'
import { CustomResponse } from '@/types/index'
import { generateCode } from '@/utils/codeGenerator'
import { filterRoomResponseByRole, createMinimalRoomResponse, getUserRoleInRoom } from '@/utils/responseFilter'
import { generateRetroExportMarkdown, generateExportFilename, ExportData } from '@/templates/retroExport'

export const createRoom = asyncHandler(async (req: Request, res: CustomResponse<RoomResponse>) => {
  const { name, description, template }: CreateRoomRequest = req.body

  // Validation
  if (!name || !template) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Name and template are required',
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

  // guestId is guaranteed to be available from requireGuestUser middleware
  const guestId = req.guestId!

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

    // Create full room response first
    const fullRoomResponse = {
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
    }

    // Creator is always a facilitator, so return full response with codes
    res.status(201).json({
      success: true,
      data: fullRoomResponse,
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


export const getRoomById = asyncHandler(async (req: Request, res: CustomResponse<DetailedRoomResponse>) => {
  const { id } = req.params

  if (!id) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Room ID is required',
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

    // Authentication and room participation guaranteed by middleware
    const currentUserId = req.userId!

    // Load vote information based on current phase
    let voteData: {
      cardVotes: Map<string, { total: number; userVotes: number }>
      groupVotes: Map<string, { total: number; userVotes: number }>
      participantVotes: Map<string, { used: number; remaining: number }>
    } = {
      cardVotes: new Map(),
      groupVotes: new Map(),
      participantVotes: new Map(),
    }

    if (room.currentPhase === 'voting' || room.currentPhase === 'discussing') {
      // Get all votes for cards and groups in this room
      const allVotes = await db.query.likes.findMany({
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
      const roomVotes = allVotes.filter((vote) => {
        const roomIdFromVote = vote.card?.column?.roomId || vote.group?.column?.roomId
        return roomIdFromVote === room.id
      })

      // Build vote counts for cards
      const cardVoteCounts = new Map<string, number>()
      const userCardVotes = new Map<string, number>()

      // Build vote counts for groups
      const groupVoteCounts = new Map<string, number>()
      const userGroupVotes = new Map<string, number>()

      roomVotes.forEach((vote) => {
        if (vote.cardId) {
          cardVoteCounts.set(vote.cardId, (cardVoteCounts.get(vote.cardId) || 0) + 1)
          if (vote.userId === currentUserId) {
            userCardVotes.set(vote.cardId, (userCardVotes.get(vote.cardId) || 0) + 1)
          }
        }

        if (vote.groupId) {
          groupVoteCounts.set(vote.groupId, (groupVoteCounts.get(vote.groupId) || 0) + 1)
          if (vote.userId === currentUserId) {
            userGroupVotes.set(vote.groupId, (userGroupVotes.get(vote.groupId) || 0) + 1)
          }
        }
      })

      // Build participant vote summaries
      if (room.currentPhase === 'voting') {
        const participantVoteCounts = new Map<string, number>()
        roomVotes.forEach((vote) => {
          participantVoteCounts.set(vote.userId, (participantVoteCounts.get(vote.userId) || 0) + 1)
        })

        room.participants.forEach((participant) => {
          const used = participantVoteCounts.get(participant.user.id) || 0
          const remaining = room.maxVotesPerUser - used
          voteData.participantVotes.set(participant.user.id, { used, remaining })
        })
      }

      // Store vote data
      cardVoteCounts.forEach((total, cardId) => {
        voteData.cardVotes.set(cardId, {
          total,
          userVotes: userCardVotes.get(cardId) || 0,
        })
      })

      groupVoteCounts.forEach((total, groupId) => {
        voteData.groupVotes.set(groupId, {
          total,
          userVotes: userGroupVotes.get(groupId) || 0,
        })
      })
    }

    // Build the full room response first
    const fullRoomResponse: DetailedRoomResponse = {
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
        cards: col.cards.map((card) => {
          const cardVoteInfo = voteData.cardVotes.get(card.id)
          return {
            id: card.id,
            content: card.content,
            isAnonymous: card.isAnonymous,
            authorName: card.isAnonymous ? undefined : card.author.displayName,
            sortOrder: card.sortOrder,
            createdAt: card.createdAt.toISOString(),
            // Add CardDetailResponse specific fields
            columnId: card.columnId,
            updatedAt: card.updatedAt.toISOString(),
            // Add ownership flag for frontend (only if currentUserId is available)
            ...(currentUserId && { isOwner: currentUserId === card.authorId }),
            // Add vote information based on phase
            ...(room.currentPhase === 'discussing' && {
              voteCount: cardVoteInfo?.total || 0,
            }),
            ...(room.currentPhase === 'voting' && cardVoteInfo && { userVotes: cardVoteInfo.userVotes }),
          }
        }),
        cardGroups: col.cardGroups.map((group) => {
          const groupVoteInfo = voteData.groupVotes.get(group.id)
          return {
            id: group.id,
            columnId: group.columnId,
            title: group.title,
            description: group.description || null,
            sortOrder: group.sortOrder,
            createdAt: group.createdAt.toISOString(),
            updatedAt: group.updatedAt.toISOString(),
            // Add vote information based on phase
            ...(room.currentPhase === 'discussing' && {
              voteCount: groupVoteInfo?.total || 0,
            }),
            ...(room.currentPhase === 'voting' && groupVoteInfo && { userVotes: groupVoteInfo.userVotes }),
            cards: group.cardMemberships.map((membership) => ({
              id: membership.card.id,
              columnId: membership.card.columnId,
              content: membership.card.content,
              isAnonymous: membership.card.isAnonymous,
              sortOrder: membership.card.sortOrder,
              createdAt: membership.card.createdAt.toISOString(),
              updatedAt: membership.card.updatedAt.toISOString(),
              // Add ownership flag for frontend (only if currentUserId is available)
              ...(currentUserId && { isOwner: currentUserId === membership.card.authorId }),
              // Cards in groups don't show individual vote counts
            })),
          }
        }),
      })),
      participants: room.participants.map((p) => {
        const participantVoteInfo = voteData.participantVotes.get(p.user.id)
        return {
          id: p.user.id,
          displayName: p.user.displayName,
          role: p.role,
          joinedAt: p.joinedAt.toISOString(),
          // Add vote information during voting phase
          ...(room.currentPhase === 'voting' &&
            participantVoteInfo && {
              votesUsed: participantVoteInfo.used,
              votesRemaining: participantVoteInfo.remaining,
            }),
        }
      }),
      createdAt: room.createdAt.toISOString(),
    }

    // Determine user role and apply filtering
    const userRole = getUserRoleInRoom(currentUserId, fullRoomResponse.participants)
    const filteredResponse = filterRoomResponseByRole(fullRoomResponse, userRole)

    res.json({
      success: true,
      data: filteredResponse,
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

export const validateRoomCode = asyncHandler(async (req: Request, res: CustomResponse) => {
  const { code } = req.params

  // Validation
  if (!code) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Code is required',
    })
    return
  }

  try {
    // Check if room exists with this participant code
    const room = await db.query.rooms.findFirst({
      where: and(
        eq(rooms.participantCode, code),
        eq(rooms.isActive, true)
      ),
      columns: {
        id: true,
        name: true,
        currentPhase: true
      }
    })

    if (!room) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Room not found or inactive'
      })
      return
    }

    res.json({
      success: true,
      data: {
        exists: true,
        roomName: room.name,
        currentPhase: room.currentPhase
      },
      message: 'Room found'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to validate room code'
    })
  }
})

export const getRoomByCode = asyncHandler(async (req: Request, res: CustomResponse<DetailedRoomResponse>) => {
  const { code } = req.params
  const currentUserId = req.userId!

  if (!code) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Room code is required',
    })
    return
  }

  try {
    // Find room by participant code (not facilitator code for security)
    let roomForVerification = await db.query.rooms.findFirst({
      where: eq(rooms.participantCode, code),
    })

    if (!roomForVerification || !roomForVerification.isActive) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Room not found or inactive',
      })
      return
    }

    // Check if user is already a participant
    const existingParticipant = await db.query.roomParticipants.findFirst({
      where: and(eq(roomParticipants.roomId, roomForVerification.id), eq(roomParticipants.userId, currentUserId)),
    })

    // Auto-join as participant if not already joined
    if (!existingParticipant) {
      await db.insert(roomParticipants).values({
        roomId: roomForVerification.id,
        userId: currentUserId,
        role: 'participant',
        joinedAt: new Date(),
      })
    }

    // Reload room data to include the new participant
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, roomForVerification.id),
      with: {
        columns: {
          orderBy: [columns.sortOrder],
          with: {
            cards: {
              orderBy: [cards.sortOrder],
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
      throw new Error('Room not found after joining')
    }

    // Load vote information based on current phase (same logic as getRoomById)
    let voteData: {
      cardVotes: Map<string, { total: number; userVotes: number }>
      groupVotes: Map<string, { total: number; userVotes: number }>
      participantVotes: Map<string, { used: number; remaining: number }>
    } = {
      cardVotes: new Map(),
      groupVotes: new Map(),
      participantVotes: new Map(),
    }

    if (room.currentPhase === 'voting' || room.currentPhase === 'discussing') {
      // Get all votes for cards and groups in this room
      const allVotes = await db.query.likes.findMany({
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
      const roomVotes = allVotes.filter((vote) => {
        const roomIdFromVote = vote.card?.column?.roomId || vote.group?.column?.roomId
        return roomIdFromVote === room.id
      })

      // Build vote counts for cards
      const cardVoteCounts = new Map<string, number>()
      const userCardVotes = new Map<string, number>()

      // Build vote counts for groups
      const groupVoteCounts = new Map<string, number>()
      const userGroupVotes = new Map<string, number>()

      roomVotes.forEach((vote) => {
        if (vote.cardId) {
          cardVoteCounts.set(vote.cardId, (cardVoteCounts.get(vote.cardId) || 0) + 1)
          if (vote.userId === currentUserId) {
            userCardVotes.set(vote.cardId, (userCardVotes.get(vote.cardId) || 0) + 1)
          }
        }

        if (vote.groupId) {
          groupVoteCounts.set(vote.groupId, (groupVoteCounts.get(vote.groupId) || 0) + 1)
          if (vote.userId === currentUserId) {
            userGroupVotes.set(vote.groupId, (userGroupVotes.get(vote.groupId) || 0) + 1)
          }
        }
      })

      // Build participant vote summaries
      if (room.currentPhase === 'voting') {
        const participantVoteCounts = new Map<string, number>()
        roomVotes.forEach((vote) => {
          participantVoteCounts.set(vote.userId, (participantVoteCounts.get(vote.userId) || 0) + 1)
        })

        room.participants.forEach((participant) => {
          const used = participantVoteCounts.get(participant.user.id) || 0
          const remaining = room.maxVotesPerUser - used
          voteData.participantVotes.set(participant.user.id, { used, remaining })
        })
      }

      // Store vote data
      cardVoteCounts.forEach((total, cardId) => {
        voteData.cardVotes.set(cardId, {
          total,
          userVotes: userCardVotes.get(cardId) || 0,
        })
      })

      groupVoteCounts.forEach((total, groupId) => {
        voteData.groupVotes.set(groupId, {
          total,
          userVotes: userGroupVotes.get(groupId) || 0,
        })
      })
    }

    // Build the full room response (same logic as getRoomById)
    const fullRoomResponse: DetailedRoomResponse = {
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
        cards: col.cards.map((card) => {
          const cardVoteInfo = voteData.cardVotes.get(card.id)
          return {
            id: card.id,
            content: card.content,
            isAnonymous: card.isAnonymous,
            authorName: card.isAnonymous ? undefined : card.author.displayName,
            sortOrder: card.sortOrder,
            createdAt: card.createdAt.toISOString(),
            // Add CardDetailResponse specific fields
            columnId: card.columnId,
            updatedAt: card.updatedAt.toISOString(),
            // Add ownership flag for frontend (only if currentUserId is available)
            ...(currentUserId && { isOwner: currentUserId === card.authorId }),
            // Add vote information based on phase
            ...(room.currentPhase === 'discussing' && {
              voteCount: cardVoteInfo?.total || 0,
            }),
            ...(room.currentPhase === 'voting' && cardVoteInfo && { userVotes: cardVoteInfo.userVotes }),
          }
        }),
        cardGroups: col.cardGroups.map((group) => {
          const groupVoteInfo = voteData.groupVotes.get(group.id)
          return {
            id: group.id,
            columnId: group.columnId,
            title: group.title,
            description: group.description || null,
            sortOrder: group.sortOrder,
            createdAt: group.createdAt.toISOString(),
            updatedAt: group.updatedAt.toISOString(),
            // Add vote information based on phase
            ...(room.currentPhase === 'discussing' && {
              voteCount: groupVoteInfo?.total || 0,
            }),
            ...(room.currentPhase === 'voting' && groupVoteInfo && { userVotes: groupVoteInfo.userVotes }),
            cards: group.cardMemberships.map((membership) => ({
              id: membership.card.id,
              columnId: membership.card.columnId,
              content: membership.card.content,
              isAnonymous: membership.card.isAnonymous,
              sortOrder: membership.card.sortOrder,
              createdAt: membership.card.createdAt.toISOString(),
              updatedAt: membership.card.updatedAt.toISOString(),
              // Add ownership flag for frontend (only if currentUserId is available)
              ...(currentUserId && { isOwner: currentUserId === membership.card.authorId }),
              // Cards in groups don't show individual vote counts
            })),
          }
        }),
      })),
      participants: room.participants.map((p) => {
        const participantVoteInfo = voteData.participantVotes.get(p.user.id)
        return {
          id: p.user.id,
          displayName: p.user.displayName,
          role: p.role,
          joinedAt: p.joinedAt.toISOString(),
          // Add vote information during voting phase
          ...(room.currentPhase === 'voting' &&
            participantVoteInfo && {
              votesUsed: participantVoteInfo.used,
              votesRemaining: participantVoteInfo.remaining,
            }),
        }
      }),
      createdAt: room.createdAt.toISOString(),
    }

    // Determine user role and apply filtering
    const userRole = getUserRoleInRoom(currentUserId, fullRoomResponse.participants)
    const filteredResponse = filterRoomResponseByRole(fullRoomResponse, userRole)

    res.json({
      success: true,
      data: filteredResponse,
      message: 'Room loaded successfully',
    })
  } catch (error) {
    console.error('Error loading room by code:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to load room',
    })
  }
})

export const updateRoomPhase = asyncHandler(async (req: Request, res: CustomResponse<Partial<RoomResponse>>) => {
  const { id } = req.params
  const { phase }: UpdateRoomPhaseRequest = req.body

  if (!id || !phase) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Room ID and phase are required',
    })
    return
  }

  try {
    // Facilitator role already validated by requireFacilitator middleware

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

    // Phase updates don't need to return codes or full room data
    res.json({
      success: true,
      data: {
        id: updatedRoom.id,
        name: updatedRoom.name,
        description: updatedRoom.description || undefined,
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

export const exportRoom = asyncHandler(async (req: Request, res: CustomResponse<never>) => {
  const { id } = req.params

  if (!id) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Room ID is required',
    })
    return
  }

  try {
    // Load room with all related data using same pattern as getRoomById
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, id),
      with: {
        columns: {
          orderBy: [columns.sortOrder],
          with: {
            cards: {
              orderBy: [cards.sortOrder],
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

    if (room.currentPhase !== 'discussing') {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Room is not in discussion phase',
      })
      return
    }

    // Load vote information for discussion phase display
    let voteData: {
      cardVotes: Map<string, { total: number; userVotes: number }>
      groupVotes: Map<string, { total: number; userVotes: number }>
    } = {
      cardVotes: new Map(),
      groupVotes: new Map(),
    }

    // Always load vote data for export (to show vote counts regardless of phase)
    const allVotes = await db.query.likes.findMany({
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
    const roomVotes = allVotes.filter((vote) => {
      const roomIdFromVote = vote.card?.column?.roomId || vote.group?.column?.roomId
      return roomIdFromVote === room.id
    })

    // Build vote counts for cards and groups
    const cardVoteCounts = new Map<string, number>()
    const groupVoteCounts = new Map<string, number>()

    roomVotes.forEach((vote) => {
      if (vote.cardId) {
        cardVoteCounts.set(vote.cardId, (cardVoteCounts.get(vote.cardId) || 0) + 1)
      }
      if (vote.groupId) {
        groupVoteCounts.set(vote.groupId, (groupVoteCounts.get(vote.groupId) || 0) + 1)
      }
    })

    // Store vote data
    cardVoteCounts.forEach((total, cardId) => {
      voteData.cardVotes.set(cardId, { total, userVotes: 0 })
    })
    groupVoteCounts.forEach((total, groupId) => {
      voteData.groupVotes.set(groupId, { total, userVotes: 0 })
    })

    // Build the room response with vote counts (similar to discussion phase)
    const roomResponse: DetailedRoomResponse = {
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
        cards: col.cards.map((card) => {
          const cardVoteInfo = voteData.cardVotes.get(card.id)
          return {
            id: card.id,
            content: card.content,
            isAnonymous: card.isAnonymous,
            authorName: card.isAnonymous ? undefined : card.author.displayName,
            sortOrder: card.sortOrder,
            createdAt: card.createdAt.toISOString(),
            columnId: card.columnId,
            authorId: card.authorId,
            updatedAt: card.updatedAt.toISOString(),
            voteCount: cardVoteInfo?.total || 0,
          }
        }),
        cardGroups: col.cardGroups.map((group) => {
          const groupVoteInfo = voteData.groupVotes.get(group.id)
          return {
            id: group.id,
            columnId: group.columnId,
            title: group.title,
            description: group.description || null,
            sortOrder: group.sortOrder,
            createdAt: group.createdAt.toISOString(),
            updatedAt: group.updatedAt.toISOString(),
            voteCount: groupVoteInfo?.total || 0,
            cards: group.cardMemberships.map((membership) => ({
              id: membership.card.id,
              columnId: membership.card.columnId,
              authorId: membership.card.authorId,
              content: membership.card.content,
              isAnonymous: membership.card.isAnonymous,
              authorName: membership.card.isAnonymous ? undefined : membership.card.author.displayName,
              sortOrder: membership.card.sortOrder,
              createdAt: membership.card.createdAt.toISOString(),
              updatedAt: membership.card.updatedAt.toISOString(),
            })),
          }
        }),
      })),
      participants: room.participants.map((p) => ({
        id: p.user.id,
        displayName: p.user.displayName,
        role: p.role,
        joinedAt: p.joinedAt.toISOString(),
      })),
      createdAt: room.createdAt.toISOString(),
    }

    // Generate export data
    const exportDate = new Date().toISOString()
    const exportData: ExportData = {
      room: roomResponse,
      exportDate,
    }

    // Generate markdown content
    const markdownContent = generateRetroExportMarkdown(exportData)
    const filename = generateExportFilename(room.name, exportDate)

    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', Buffer.byteLength(markdownContent, 'utf8'))

    // Send the markdown content
    res.send(markdownContent)
  } catch (error) {
    console.error('Error exporting room:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to export room',
    })
  }
})
