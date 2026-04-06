import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'

// Load environment variables
config()

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://retro_user:retro_password@localhost:5432/retro_db'
  },
  verbose: true,
  strict: true,
  // Configuration for migration generation
  migrations: {
    prefix: 'timestamp'
  }
})