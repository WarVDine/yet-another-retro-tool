import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import { errorHandler } from '@/middleware/errorHandler'
import { notFound } from '@/middleware/notFound'
import { cardRouter } from '@/routes/cards'
import { healthRouter } from '@/routes/health'
import { roomRouter } from '@/routes/rooms'
import { userRouter } from '@/routes/users'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'
const API_PREFIX = process.env.API_PREFIX || '/api'

// Security middleware
app.use(helmet())
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}))

// Logging middleware
app.use(morgan('combined'))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes
app.use(`${API_PREFIX}/cards`, cardRouter)
app.use(`${API_PREFIX}/health`, healthRouter)
app.use(`${API_PREFIX}/rooms`, roomRouter)
app.use(`${API_PREFIX}/users`, userRouter)

// Error handling middleware (must be last)
app.use(notFound)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 API available at http://localhost:${PORT}${API_PREFIX}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export { app }
