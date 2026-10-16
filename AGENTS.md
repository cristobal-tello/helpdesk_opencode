# AGENTS.md - Helpdesk Repository

## Project Overview
Monorepo with Bun workspaces: `client` (React/Vite) + `server` (Express/Bun). PostgreSQL + Prisma ORM. Auth via Better Auth.

## Key Commands

```bash
# Install deps
bun install

# Dev servers (run in separate terminals)
bun --filter 'server' dev   # port 3002
bun --filter 'client' dev   # port 5174

# Build client only
bun --filter 'client' build

# Typecheck all packages
bun --filter '*' typecheck

# Database
cd server && bunx prisma migrate dev
cd server && bunx prisma db seed

# Component tests (client, Vitest)
bun --filter 'client' test              # all client tests
bun --filter 'client' test:components   # only *.test.tsx
bun --filter 'client' test:watch        # watch mode

# E2E tests
bunx playwright test
```

## Architecture Notes

- **Auth**: Better Auth with email/password. Signup disabled (`disableSignUp: true`). Admin seeded via `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` in `.env`.
- **Admin middleware**: `server/src/middleware/auth.ts` exports `requireAdmin` - checks `session.user.role === "admin"`.
- **Frontend route guards**: `App.tsx` has `AdminRoute` wrapper protecting `/users` page.
- **API**: Server at `/api/users` (GET, admin only). Client uses axios + TanStack Query (`useQuery`).
- **Data fetching**: Always use TanStack Query (`useQuery`/`useMutation`) with axios. Axios instance in `client/src/lib/api.ts` or inline with `withCredentials: true`.
- **Env loading**: Server uses `--env-file=.env` flag; Client uses `VITE_API_URL` (defaults to empty string = same origin).
- **Prisma output**: Generated to `server/src/generated/prisma/` (configured in schema.prisma).

## Non-Obvious Gotchas

1. **No `tsc` in client build** - `package.json` uses `vite build` only (TypeScript errors don't fail build).
2. **Better Auth consumes request body** - Express JSON parser skips `/api/auth/*` routes (see `server/src/index.ts:27-30`).
3. **Client proxy** - Vite dev server proxies `/api/*` to backend (check `vite.config.ts`).
4. **Admin user** - Must have `Account` record with `providerId: "credential"` for password login (seed creates this).
5. **No core/ shared package yet** - despite README mentioning it, types are duplicated or imported from server generated Prisma client.
6. **Test deps are version-pinned for Bun** - `jsdom` pinned to v25 and `undici` overridden to v6 in root `package.json`. Newer majors crash Vitest workers under Bun (`Iterator is not defined` / `decompress.js`). Don't bump these without re-running tests.

## File Patterns

- **Server routes**: `server/src/routes/*.ts` - mounted in `index.ts`
- **Client pages**: `client/src/pages/*.tsx` - routed in `App.tsx`
- **UI components**: `client/src/components/ui/` - shadcn/ui style
- **API client**: `client/src/lib/api.ts` (axios instance) or inline in pages

## Testing

**Component tests (client)** — Vitest + React Testing Library, jsdom env.
- Run: `bun --filter 'client' test` (or `test:components` for `*.test.tsx` only).
- Config: `client/vitest.config.ts`; setup (jest-dom matchers): `client/src/test/setup.ts`.
- Files: colocate as `client/src/**/Name.test.tsx`.
- **Always wrap components that use TanStack Query** with the `renderWithQuery` helper from `@/test/render` (creates a fresh `QueryClient` with `retry: false`). Use `screen`/`waitFor` from `@testing-library/react`, not `render`.
- **Mock axios** (components call `axios.create()` then `.get()`). Mock so `create` returns an object whose `get` is a `vi.fn()`; import via `vi.mock("axios", ...)` then `vi.mocked(axios)`.

**Server**: `bun test` (none yet). **E2E**: Playwright in `e2e/` — requires running dev servers.

## Environment Variables (server/.env)
Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `OPENAI_API_KEY`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`