# Hotel Management System (HMS) Overview

## Purpose & Scope
- Integrated, multi-tenant platform for hotel groups: bookings, front-desk, restaurant, housekeeping, inventory, finance, guest services, and auditability (see [PROGRESS_REPORT.md](PROGRESS_REPORT.md)).
- Targets branch-level control with central oversight for companies and groups.
- Emphasizes financial integrity (folios, locked records), guest experience (digital menus, concierge/service requests), and compliance (passport/visa logs, Telegram notifications).

## Architecture at a Glance
- **Backend:** NestJS 11 (TypeScript) with Prisma and PostgreSQL; JWT auth, scheduling, static serve, and AI/Telegram integrations ([api/package.json](api/package.json)).
- **Frontend:** React 19 + Vite 7 (TypeScript) using feature-sliced structure; Ant Design 6 UI, React Query, React Router 7, Zustand state, i18n, Leaflet maps ([client/package.json](client/package.json)).
- **Process & Deployment:** PM2 ecosystem runs API (cluster mode, port 3002) and serves client dist (port 3003) ([ecosystem.config.js](ecosystem.config.js)); Nginx reverse proxy and Certbot SSL guided in [DEPLOY.md](DEPLOY.md).
- **Data Layer:** Prisma schema models tenants, branches, users/roles, bookings, rooms, folios/payments, inventory, restaurant orders, housekeeping, maintenance, and communications ([api/prisma/schema.prisma](api/prisma/schema.prisma)).

## Core Business Domains (Backend `src/`)
- **Tenancy & Access:** Tenants, branches, role-based access (RBAC), and per-branch user assignments.
- **Bookings & Rooms:** Room types, rate plans, price modifiers, bookings with multi-room stays and guest-to-room assignments, status histories.
- **Front Desk & Guest Services:** Concierge requests, hotel services, QR-based menus, guest communications, Telegram hooks.
- **Restaurant & POS:** Menu categories/items, ingredients, restaurant orders with item-level status and fulfillment.
- **Finance:** Folios and folio items with tax breakdowns, payments, multi-currency support, discount contracts for companies.
- **Inventory & Logistics:** Inventory items, categories, stock logs with reasons, auto-deduction roadmap tied to restaurant/orders.
- **Housekeeping & Maintenance:** Housekeeping tasks, room status history, maintenance tickets with priorities/statuses.
- **Compliance (Emehmon):** Guest passport/visa data and logging for local regulatory reporting.
- **Audit & Backups:** Audit/system logs, backup utilities and dumps stored under `backups/`.

## Frontend Capabilities (Client `src/`)
- Administrative dashboards for bookings, inventory, maintenance, finance, and restaurant modules with responsive layouts.
- Guest-facing digital menu and ordering flows; service/concierge requests.
- Localization via i18next; mapping via Leaflet; QR code rendering for menus and guest interactions.
- Data-fetch consistency through React Query with optimistic UI patterns noted in progress report.

## Deployment & Operations
- PM2 ecosystem manages API (clustered) and static client serving; environment variables for API include `PORT=3002` and `CORS_ORIGIN` defaults (see [ecosystem.config.js](ecosystem.config.js)).
- Deployment guide covers VPS setup, pnpm installs, Prisma generate/migrate, builds, PM2 start, and Nginx reverse proxy with SSL via Certbot ([DEPLOY.md](DEPLOY.md)).
- Ports reserved: 3002 (API), 3003 (Client). Nginx proxies `hms.centrify.uz` and `api-hms.centrify.uz` with CORS headers for allowed origins.

## Testing & Tooling
- Backend: Jest unit and e2e targets (`test`, `test:e2e`, coverage) and ESLint/Prettier formatting ([api/package.json](api/package.json)).
- Frontend: ESLint setup; no test runner declared ([client/package.json](client/package.json)).
- Seed and utilities: Prisma seeds for admin and massive data generation; coordinate updater and backup utilities (`api/prisma/*.ts`, `api/backup/`).

## Current Status & Roadmap (per [PROGRESS_REPORT.md](PROGRESS_REPORT.md))
- Status: Implementation phase; core modules functional; integration testing underway.
- WIP: End-to-end flow validation, Nginx/SSL refinements, automated stock deduction from restaurant orders.
- Next: Reporting/analytics dashboards, third-party payment gateway integration, PWA for staff operations.

## Quick Facts
- Multi-tenant with branch isolation and per-branch RBAC.
- Soft-delete via Prisma middleware for auditability.
- Folio records lock after closure to prevent retroactive edits.
- Seed scripts can generate >50k records for load testing.
- Client served as SPA via PM2 `serve` with `PM2_SERVE_SPA=true`.
