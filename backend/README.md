# Chellys Kitchen Backend (Prototype)

## Start

```bash
npm run dev
```

Server default: `http://localhost:4000`

## Endpoints

- `GET /health`
- `GET /api/recipes`

## Hosting note

GitHub Pages can only host static files (like the frontend build), not this Node.js backend and not a database.

Typical backend hosting options:

- Render (Web Service)
- Railway
- Fly.io
- Northflank
- AWS App Runner / ECS / Lambda
- Google Cloud Run
- Azure Container Apps

Typical managed database options (PostgreSQL focus):

- Neon
- Supabase (managed Postgres + extras)
- Railway Postgres
- Render Postgres
- Aiven for PostgreSQL
- AWS RDS (PostgreSQL)
- Google Cloud SQL (PostgreSQL)
- Azure Database for PostgreSQL

For a concrete free-start recommendation and exact setup steps, see `docs/free-hosting-guide.md`.
For Render-specific CI/CD setup with GitHub Actions, see `docs/render-github-actions-setup.md`.
For reproducible Render service settings, see `render.yaml`.
