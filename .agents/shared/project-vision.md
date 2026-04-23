# Chellys Kitchen Project Vision

## Current Codebase Snapshot

- `backend/` is currently empty. There is no API, persistence layer, authentication service, or database schema yet.
- `frontend/` is a React, TypeScript, Vite, and Material UI prototype.
- The recipe list is hardcoded in [`frontend/src/components/MainContent.tsx`](../../frontend/src/components/MainContent.tsx).
- Recipe detail rendering is a UI-only overlay in [`frontend/src/components/RecipeDetailView.tsx`](../../frontend/src/components/RecipeDetailView.tsx).
- Sign-in and sign-up are mock forms without real backend integration in [`frontend/src/components/SignIn.tsx`](../../frontend/src/components/SignIn.tsx) and [`frontend/src/components/SignUp.tsx`](../../frontend/src/components/SignUp.tsx).
- The current prototype mixes German and English copy and contains placeholder data, placeholder imagery, and some encoding artifacts. Do not treat those as product requirements.

## What Should Be Preserved From the Prototype

- Keep the overall Chellys Kitchen brand feeling: personal, warm, inviting, and recipe-centered.
- Keep Material UI as the design system and implementation foundation for the frontend.
- Keep the useful UI ideas from the prototype:
  - a recipe overview with cards
  - search and category filtering
  - a richer recipe detail view
  - dedicated authentication screens
- Use the existing theme and branding files as inspiration, not as architectural constraints:
  - [`frontend/src/AppTheme.tsx`](../../frontend/src/AppTheme.tsx)
  - [`frontend/src/themePrimitives.ts`](../../frontend/src/themePrimitives.ts)
  - [`frontend/src/components/SitemarkIcon.tsx`](../../frontend/src/components/SitemarkIcon.tsx)

## Product Goal

Chellys Kitchen should become a real web application where recipes are stored persistently in a database, managed through a dedicated frontend and backend, and protected by authentication and role-based permissions.

## Product Principles

- Build for real persistence. Recipe data must live in a database, not in frontend component state.
- Keep frontend and backend clearly separated.
- Use authentication so signed-in users can create and manage recipes.
- Use role-based permissions so different users can perform different actions.
- Prefer a clean rebuild over trying to evolve the current prototype into production architecture.
- Preserve visual continuity with the prototype where it adds product value.
- Keep the system deployable to a cloud provider without major redesign.

## Default Functional Scope

- Public or semi-public recipe browsing
- Recipe list with search and filter capabilities
- Detailed recipe view with ingredients, steps, and metadata
- User registration, sign-in, and sign-out
- Authenticated recipe creation
- Recipe editing and deletion based on role and ownership
- Role-aware administration or moderation capabilities

## Default Domain Model Assumptions

Use these as working assumptions until the user refines them:

- `User`
- `Role`
- `Recipe`
- `RecipeIngredient`
- `RecipeStep`
- `RecipeCategory` or tags
- `RecipeStatus` such as `draft`, `published`, and `archived`
- Audit metadata such as `createdBy`, `createdAt`, `updatedAt`

## Default Role Assumptions

Use these as the initial RBAC baseline unless the user defines a different model:

- `guest`: browse recipes that are allowed to be visible without authentication
- `member`: create recipes and manage own recipes
- `editor`: review, edit, publish, or curate recipes beyond own content
- `admin`: manage users, roles, categories, and application-wide settings

## UX and Design Direction

- Stay with Material UI.
- Keep the experience friendly, clear, and recipe-first rather than looking like a generic blog template.
- Preserve the airy layouts, rounded surfaces, card-based browsing, and warm brand cues from the current prototype.
- The pink Chellys Kitchen wordmark can remain an inspiration, but the overall UI should feel more intentional and production-ready.
- Use a consistent language strategy. The current mix of German and English should be cleaned up in future implementation work.
- Design for mobile and desktop from the start.

## Technical Direction

- Frontend: React + TypeScript + Vite + Material UI
- Backend: dedicated API layer
- Persistence: relational database
- Authentication: email/password as the baseline
- Authorization: RBAC enforced in the backend first and reflected in the frontend
- API and database become the source of truth; the frontend must not own durable recipe state
- Deployment target: cloud-hosted environment

## Cloud Hosting Direction

- The application should be designed so it can be deployed cleanly to a cloud provider later.
- Prefer stateless application services where possible.
- Store persistent data in managed infrastructure such as a hosted relational database and object storage when needed.
- Keep environment-specific configuration outside source code.
- Assume separate environments such as local development, staging, and production.
- Avoid solutions that depend on manual server tweaking or machine-local state.
- Treat observability, deployment repeatability, and secret management as first-class concerns rather than afterthoughts.

## Working Technical Assumptions

Use these only as defaults until the user makes explicit choices:

- TypeScript end to end is preferred
- Node.js backend is the default assumption
- PostgreSQL is the default database assumption
- Social login can be deferred until after core email/password auth works
- Container-friendly deployment is preferred
- Managed cloud services are preferred over self-operated infrastructure where that reduces operational complexity

## Architecture Guidance For Future Stories

- A clean start is allowed and preferred if the story touches foundational architecture.
- Do not bend the new system around the current hardcoded component structure.
- Extract domain types, API contracts, and permission logic into dedicated modules instead of page components.
- Enforce sensitive behavior in the backend, not only in the UI.
- Keep stories incremental, but ensure the resulting architecture still points toward the target product.
- Keep deployment concerns in mind early: configuration, secrets, migrations, health checks, and environment separation should fit a cloud deployment model.

## Multi-Agent Working Agreement

- Every specialist should read this file before planning, reviewing, or implementing work.
- `$multi-agent-coordinator` should use this file as the shared baseline when splitting stories across specialists.
- `$solution-architect` should use it to prevent accidental prototype-driven architecture.
- `$ui-designer` should use it to preserve the desired visual identity while improving UX quality.
- `$security-expert` should use it to enforce backend-first auth and authorization thinking.
- `$feature-developer` should use it to keep implementation aligned with the intended product, not just the current mock UI.
- All specialists should prefer decisions that remain easy to deploy, operate, and secure in a cloud environment.

## Open Product Questions

These are not blockers for documenting the vision, but they should be clarified before deeper implementation:

- Should recipes be publicly visible without login, or only after authentication?
- Should there be a moderation or publishing workflow, or are recipes immediately visible after creation?
- Which UI language should be primary at launch: German only or multilingual?
- Should users be able to upload their own recipe images?
- Which exact backend framework and deployment target do you prefer?
- Do you want only RBAC, or also ownership rules such as "members can edit only their own recipes"?
- Which cloud provider do you expect to use later?
