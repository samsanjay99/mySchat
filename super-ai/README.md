# Super AI Module

This folder contains all Super AI related functionality for the Schat application.

## Folder Structure

```
super-ai/
├── client/                 # Client-side Super AI components
│   ├── SuperAIChat.tsx     # Main Super AI chat component
│   └── ai-chat.tsx         # AI chat page component
├── server/                 # Server-side Super AI functionality
│   ├── super-ai-service.ts # Super AI service with A4F API integration
│   ├── migrate-super-ai.ts # Migration to create Super AI user
│   └── migrate-add-super-ai-column.ts # Migration to add isSuperAI column
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Super AI specific TypeScript types and Zod schemas
└── docs/                   # Documentation
    └── SUPER_AI_README.md # Detailed Super AI implementation guide
```

## Components

### Client Components
- **SuperAIChat.tsx**: Main chat interface for interacting with Super AI
- **ai-chat.tsx**: Page wrapper for the Super AI chat

### Server Components
- **super-ai-service.ts**: Service layer that handles communication with the A4F API
- **migrate-super-ai.ts**: Database migration to create the Super AI user
- **migrate-add-super-ai-column.ts**: Migration to add the `isSuperAI` column to users table

### Shared Types
- **schema.ts**: TypeScript interfaces and Zod validation schemas for Super AI functionality

## API Endpoints

- `GET /api/super-ai/chat`: Get or create a chat with Super AI
- `POST /api/super-ai/chat`: Send a message to Super AI

## Usage

1. Run the Super AI migration: `npm run migrate:super-ai`
2. Import Super AI components from their new locations
3. Use the Super AI chat interface in your application

## Integration

The Super AI module integrates with the main application through:
- Shared database schema (users table with `isSuperAI` field)
- API routes in the main server
- React components in the main client application

## Dependencies

- A4F API for AI responses
- React Query for state management
- WebSocket for real-time communication
- Zod for input validation 