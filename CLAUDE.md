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

Chellys Kitchen is a recipe management application with a TypeScript backend (Fastify + Prisma + PostgreSQL) and a React frontend (Vite + Material UI).

## Development Commands

### Backend (in `backend/` directory)
- `npm run dev` - Start development server (http://localhost:4000)
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run production build
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:seed` - Seed database with initial data

### Frontend (in `frontend/` directory)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Architecture

### Backend - Domain-Driven Design

The backend follows a layered architecture:

**Domain Layer** (`backend/src/domain/`)
- `entities/` - Core domain models (Recipe, Category, User)
- `services/` - Business logic (PasswordService, SlugService, RatingService, RecipeService)
- `validators/` - Zod schemas for input validation

**Application Layer** (`backend/src/application/`)
- Use cases that orchestrate domain logic (AuthUseCases, RecipeUseCases, UserUseCases)

**Infrastructure Layer** (`backend/src/infrastructure/`)
- `database/` - Prisma client singleton with connection management
- `storage/` - File upload handling (StorageService)
- `auth/` - JWT token generation and verification

**API Layer** (`backend/src/api/`)
- Route handlers organized by resource (auth, recipes, categories, ratings, admin, health)
- Each route file exports a function that registers routes with Fastify

**Middleware** (`backend/src/middleware/`)
- `auth.ts` - Authentication and authorization middleware (requireAuth, requireRole, requireMinRole, optionalAuth)

### Key Patterns

**Authentication Flow**
- JWT-based auth with access and refresh tokens
- Middleware attaches decoded user payload to `request.user`
- Role-based access control: GUEST < MEMBER < EDITOR < ADMIN

**Recipe Management**
- Recipes have slugs for URL-friendly identifiers
- Status workflow: DRAFT → PUBLISHED → ARCHIVED
- Only EDITOR/ADMIN can publish/archive recipes
- Recipe ownership checked on update/delete operations

**Database**
- Prisma ORM with PostgreSQL
- Schema defined in `backend/prisma/schema.prisma`
- JSONB fields for flexible data (ingredients, steps, nutritionalValues)

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

- Backend runs on port 4000 by default
- Database URL configured via `DATABASE_URL` environment variable
- Passwords hashed with bcrypt (10 salt rounds)
- Recipe slugs auto-generated from titles with collision handling
- Ratings are 1-5 stars, one per user per recipe (upsert behavior)
