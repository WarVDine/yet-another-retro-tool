import { Request, Response, NextFunction } from 'express'
import { ApiError } from '@/types/index'

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err)

  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    success: false,
    error: message,
    message: process.env.NODE_ENV === 'development' ? err.stack : message,
  })
}

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
