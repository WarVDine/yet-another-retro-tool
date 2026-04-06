import { Request, Response } from 'express'
import { CustomResponse } from '@/types'

export const getHealth = (req: Request, res: CustomResponse): void => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  }

  res.status(200).json({
    success: true,
    data: healthCheck,
    message: 'Health check successful',
  })
}