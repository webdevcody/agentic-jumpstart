# Online Learning Platform

A modern online learning platform built with TanStack Start, featuring video courses, user authentication, and payment processing.

## Tech Stack

- **Framework**: TanStack Start (React 19 + TanStack Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Arctic OAuth (Google login)
- **Payments**: Stripe
- **Storage**: AWS S3/R2 for video storage
- **Styling**: Tailwind CSS v4 with shadcn/ui components

## Development

Install dependencies:
```sh
npm install
```

Start development server (includes database):
```sh
npm run dev
```

The app runs on http://localhost:3000

## Database Setup

Start PostgreSQL container:
```sh
npm run db:up
```

Run migrations:
```sh
npm run db:migrate
```

Seed with sample data:
```sh
npm run db:seed
```

Reset database:
```sh
npm run db:reset
```

## Stripe Setup

Listen for webhooks:
```sh
npm run stripe:listen
```

## Environment Variables

Create a `.env.local` file with:

```
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_ENDPOINT_SECRET=whsec_...
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
BASE_URL=http://localhost:3000
```

## Project Structure

- `/src/routes/` - File-based routing with TanStack Router
- `/src/components/` - Shared React components
- `/src/data-access/` - Database queries (Drizzle)
- `/src/use-cases/` - Business logic
- `/src/fn/` - Server functions
- `/src/db/` - Database schema and migrations
