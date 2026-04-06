# Yet Another Retro Tool

A full-stack application to host and attend retrospectives in a team. Built with React (frontend), Express.js (backend), and TypeScript throughout.

## 🏗️ Project Structure

This is a monorepo containing three main packages:

```
yet-another-retro-tool/
├── package.json              # Root workspace configuration
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/           # Page components (routing)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Frontend utilities
│   │   ├── types/           # Frontend-specific types
│   │   └── assets/          # Static assets
│   ├── public/              # Public static files
│   ├── package.json         # Frontend dependencies
│   └── vite.config.ts       # Vite configuration
├── backend/                  # Express.js + TypeScript API
│   ├── src/
│   │   ├── routes/          # API route definitions
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Backend utilities
│   │   ├── types/           # Backend-specific types
│   │   └── config/          # Configuration files
│   ├── package.json         # Backend dependencies
│   └── tsconfig.json        # TypeScript configuration
├── shared/                   # Shared types and utilities
│   ├── src/
│   │   ├── types/           # Shared TypeScript types
│   │   ├── constants/       # Shared constants
│   │   └── utils/           # Shared utility functions
│   ├── package.json         # Shared package dependencies
│   └── tsconfig.json        # TypeScript configuration
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd yet-another-retro-tool
```

2. Install all dependencies:
```bash
npm run install:all
```

This will install dependencies for the root workspace and all sub-packages.

### Development

#### Start both frontend and backend simultaneously:
```bash
npm run dev
```

This will start:
- Frontend development server at `http://localhost:3000`
- Backend API server at `http://localhost:5000`

#### Start individual services:
```bash
# Frontend only
npm run dev:frontend

# Backend only  
npm run dev:backend
```

### Building for Production

#### Build all packages:
```bash
npm run build
```

#### Build individual packages:
```bash
npm run build:frontend
npm run build:backend
```

### Testing

#### Run all tests:
```bash
npm run test
```

#### Run tests for specific packages:
```bash
npm run test:frontend
npm run test:backend
```

### Linting

#### Lint all packages:
```bash
npm run lint
```

#### Fix linting issues:
```bash
npm run lint:fix
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library with hooks and functional components
- **Vite** - Fast build tool and development server
- **TypeScript** - Type safety and better developer experience
- **React Router** - Client-side routing
- **CSS Modules** - Scoped styling

### Backend
- **Express.js** - Web application framework
- **TypeScript** - Type safety for Node.js
- **Node.js** - JavaScript runtime
- **Morgan** - HTTP request logging
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Development Tools
- **Concurrently** - Run multiple commands simultaneously
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Backend hot reloading
- **Jest** - Testing framework

## 📡 API Documentation

The backend API is available at `http://localhost:5000/api` during development.

### Health Check
- `GET /api/health` - Server health status

### Retrospective Sessions
- `GET /api/retro/sessions` - Get all retro sessions
- `GET /api/retro/sessions/:id` - Get specific retro session
- `POST /api/retro/sessions` - Create new retro session
- `PUT /api/retro/sessions/:id` - Update retro session
- `DELETE /api/retro/sessions/:id` - Delete retro session

### Retrospective Items
- `GET /api/retro/sessions/:sessionId/items` - Get items for a session
- `POST /api/retro/sessions/:sessionId/items` - Create new item
- `PUT /api/retro/items/:id` - Update item
- `DELETE /api/retro/items/:id` - Delete item

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Available environment variables:
- `PORT` - Backend server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:3000)
- `API_PREFIX` - API route prefix (default: /api)

### Frontend Configuration

The frontend automatically proxies API requests to the backend during development. This is configured in `frontend/vite.config.ts`.

## 🧪 Available Scripts

### Root Level Scripts
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build all packages
- `npm run test` - Run all tests
- `npm run lint` - Lint all packages
- `npm run clean` - Clean all build outputs and node_modules

### Frontend Scripts (run with `npm run <script> --workspace=frontend`)
- `dev` - Start development server
- `build` - Build for production
- `preview` - Preview production build
- `test` - Run tests
- `lint` - Run ESLint

### Backend Scripts (run with `npm run <script> --workspace=backend`)
- `dev` - Start development server with hot reload
- `build` - Compile TypeScript
- `start` - Start production server
- `test` - Run tests
- `lint` - Run ESLint

## 🎯 Next Steps

1. **Database Integration**: Add your preferred database (MongoDB, PostgreSQL, etc.)
2. **Authentication**: Implement user authentication and authorization
3. **Real-time Features**: Add WebSocket support for live collaboration
4. **Testing**: Add comprehensive test coverage
5. **Deployment**: Set up CI/CD and deployment configuration
6. **UI/UX**: Enhance the user interface and experience

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `npm run test`
5. Run linting: `npm run lint`
6. Commit your changes: `git commit -m 'Add some feature'`
7. Push to the branch: `git push origin feature/your-feature-name`
8. Submit a pull request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
