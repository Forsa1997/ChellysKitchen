# Chellys Kitchen Frontend (Vite + React + MUI)

## Start (Prototype)

```bash
npm install
npm run dev
```

## Testing (verbindlich)

```bash
npm run test:unit
npm run test:integration
```

- Alle neu implementierten Features müssen **zuerst** mit Tests beschrieben werden (Red-Green-Refactor).
- Bei Änderungen an bestehendem Verhalten müssen vorhandene Tests erweitert oder neue Regressionstests ergänzt werden.
- Frontend-Tests sind zweistufig verpflichtend:
  - **Unit Tests mit Vitest** (`npm run test:unit`)
  - **Integration Tests mit Cypress** (`npm run test:integration`)
- Pull Requests gelten erst als merge-fähig, wenn beide Teststufen lokal/grün sind.

Optional API base URL (default is `http://localhost:4000`):

```bash
VITE_API_BASE_URL=http://localhost:4000
```

The recipe list loads from `GET /api/recipes` and falls back to local seed data if the API is unavailable.

## Deployment on GitHub Pages

This repository contains a workflow at `.github/workflows/deploy-frontend-pages.yml` that deploys the frontend to GitHub Pages.

### One-time GitHub setup

1. Go to **Settings → Pages** and ensure the source is **GitHub Actions**.
2. (Optional, recommended) Add a repository variable:
   - **Settings → Secrets and variables → Actions → Variables**
   - Name: `VITE_API_BASE_URL`
   - Value: URL of your deployed backend API, for example `https://your-api.example.com`

### How deployment works

- On every push to `main`, GitHub Actions builds the app in `frontend/` and deploys `frontend/dist` to GitHub Pages.
- The workflow sets `VITE_ROUTER_MODE=hash` so routes work on static hosting without server-side rewrites.
- If `VITE_API_BASE_URL` is missing, the app still works with local fallback recipe data.

For a full free-hosting walkthrough (frontend + optional backend + optional database), see `docs/free-hosting-guide.md`.
For Render-specific CI/CD setup with GitHub Actions, see `docs/render-github-actions-setup.md`.
For reproducible Render service settings, see `render.yaml`.
