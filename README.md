# HMS — Hotel Management System

Monorepo for a multi-tenant hotel operations platform: reservations, rooms, housekeeping, finance, restaurant/POS, maintenance, staff, and related admin workflows. The stack is a **NestJS** API with **PostgreSQL** (Prisma) and a **React** SPA (Vite, Ant Design).

## Repository layout

| Path       | Description                                      |
| ---------- | ------------------------------------------------ |
| `api/`     | NestJS backend, Prisma schema & migrations, seeds |
| `client/`  | React 19 + Vite 7 + TypeScript SPA               |

There is no root `package.json`; install and run scripts **per package** (`api` and `client`).

## Prerequisites

- **Node.js** (LTS recommended, e.g. 22.x)
- **PostgreSQL** (local or remote)
- **npm**, **pnpm**, or **yarn** (examples below use `npm`)

## Quick start

### 1. Database

Create a PostgreSQL database and note the connection string.

### 2. API (`api/`)

```bash
cd api
# Create api/.env with at least DATABASE_URL and JWT_SECRET (see Environment variables)
npm install
npx prisma migrate dev # apply migrations (from api/)
npm run seed           # optional: seed users + demo data
npm run start:dev      # http://localhost:4000 by default
```

### 3. Client (`client/`)

```bash
cd client
npm install
# Development: API URL (defaults to http://localhost:4000 if unset)
echo 'VITE_API_URL=http://localhost:4000' > .env.development
npm run dev            # default Vite port: 5175 (see vite.config.ts)
```

Open the URL printed in the terminal (e.g. `http://localhost:5175`). Log in with credentials from your seed or admin setup.

## Environment variables

### API (`api/.env`)

Never commit real `.env` files. Typical variables (names may vary by feature usage):

| Variable                 | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection string (used by Prisma) |
| `PORT`                   | HTTP port (default **4000** if omitted)     |
| `JWT_SECRET`             | Signing secret for JWT auth                  |
| `AI_API_KEY`             | Optional AI integrations                     |
| `OPENAI_API_KEY`         | Optional OpenAI usage                        |
| `TELEGRAM_BOT_TOKEN`     | Optional Telegram booking / notifications    |
| `TELEGRAM_CHAT_ID`       | Optional Telegram chat                       |
| `BOT_TOKEN`              | Additional bot token if used                 |
| `STORAGE_TYPE`           | File storage mode (e.g. `local`)             |
| `EMERGENCY_RESTORE_SECRET` | Sensitive operational flag if enabled     |

Prisma reads `DATABASE_URL` via `prisma.config.ts` and `dotenv`.

### Client (`client/`)

| File / variable    | Purpose |
| ------------------ | ------- |
| `.env.development` | `VITE_API_URL` — backend base URL during `npm run dev` |
| `.env.production`  | `VITE_API_URL` — **inlined at build time**; rebuild after changes |

See `client/.env.production.example` for a production template.

**Note:** Vite only exposes variables prefixed with `VITE_`.

## NPM scripts

### API (`cd api`)

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run start`   | Start Nest (once)                        |
| `npm run start:dev` | Start with file watch                  |
| `npm run start:debug` | Start with debugger + watch          |
| `npm run start:prod` | Run compiled app (`node dist/main`)   |
| `npm run build`   | Compile to `dist/`                       |
| `npm run lint`    | ESLint (with `--fix`)                    |
| `npm run format`  | Prettier on `src` / `test`               |
| `npm run seed`    | `seed-users` then `seed-data`            |
| `npm run seed:massive` | Larger dataset (`seed-data --massive`) |
| `npm test`        | Jest unit tests                          |
| `npm run test:watch` | Jest watch                           |
| `npm run test:cov` | Coverage                             |
| `npm run test:e2e` | E2E (see `test/jest-e2e.json`)         |

Prisma CLI (run from `api/`):

```bash
npx prisma migrate dev    # create/apply migrations in development
npx prisma generate       # regenerate Prisma Client
npx prisma studio         # database GUI
```

### Client (`cd client`)

| Script            | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Vite dev server (port **5175** in config) |
| `npm run build`   | Typecheck + production build   |
| `npm run preview` | Serve production build locally (default **4175**) |
| `npm run lint`    | ESLint                         |

## Architecture notes

- **Auth:** JWT; the client stores the token (e.g. zustand persist) and sends `Authorization: Bearer …`.
- **Multi-tenant / branch:** The client sends `x-tenant-id` and `x-branch-id` when set in `localStorage`; the API enforces access per tenant/branch where applicable.
- **CORS:** The API enables CORS with `origin: true` for development flexibility; tighten for production if needed.
- **i18n:** Client strings live under `client/src/shared/config/i18n/locales/` (e.g. `en`, `ru`, `uz`).

## Tech stack (summary)

**API:** NestJS 11, Prisma 7, PostgreSQL, Passport/JWT, class-validator, scheduled tasks, static files, QR/archiver utilities, optional Telegram/OpenAI.

**Client:** React 19, React Router 7, TanStack Query, Ant Design 6, Axios, Zustand, i18next, Leaflet (where used), Vite 7.

## Git ignore

Sensitive or generated paths include `node_modules`, `dist`, `.env`, local IDE folders, and project-specific entries (see root `.gitignore`).

## License

`api/package.json` declares `UNLICENSED` (private). Adjust if you publish or redistribute.

---

If you add a root-level orchestration tool later (e.g. Turborepo or a root `package.json` with workspaces), document the new commands here and keep this file as the single source of truth for onboarding.
