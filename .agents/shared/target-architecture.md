# Chellys Kitchen Target Architecture

## Purpose

This document defines the target technical baseline for Chellys Kitchen. Future stories should move the codebase toward this architecture unless the user explicitly changes direction.

Read this together with [`project-vision.md`](./project-vision.md).

## Architectural Intent

Chellys Kitchen should become a cloud-deployable web application with:

- a dedicated React frontend
- a dedicated backend API
- a relational database for persistent data
- backend-enforced authentication and role-based authorization
- a clean separation between presentation, domain logic, and infrastructure

The current prototype is not the architectural baseline. A clean restart is allowed and preferred for foundational work.

## Fixed Stack Decisions

These are explicit project constraints:

- Frontend must use React
- Frontend must use TypeScript
- Backend must use TypeScript

Do not propose JavaScript-only alternatives for core application code unless the user explicitly changes this direction.

## Default Stack Assumptions

Use these as defaults until the user chooses differently where they are still open:

- Frontend: React + TypeScript + Vite + Material UI
- Backend: Node.js + TypeScript
- API style: REST
- Database: PostgreSQL
- Authentication: email/password
- Session model: secure token or session-cookie based auth, decided during implementation
- Hosting target: cloud provider with managed infrastructure where practical

## System Context

### Frontend

Responsibilities:

- render public and authenticated UI
- handle routing and page composition
- call backend APIs
- reflect authorization state from backend responses and user session state
- manage transient UI state only

Non-responsibilities:

- durable recipe persistence
- trusted authorization decisions
- ownership enforcement

### Backend

Responsibilities:

- expose API endpoints for auth, users, recipes, categories, and administration
- validate requests
- enforce authentication and RBAC
- apply domain rules such as ownership and publishability
- persist data
- emit audit-relevant metadata where needed

### Database

Responsibilities:

- store users, roles, recipes, recipe metadata, and related entities
- support relational integrity
- support migrations and environment-safe evolution

## High-Level Component Model

### Frontend Layers

- `app`
  - app bootstrap, providers, theme, router
- `pages`
  - route-level screens such as home, recipe detail, sign-in, dashboard, admin
- `features`
  - user-facing business areas such as auth, recipes, recipe-editor, admin-users
- `entities`
  - shared domain-facing UI models such as recipe, user, role
- `shared`
  - API client, utilities, design primitives, common components

### Backend Layers

- `api`
  - route handlers, controllers, request/response DTOs
- `application`
  - use cases, orchestration, transaction boundaries
- `domain`
  - core entities, domain rules, authorization policies, validation concepts
- `infrastructure`
  - database access, hashing, email integrations, storage, logging, config

Keep domain logic out of raw route handlers. Keep infrastructure details out of domain rules.

## Core Domain Areas

### Identity and Access

Primary entities:

- `User`
- `Role`
- optional `Permission` abstraction if needed later

Initial role model:

- `guest`
- `member`
- `editor`
- `admin`

Default access assumptions:

- `guest` can browse allowed public recipes
- `member` can create and manage own recipes
- `editor` can review and edit broader recipe content
- `admin` can manage users, roles, categories, and system-level actions

### Recipe Management

Primary entities:

- `Recipe`
- `RecipeIngredient`
- `RecipeStep`
- `RecipeCategory`
- `RecipeStatus`

Minimum recipe fields:

- title
- slug
- short description
- full instructions
- preparation time
- cooking time
- servings
- difficulty
- category or categories
- image reference
- ingredients
- steps
- author metadata
- timestamps
- publication status

### Audit and Ownership

Track at minimum:

- `createdAt`
- `updatedAt`
- `createdBy`
- `updatedBy`

Where useful, also support:

- `publishedAt`
- `publishedBy`
- `archivedAt`

## API Boundaries

Prefer REST endpoints grouped by resource:

- `/auth`
- `/users`
- `/recipes`
- `/categories`
- `/admin`

Example capability split:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /recipes`
- `GET /recipes/:slug`
- `POST /recipes`
- `PATCH /recipes/:id`
- `DELETE /recipes/:id`
- `PATCH /recipes/:id/publish`
- `GET /admin/users`

Guidelines:

- validate all input in the backend
- never trust frontend role claims
- return authorization failures explicitly
- keep DTOs separate from persistence models

## Authorization Model

Authorization must be enforced in the backend first.

Apply both:

- role-based checks
- ownership-based checks where appropriate

Examples:

- a `member` may edit own draft recipe
- an `editor` may edit or publish recipes beyond own content
- an `admin` may change roles and manage restricted records

Do not encode business-critical permissions only in the frontend.

## Frontend Experience Model

### Public Area

- landing or home page
- recipe browsing
- search and category filtering
- recipe detail pages
- sign-in and sign-up access points

### Authenticated Area

- personal recipe management
- create recipe flow
- edit draft flow
- possibly dashboard or profile area

### Privileged Area

- editor moderation or publishing screens
- admin user and role management

The frontend should preserve the warm, airy, recipe-first tone of the current prototype while moving to production-ready structure.

## State Management Direction

Prefer simple defaults first:

- server state via dedicated API hooks
- local component state for view interactions
- route-based state for navigation context

Only introduce heavier global state machinery if the application genuinely needs it.

## Data Access Direction

Backend:

- use a clear data access boundary such as repositories or persistence services
- keep schema migrations under version control
- do not couple route handlers directly to raw queries everywhere

Frontend:

- centralize API communication
- avoid scattering fetch logic across unrelated components
- keep transport DTOs distinct from presentation helpers where useful

## Configuration and Environments

Support at least:

- local
- staging
- production

Configuration rules:

- keep secrets out of source control
- read configuration from environment variables or provider-managed secret/config systems
- do not hardcode URLs, credentials, or deployment-specific values
- make frontend/backend base URLs environment-aware

## Cloud Deployment Direction

The target architecture should fit common cloud deployment patterns:

- frontend deployable as static assets or web app hosting
- backend deployable as containerized or managed runtime service
- PostgreSQL hosted as a managed database
- optional object storage for uploaded recipe images

Operational expectations:

- repeatable deployments
- database migrations as part of release workflow
- health checks for backend service
- structured logging
- basic monitoring readiness

## Security Baseline

- password storage via strong one-way hashing
- secure session or token handling
- backend-first RBAC enforcement
- validation and sanitization for all untrusted input
- careful handling of markdown or rich-text rendering if introduced
- no secret exposure in frontend bundles
- principle of least privilege for cloud resources

## Delivery Strategy

Build toward the target architecture incrementally.

Recommended implementation order:

1. establish repository structure for dedicated frontend and backend
2. establish backend config, database connection, migrations, and health endpoint
3. define auth and user model
4. define recipe domain and CRUD API
5. connect frontend to live backend data
6. add RBAC and ownership enforcement
7. add admin/editor flows
8. add cloud deployment and operational polish

## Story Evaluation Rule

When planning or implementing a story, prefer the option that:

- reduces future rework
- preserves clear frontend/backend separation
- keeps the app cloud-deployable
- enforces auth and authorization in the backend
- remains understandable for incremental development

## Non-Goals For Now

- over-engineered microservices
- premature event-driven complexity
- excessive abstraction before real use cases appear
- coupling the new backend to the current hardcoded prototype data model

## Open Decisions

These still need user confirmation during future planning:

- exact backend framework
- exact ORM or query layer
- exact auth/session mechanism
- final cloud provider
- whether recipe images are stored locally in dev and in object storage in cloud
- whether recipe publication requires review workflow or immediate publishing
