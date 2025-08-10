# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack learning management system built with TanStack Start, React 19, and TypeScript. Features video-based course modules with premium content access via Stripe.

## Essential Commands

### Development
```bash
npm run dev              # Start dev server with database
npm run build            # Production build
npm run start            # Start production server
```

### Database Management
```bash
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database with sample data
npm run db:reset         # Clear, migrate, and seed database
npm run db:studio        # Open Drizzle Studio for database inspection
npm run db:up            # Start Docker PostgreSQL container
npm run db:down          # Stop Docker PostgreSQL container
```

### Integration Commands
```bash
npm run stripe:listen    # Listen to Stripe webhooks locally
npm run upload:videos    # Upload videos to R2 storage
```

## Architecture

### Clean Architecture Pattern
The codebase follows clean architecture principles with clear separation of concerns:

1. **Routes Layer** (`/src/routes/`) - HTTP handlers and page components
2. **Use Cases Layer** (`/src/use-cases/`) - Business logic and rules
3. **Data Access Layer** (`/src/data-access/`) - Database queries and operations
4. **Database Layer** (`/src/db/`) - Schema definitions and migrations

### Key Design Patterns

- **File-based routing** via TanStack Router
- **Server-side rendering** with TanStack Start
- **Session-based authentication** stored in PostgreSQL
- **Repository pattern** for data access
- **Component composition** with Radix UI primitives

### State Management

- **TanStack Query** for server state and data fetching
- **React Hook Form** with Zod validation for forms
- **URL state** for filters and navigation

## Important Conventions

### TypeScript
- Strict mode enabled
- Use path aliases: `~/` maps to `./src/`
- Prefer explicit types over inference for function parameters

### Database Operations
- All database operations go through Drizzle ORM
- Use transactions for multi-table operations
- Always validate data with Zod before database operations

### Authentication Flow
1. Google OAuth via Arctic library
2. Session stored in database with secure cookie
3. User context provided via TanStack Router loader
4. Protected routes check session in loader functions

### File Storage
- Videos stored in AWS S3/R2
- Use presigned URLs for secure access
- File uploads handled via multipart forms

## Current Known Issues

- Segment deletion causes app crash due to redirect logic
- Module reordering doesn't update navigation correctly
- Delete module button expands accordion (should prevent default)

## Testing Approach

Currently no automated tests. Manual testing required for:
- Authentication flows
- Payment processing
- Video upload and playback
- Progress tracking