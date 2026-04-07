import { Request, Response } from 'express'
import { ApiResponse } from '@/types/index'

export const notFound = (req: Request, res: Response<ApiResponse>): void => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  })
}
