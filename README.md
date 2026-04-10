# HMS — Hotel Management System

Monorepo for a multi-tenant hotel operations platform: reservations, rooms, housekeeping, finance, restaurant/POS, maintenance, staff, and related admin workflows. The stack is a **NestJS** API with **PostgreSQL** (Prisma) and a **React** SPA (Vite, Ant Design).

## Repository layout

| Path       | Description                                      |
| ---------- | ------------------------------------------------ |
| `api/`     | NestJS backend, Prisma schema & migrations, seeds |
| `client/`  | React 19 + Vite 7 + TypeScript SPA               |

There is no root `package.json`; install and run scripts **per package** (`api` and `client`). Pick one package manager: **npm**, **pnpm**, **Yarn**, or **Bun** — script names in `package.json` are the same; only install/run/exec commands differ (see [Package manager cheat sheet](#package-manager-cheat-sheet)).

## Prerequisites

- **Node.js** (LTS recommended, e.g. 22.x)
- **PostgreSQL** (local or remote)
- A **package manager** (any one is enough):
  - **npm** — included with Node
  - **pnpm** — `corepack enable` then `corepack prepare pnpm@latest --activate`, or `npm install -g pnpm`
  - **Yarn** — [Classic](https://classic.yarnpkg.com/): `npm install -g yarn` · [Berry (v2+)](https://yarnpkg.com/): `corepack prepare yarn@stable --activate`
  - **Bun** — [bun.sh](https://bun.sh) (optional; fast installer and runtime)

## Quick start

### 1. Database

Create a PostgreSQL database and note the connection string.

### 2. API (`api/`)

Create `api/.env` with at least `DATABASE_URL` and `JWT_SECRET` (see [Environment variables](#environment-variables)).

**npm**

```bash
cd api
npm install
npx prisma migrate dev   # apply migrations
npm run seed             # optional: seed users + demo data
npm run start:dev        # http://localhost:4000 by default
```

**pnpm**

```bash
cd api
pnpm install
pnpm exec prisma migrate dev
pnpm run seed
pnpm run start:dev
```

**Yarn (Classic v1)**

```bash
cd api
yarn install
yarn prisma migrate dev
yarn seed
yarn start:dev
```

**Bun**

```bash
cd api
bun install
bunx prisma migrate dev
bun run seed
bun run start:dev
```

### 3. Client (`client/`)

**npm**

```bash
cd client
npm install
# Development: API URL (defaults to http://localhost:4000 if unset)
echo 'VITE_API_URL=http://localhost:4000' > .env.development
npm run dev              # default Vite port: 5175 (see vite.config.ts)
```

**pnpm**

```bash
cd client
pnpm install
echo 'VITE_API_URL=http://localhost:4000' > .env.development
pnpm run dev
```

**Yarn (Classic v1)**

```bash
cd client
yarn install
echo 'VITE_API_URL=http://localhost:4000' > .env.development
yarn dev
# or: yarn run dev
```

**Bun**

```bash
cd client
bun install
echo 'VITE_API_URL=http://localhost:4000' > .env.development
bun run dev
```

Open the URL printed in the terminal (e.g. `http://localhost:5175`). Log in with credentials from your seed or admin setup.

### Package manager cheat sheet

| Task | npm | pnpm | Yarn (Classic) | Yarn Berry (2+) | Bun |
| ---- | --- | ---- | -------------- | ----------------- | --- |
| Install dependencies | `npm install` | `pnpm install` | `yarn` / `yarn install` | `yarn install` | `bun install` |
| Run a script | `npm run <name>` | `pnpm run <name>` / `pnpm <name>` | `yarn run <name>` / `yarn <name>` | `yarn run <name>` | `bun run <name>` |
| Run local CLI (e.g. Prisma) | `npx prisma …` | `pnpm exec prisma …` | `yarn prisma …` | `yarn exec prisma …` | `bunx prisma …` |

Yarn Berry: if `yarn prisma` is not available, use `yarn exec prisma` or `yarn dlx prisma` for one-off versions.

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
| `.env.development` | `VITE_API_URL` — backend base URL during dev (`npm run dev`, `pnpm dev`, `yarn dev`, `bun run dev`, …) |
| `.env.production`  | `VITE_API_URL` — **inlined at build time**; rebuild after changes |

See `client/.env.production.example` for a production template.

**Note:** Vite only exposes variables prefixed with `VITE_`.

## Package scripts

In `api/` and `client/`, **script names are identical** for every manager. Examples:

- **npm:** `npm run <name>`
- **pnpm:** `pnpm run <name>` or often `pnpm <name>`
- **Yarn:** `yarn run <name>` or `yarn <name>` (Classic)
- **Bun:** `bun run <name>`

### API (`cd api`)

| Script             | Description                              |
| ------------------ | ---------------------------------------- |
| `start`            | Start Nest (once)                        |
| `start:dev`        | Start with file watch                    |
| `start:debug`      | Start with debugger + watch              |
| `start:prod`       | Run compiled app (`node dist/main`)      |
| `build`            | Compile to `dist/`                       |
| `lint`             | ESLint (with `--fix`)                    |
| `format`           | Prettier on `src` / `test`               |
| `seed`             | `seed-users` then `seed-data`            |
| `seed:massive`     | Larger dataset (`seed-data --massive`)   |
| `test`             | Jest unit tests                          |
| `test:watch`       | Jest watch                               |
| `test:cov`         | Coverage                                 |
| `test:e2e`         | E2E (see `test/jest-e2e.json`)           |

Examples: `npm run start:dev` · `pnpm start:dev` · `yarn start:dev` · `bun run start:dev`

Prisma CLI (run from `api/`):

```bash
# migrate dev
npx prisma migrate dev
pnpm exec prisma migrate dev
yarn prisma migrate dev              # Classic; Berry: yarn exec prisma migrate dev
bunx prisma migrate dev

# generate / studio — same pattern (npx / pnpm exec / yarn prisma / bunx)
```

### Client (`cd client`)

| Script      | Description                    |
| ----------- | ------------------------------ |
| `dev`       | Vite dev server (port **5175** in config) |
| `build`     | Typecheck + production build   |
| `preview`   | Serve production build locally (default **4175**) |
| `lint`      | ESLint                         |

Examples: `npm run dev` · `pnpm dev` · `yarn dev` · `bun run dev`

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

If you add a root-level orchestration tool later (e.g. **pnpm** / **Yarn** / **npm** workspaces, Turborepo, or a root `package.json`), document the new commands here and keep this file as the single source of truth for onboarding.
