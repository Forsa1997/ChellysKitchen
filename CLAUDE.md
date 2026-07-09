# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Balanced Subagent Team

Claude Code should use the project subagents in `.claude/agents/` as the parallel Claude-native version of the Codex `.agents/skills/` team. Both structures intentionally coexist:

- Codex uses `.agents/skills/`.
- Claude Code uses `.claude/agents/`.
- Shared team and product context lives in `.agents/shared/`.

Use `pm-orchestrator` as the default intake agent for feature, bugfix, architecture, UX, security, testing, QA, and review work. The PM orchestrator coordinates these specialists:

- `researcher` - discovery, unknowns, option comparisons, evidence.
- `solution-architect` - system boundaries, interfaces, sequencing, data flow, tradeoffs.
- `testing-agent` - test-first behavior contracts, failing-first tests, verification gates.
- `feature-developer` - scoped implementation after requirements and gates are clear.
- `security-expert` - trust boundaries, auth, validation, dependencies, secrets, deployment safety.
- `quality-assurance` - post-implementation acceptance validation, regression review, release readiness.
- `ui-designer` - UX flows, layout, component behavior, accessibility, responsive design.

Default sequence: Research when unclear, Architecture and/or Design when structure or UI matters, Security for sensitive surfaces, Testing before implementation, Feature Developer for code changes, and Quality Assurance before final sign-off.

Keep Testing and QA distinct: Testing defines what must be proven before code; QA validates what was actually delivered after code.

### Mandatory TDD Enforcement (Codex + Claude)

- Strict TDD is mandatory for all implementation work in both Codex and Claude workflows.
- `testing-agent` must define or update tests for every changed function before `feature-developer` edits production code.
- The red phase is required: new or changed tests must fail first for the expected reason before implementation begins.
- `feature-developer` must not start coding until those failing tests and verification gates are documented.
- Exceptions are limited to explicit user-approved hotfix overrides.

## Project Overview

Chellys Kitchen is a family recipe app with a deliberately slim, dependency-free Node.js backend (`backend/server.mjs`, JSON file store) and a React frontend (Vite + Material UI). There is no database and no ORM.

## Development Commands

### Backend (in `backend/` directory)
- `npm run dev` - Start development server with --watch (http://localhost:4000)
- `npm run start` - Run the server (same entry point, `server.mjs`)
- `npm test` - Run all backend tests (node:test, incl. end-to-end smoke tests that boot the real server)

### Frontend (in `frontend/` directory)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm test` - Run Vitest suite

## Architecture

### Backend - Single-file server with extracted modules

`backend/server.mjs` is a plain `node:http` server (no npm dependencies). Testable logic lives in `backend/src/*.mjs` modules, each with a sibling `*.test.mjs`:

- `queryRecipes.mjs` - shared list filtering (q incl. ingredients, category, difficulty, status, maxTotalMinutes, favorites) + pagination/sorting
- `randomRecipe.mjs` - random pick over ALL matching recipes (`GET /api/recipes/random`, `exclude` param)
- `persistence.mjs` - JSON store serialization, debounced disk writes to `DATA_DIR/store.json`
- `backup.mjs` - full export/import payloads incl. uploaded images (admin endpoints)
- `bringExport.mjs` - schema.org/Recipe JSON-LD page for the Bring! shopping-list import (`GET /api/recipes/:slug/bring`, `servings` param scales amounts)
- `weekplan.mjs` - shared family week plan (day -> planned recipes + servings) and ingredient aggregation for the weekly Bring! list (`/api/weekplan`, public `/api/weekplan/bring`)
- `recipeImport.mjs` - import recipes from external sites: fetch server-side, extract schema.org JSON-LD, parse ingredient lines/durations; SSRF guard (`POST /api/recipes/import`, `IMPORT_ALLOW_PRIVATE=1` only for tests)
- `passwords.mjs` - scrypt hashing, transparent migration of legacy SHA-256 hashes on login
- `sessions.mjs` - token maps with TTL (access 1d, refresh 30d, rotation on refresh)
- `uploads.mjs`, `cors.mjs` - image upload validation, CORS origin resolution

End-to-end smoke tests in `backend/test/` spawn the real server against a temp `DATA_DIR`.

### Key Patterns

**Authentication Flow**
- Opaque bearer tokens (not JWT) stored in persisted session maps with expiry
- `authenticateRequest(req)` resolves the user; role ranks: GUEST < MEMBER < EDITOR < ADMIN
- There is no public registration: accounts are created via the admin dashboard (`POST /api/admin/users`) or the `ADMIN_EMAIL`/`SEED_USERS` env vars (`SEED_USERS` = JSON array of `{ name, email, password, role? }`)
- Production (`NODE_ENV=production`) seeds no demo user and no default admin — `ADMIN_EMAIL`/`ADMIN_PASSWORD` are required

**Recipe Management**
- Recipes have slugs for URL-friendly identifiers
- New recipes publish immediately (deliberate decision for family use; DRAFT exists in the status enum but has no UI flow). EDITOR/ADMIN can archive/publish via admin dashboard
- Recipe ownership checked on update/delete; favorites are per user; notes are shared and writable by any member

**Persistence**
- Everything (users, recipes, ratings, categories, favorites, sessions) lives in one JSON file under `DATA_DIR` (default `./.data`); uploaded images next to it
- Render free tier wipes `DATA_DIR` on redeploy — the admin backup export/import endpoints are the safety net

### Frontend Architecture

**State Management**
- React Query (`@tanstack/react-query`) for server state
- AuthContext for authentication state
- Custom hooks in `frontend/src/hooks/` for API operations

**API Client**
- Centralized API client in `frontend/src/api/client.ts`
- Handles token storage and automatic injection
- Type-safe API calls with TypeScript

**UI Components**
- Material UI (MUI) component library
- Custom theme in `frontend/src/AppTheme.tsx`
- Layout components in `frontend/src/layout/`

## Important Notes

- Backend runs on port 4000 by default; data location via `DATA_DIR` (default `./.data`)
- Passwords hashed with scrypt (`node:crypto`); legacy SHA-256 hashes migrate on login
- Recipe slugs auto-generated from titles with collision handling
- Ratings are 1-5 stars, one per user per recipe (upsert behavior)
- Production runs with the hash router (`/#/...`) because the static host has no SPA rewrites
- Deferred ideas and decisions live in `BACKLOG.md`
