# Chellys Kitchen Frontend (Vite + React + MUI)

## Start (Prototype)

```bash
npm install
npm run dev
```

Optional API base URL (default is `http://localhost:4000`):

```bash
VITE_API_BASE_URL=http://localhost:4000
```

The recipe list loads from `GET /api/recipes` and falls back to local seed data if the API is unavailable.
