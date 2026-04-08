# Yet Another Retro Tool

A full-stack application for hosting and attending team retrospectives, built with React and Express.js in a monorepo structure.

## 🚀 Quick Start

### Prerequisites

- **Docker runtime** (Docker Desktop OR Colima) installed and running
- **Node.js 18+** and **npm 9+**

### Get Started in 3 Commands

```bash
# 1. Install dependencies
npm run install:all

# 2. Start the database
npm run db:up

# 3. Set up the database
npm run db:migrate && npm run db:seed

# 4. Start the development servers
npm run dev
```

Your app will be running at:

- **Frontend**: <http://localhost:3000>
- **Backend**: <http://localhost:5000>

## 📁 Project Structure

```text
yet-another-retro-tool/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Express.js + TypeScript + Drizzle ORM
├── shared/            # Shared types and utilities
├── docker-compose.yml # PostgreSQL database
└── package.json       # Workspace configuration
```

## 🗄️ Database Management

### Quick Commands

```bash
# Start PostgreSQL database
npm run db:up

# Run migrations (create tables)
npm run db:migrate

# Seed with test data
npm run db:seed

# View database in browser (Drizzle Studio)
npm run db:studio

# Reset database (drop all data and recreate)
npm run db:reset

# Stop database
npm run db:down

# View database logs
npm run db:logs
```

### Schema Changes Workflow

```bash
# 1. Modify schema in backend/src/database/schema.ts
# 2. Generate migration from schema changes
npm run db:generate

# 3. Review the generated migration file
# 4. Apply migration to database
npm run db:migrate

# 5. Verify changes
npm run db:verify
```

### Test Data

After seeding, you'll have 3 test rooms with different retrospective formats:

1. **Sprint 23 Retrospective** (Classic format)
   - What went well?
   - What could be improved?
   - Action items

2. **Q1 Team Retro** (Start/Stop/Continue format)
   - Start doing
   - Stop doing  
   - Continue doing

3. **Project Kickoff Retro** (Mad/Sad/Glad format)
   - Mad
   - Sad
   - Glad

Each room has access codes printed in the console after seeding.

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend

# Building
npm run build           # Build both frontend and backend
npm run build:frontend  # Build only frontend
npm run build:backend   # Build only backend

# Testing
npm run test           # Run tests in all workspaces
npm run test:frontend  # Run frontend tests
npm run test:backend   # Run backend tests

# Linting
npm run lint           # Lint all workspaces
npm run lint:fix       # Fix linting issues

# Cleanup
npm run clean          # Clean all build outputs and node_modules
```

## 🏗️ Technology Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for client-side routing
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Lucide React** for icons

### Backend

- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **PostgreSQL** as the database
- **Helmet** for security headers
- **Morgan** for request logging
- **CORS** for cross-origin requests

### Database Schema

- **Rooms**: Retrospective sessions with access codes
- **Users**: Guest users (no login required)
- **Columns**: Flexible column system (not hardcoded categories)
- **Cards**: Individual thoughts/items
- **Card Groups**: Grouped related cards (2+ cards)
- **Likes**: Voting system with configurable limits per user
- **Phases**: Structured retro flow (setup → writing → grouping → voting → discussing)

### Migration System

- **Drizzle Kit Migrations**: Version-controlled schema changes
- **Automatic Generation**: `npm run db:generate` creates migrations from schema
- **Rollback Support**: Can revert to previous schema versions
- **Team Sync**: All schema changes tracked in git

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL="postgresql://retro_user:retro_password@localhost:5432/retro_db"
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Docker Setup

If using **Colima** instead of Docker Desktop:

```bash
# Start Colima
colima start

# Verify Docker is working
docker ps
```

## 🚨 Troubleshooting

### Port 5432 Already in Use

```bash
# Find what's using the port
lsof -i :5432

# Kill the process or change port in docker-compose.yml
```

### Docker Not Running

```bash
# For Docker Desktop
# Start Docker Desktop application

# For Colima (macOS/Linux)
colima start

# Verify
docker --version
docker-compose --version
```

### Database Connection Issues

```bash
# Check if container is running
docker ps

# View database logs
npm run db:logs

# Connect to database directly
docker exec -it retro-postgres psql -U retro_user -d retro_db
```

### TypeScript Errors

```bash
# Clean and rebuild
npm run clean
npm run install:all
npm run build
```

## 📝 Contributing

1. Install dependencies: `npm run install:all`
2. Start the database: `npm run db:up && npm run db:migrate && npm run db:seed`
3. Start development: `npm run dev`
4. Make your changes
5. Run tests: `npm run test`
6. Run linting: `npm run lint:fix`

## 📄 License

ISC License
