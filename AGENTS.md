# Repository Guidelines

## Project Structure & Module Organization
- `src/routes/` holds TanStack Router file-based routes and page entry points.
- `src/components/` contains shared UI components (Tailwind + shadcn/ui).
- `src/data-access/`, `src/use-cases/`, `src/fn/` separate persistence, business logic, and server functions.
- `src/db/` includes Drizzle schema/migrations plus DB utilities.
- `tests/` contains Playwright end-to-end tests; unit tests run via Vitest.
- `public/` stores static assets served by Vite; infra scripts live under `infra/`.

## Build, Test, and Development Commands
- `npm run dev` starts the app plus the local Postgres container (`docker compose up -d`).
- `npm run build` builds the production bundle with Vite.
- `npm run start` runs migrations then launches the production server.
- `npm run db:up` / `npm run db:down` manage the local database container.
- `npm run db:migrate` / `npm run db:seed` / `npm run db:reset` manage schema and sample data.
- `npm run test` runs Playwright E2E; `npm run test:unit` runs Vitest; `npm run test:unit:coverage` collects coverage.

## Coding Style & Naming Conventions
- TypeScript + React with ES modules; prefer existing patterns in `src/`.
- Indentation is 2 spaces, double quotes, and semicolons (match current files).
- Route files are named by path (e.g., `src/routes/index.tsx`).
- Keep Drizzle schemas in `src/db/` and access via `src/data-access/`.

## Testing Guidelines
- E2E uses Playwright with config in `playwright.config.ts`; tests live in `tests/*.spec.ts`.
- Unit tests use Vitest; colocate or place under `tests/` when appropriate.
- Typical command: `npm run test:chrome` for local stability (see `tests/README.md`).
- Keep tests isolated; use helpers in `tests/helpers/` for auth or shared setup.

## Commit & Pull Request Guidelines
- Recent history uses Conventional Commits (`feat:`, `fix:`, `chore:`). Follow this format.
- PRs should include a clear description, steps to test, and screenshots for UI changes.
- Read `CONTRIBUTING.md` for the CLA terms before submitting.

## Configuration & Secrets
- Create `.env.local` with values in `README.md` (DB, Stripe, Google OAuth, R2).
- Webhooks: `npm run stripe:listen` forwards to `http://localhost:4000/api/stripe/webhook`.
