import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema'

// Load environment variables
config()

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Create Drizzle database instance
export const db = drizzle(pool, { schema })

// Health check function
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
export const closeDatabaseConnection = async (): Promise<void> => {
  await pool.end()
}

// Export pool for direct access if needed
export { pool }
