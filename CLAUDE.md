# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TanStack Start application for an online learning platform with video courses, user authentication, and payment processing via Stripe. It uses React 19, TanStack Router/Query, Tanstack Start, Drizzle ORM with PostgreSQL, and Tailwind CSS.

## Essential Commands

### Development

- `npm run dev` - Start development server (port 4000) with database
- `npm run build` - Build for production
- `npm start` - Run production server

### Database Operations

- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate new migrations from schema changes
- `npm run db:push` - Push schema changes directly (development)
- `npm run db:studio` - Open Drizzle Studio for database exploration
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Clear, migrate, and seed database
- `npm run db:up` - Start PostgreSQL container (Docker required)
- `npm run db:down` - Stop PostgreSQL container

### Testing Operations

- `npm run test` - To run the playwright test suites against my running application

### Stripe Integration

- `npm run stripe:listen` - Forward Stripe webhooks to localhost:4000

## Architecture

### Tech Stack

- **Framework**: TanStack Start (React 19 + TanStack Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Arctic OAuth (Google login)
- **Payments**: Stripe
- **Storage**: AWS S3/R2 for video storage
- **Styling**: Tailwind CSS v4 with shadcn/ui components

### Project Structure

- `/src/routes/` - TanStack Router file-based routing
  - Layout files: `_layout.tsx`
  - Route components with `-components/` subdirectories
  - API routes in `/api/` subdirectory
- `/src/components/` - Shared React components
  - `/ui/` - shadcn/ui components (Button, Card, Dialog, etc.)
- `/src/data-access/` - Database query functions (Drizzle)
- `/src/use-cases/` - Business logic layer
- `/src/fn/` - Server functions (TanStack Start server functions)
- `/src/hooks/` - Custom React hooks
  - `/mutations/` - React Query mutations
- `/src/db/` - Database configuration and schema
- `/src/config/` - Global configuration and magic numbers
- `/drizzle/` - SQL migration files

### Layered Architecture

The codebase follows a strict 3-layer architecture:

1. **Data Access Layer** (`/src/data-access/`) - Pure database operations, no business logic
2. **Use Cases Layer** (`/src/use-cases/`) - Business logic and orchestration
3. **Server Functions Layer** (`/src/fn/`) - HTTP endpoints that call use cases

**Important**: Server functions should NEVER import Drizzle objects directly. Always call use cases.

### Naming Conventions

- Use cases: `verbNounUseCase` (e.g., `createUserUseCase`)
- Data access: `verbNoun` (e.g., `createUser`)
- Server functions: `verbNounFn` (e.g., `createUserFn`)

### Key Patterns

- **Server Functions**: Use `createServerFn` from TanStack Start for server-side operations
- **Data Fetching**: React Query with server-side prefetching via `routerWithQueryClient`
- **Authentication**: Session-based auth stored in PostgreSQL, accessed via `getUserFromSession`
- **File Uploads**: Direct upload to R2/S3 using presigned URLs
- **Form Handling**: React Hook Form with Zod validation
- **Error Boundaries**: Implemented at route level with `DefaultCatchBoundary`

### Path Aliases

- `~/` maps to `/src/` directory

## Environment Variables

Required environment variables (see `/src/utils/env.ts`):

- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_ENDPOINT_SECRET` - Stripe webhook secret
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` - R2/S3 storage
- `BASE_URL` - Application URL for OAuth callbacks

## Important Notes

- Routes are auto-generated to `/src/routeTree.gen.ts` - do not edit manually
- Database schema changes require running `npm run db:generate` to create migrations
- Component styling follows shadcn/ui patterns with Tailwind CSS
- All server-side operations should use server functions (`createServerFn`)
- Authentication state is managed via session cookies and database sessions

## Code Quality Rules

- Never hard code magic numbers - consolidate them at the top of the file or in `/src/config/index.ts`
- Never let a file exceed 1,000 lines - split into smaller modular components

## Other Important Documentation Files

- **Layered Architecture** - `/docs/technical/layered-architecture.md`
- **Tailwind Additional Info** - `/docs/technical/tailwind.md`

## Tanstack Routes

When making an admin page, protect it with `beforeLoad`:

```typescript
import { assertIsAdminFn } from "~/fn/auth";

export const Route = createFileRoute("/admin/conversions")({
  beforeLoad: () => assertIsAdminFn(),
  component: ConversionsPage,
});
```

## Tanstack Server Functions

Server functions require: middleware, input validator, and should call use cases (not data-access directly).

```typescript
import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware } from "~/lib/auth";
import { z } from "zod";
import { reorderSegmentsUseCase } from "~/use-cases/segments";

export const reorderSegmentsFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(z.array(z.object({ id: z.number(), order: z.number() })))
  .handler(async ({ data }) => {
    return reorderSegmentsUseCase(data);
  });
```

### Middleware Options (from `~/lib/auth`)

- `authenticatedMiddleware` - Requires authenticated user
- `adminMiddleware` - Requires admin permission
- `unauthenticatedMiddleware` - Optional authentication (userId may be undefined)

### Calling Server Functions

Always pass data via the `data` property:

```typescript
getConversionMetricsFn({
  data: { start: dateRange.start, end: dateRange.end },
});
```

## DO NOT RUN SERVER

I always run my server in a separate terminal. NEVER TRY TO RUN `npm run dev`!

## UI Components

- All cards should use the shadcn Card component (CardTitle, CardDescription, etc.)
- Pages should use the Page component and PageHeader when possible
