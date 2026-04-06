import { Request, Response } from 'express'
import { 
  CustomResponse, 
  RetroSession, 
  RetroItem,
  CreateRetroSessionDto,
  UpdateRetroSessionDto,
  CreateRetroItemDto,
  UpdateRetroItemDto
} from '@/types'
import { asyncHandler } from '@/middleware/errorHandler'

// Mock data - replace with database operations
let retroSessions: RetroSession[] = [
  {
    id: 'demo',
    title: 'Demo Retrospective',
    description: 'A sample retrospective session',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active',
  },
]

let retroItems: RetroItem[] = [
  {
    id: '1',
    sessionId: 'demo',
    category: 'went_well',
    content: 'Great team collaboration',
    author: 'Team Member',
    votes: 3,
    createdAt: new Date(),
  },
  {
    id: '2',
    sessionId: 'demo',
    category: 'improve',
    content: 'Need better communication tools',
    author: 'Team Member',
    votes: 1,
    createdAt: new Date(),
  },
]

// Retro Session Controllers
export const getRetroSessions = asyncHandler(
  async (req: Request, res: CustomResponse<RetroSession[]>) => {
    res.status(200).json({
      success: true,
      data: retroSessions,
      message: 'Retro sessions retrieved successfully',
    })
  }
)

export const getRetroSession = asyncHandler(
  async (req: Request, res: CustomResponse<RetroSession>) => {
    const { id } = req.params
    const session = retroSessions.find(s => s.id === id)
    
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Retro session not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: session,
      message: 'Retro session retrieved successfully',
    })
  }
)

export const createRetroSession = asyncHandler(
  async (req: Request, res: CustomResponse<RetroSession>) => {
    const { title, description }: CreateRetroSessionDto = req.body
    
    if (!title) {
      res.status(400).json({
        success: false,
        error: 'Title is required',
      })
      return
    }

    const newSession: RetroSession = {
      id: Date.now().toString(),
      title,
      ...(description && { description }),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
    }

    retroSessions.push(newSession)

    res.status(201).json({
      success: true,
      data: newSession,
      message: 'Retro session created successfully',
    })
  }
)

export const updateRetroSession = asyncHandler(
  async (req: Request, res: CustomResponse<RetroSession>) => {
    const { id } = req.params
    const updates: UpdateRetroSessionDto = req.body
    
    const sessionIndex = retroSessions.findIndex(s => s.id === id)
    
    if (sessionIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Retro session not found',
      })
      return
    }

    const updatedSession = retroSessions[sessionIndex]!
    if (updates.title !== undefined) updatedSession.title = updates.title
    if (updates.description !== undefined) updatedSession.description = updates.description
    if (updates.status !== undefined) updatedSession.status = updates.status
    updatedSession.updatedAt = new Date()

    res.status(200).json({
      success: true,
      data: updatedSession,
      message: 'Retro session updated successfully',
    })
  }
)

export const deleteRetroSession = asyncHandler(
  async (req: Request, res: CustomResponse) => {
    const { id } = req.params
    
    const sessionIndex = retroSessions.findIndex(s => s.id === id)
    
    if (sessionIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Retro session not found',
      })
      return
    }

    retroSessions.splice(sessionIndex, 1)
    // Also remove related items
    retroItems = retroItems.filter(item => item.sessionId !== id)

    res.status(200).json({
      success: true,
      message: 'Retro session deleted successfully',
    })
  }
)

// Retro Item Controllers
export const getRetroItems = asyncHandler(
  async (req: Request, res: CustomResponse<RetroItem[]>) => {
    const { sessionId } = req.params
    const items = retroItems.filter(item => item.sessionId === sessionId)

    res.status(200).json({
      success: true,
      data: items,
      message: 'Retro items retrieved successfully',
    })
  }
)

export const createRetroItem = asyncHandler(
  async (req: Request, res: CustomResponse<RetroItem>) => {
    const { sessionId } = req.params
    const { category, content, author }: CreateRetroItemDto = req.body
    
    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required',
      })
      return
    }
    
    if (!category || !content) {
      res.status(400).json({
        success: false,
        error: 'Category and content are required',
      })
      return
    }

    const newItem: RetroItem = {
      id: Date.now().toString(),
      sessionId,
      category,
      content,
      ...(author && { author }),
      votes: 0,
      createdAt: new Date(),
    }

    retroItems.push(newItem)

    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Retro item created successfully',
    })
  }
)

export const updateRetroItem = asyncHandler(
  async (req: Request, res: CustomResponse<RetroItem>) => {
    const { id } = req.params
    const updates: UpdateRetroItemDto = req.body
    
    const itemIndex = retroItems.findIndex(item => item.id === id)
    
    if (itemIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Retro item not found',
      })
      return
    }

    const updatedItem = retroItems[itemIndex]!
    if (updates.content !== undefined) updatedItem.content = updates.content
    if (updates.votes !== undefined) updatedItem.votes = updates.votes

    res.status(200).json({
      success: true,
      data: updatedItem,
      message: 'Retro item updated successfully',
    })
  }
)

export const deleteRetroItem = asyncHandler(
  async (req: Request, res: CustomResponse) => {
    const { id } = req.params
    
    const itemIndex = retroItems.findIndex(item => item.id === id)
    
    if (itemIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Retro item not found',
      })
      return
    }

    retroItems.splice(itemIndex, 1)

    res.status(200).json({
      success: true,
      message: 'Retro item deleted successfully',
    })
  }
)