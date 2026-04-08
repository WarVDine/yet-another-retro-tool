import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables
config()

async function runMigrations() {
  console.log('🚀 Running database migrations...')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.NODE_ENV === 'production' ? { 
      require: true,
      rejectUnauthorized: false 
    } : false,
  })

  const db = drizzle(pool)

  try {
    // Use absolute path that works in production
    const migrationsFolder = path.join(__dirname, 'migrations')
    await migrate(db, { migrationsFolder })
    console.log('✅ Migrations completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration process finished')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration process failed:', error)
      process.exit(1)
    })
}
