# Chellys Kitchen Backend

Ein bewusst schlanker Node.js-HTTP-Server (`server.mjs`). Persistenz ist
steckbar: ohne `DATABASE_URL` eine JSON-Datei unter `DATA_DIR` (Standard
`./.data`, Bilder daneben in `uploads/`), mit `DATABASE_URL` PostgreSQL
über Prisma (Schema in `prisma/`, Migrationen eingecheckt; Bilder liegen
zusätzlich als Bytes in der DB und werden beim Start auf die Platte
zurückgeschrieben).

## Start

```bash
npm run dev    # mit --watch
npm start      # Produktion
npm test       # node:test inkl. End-to-End-Smoke-Tests
```

Server-Standard: `http://localhost:4000`

## Endpunkte (Auszug)

- `GET /health`
- `POST /api/auth/login|refresh|logout`, `GET /api/auth/me` (keine öffentliche Registrierung; Login-Versuche sind rate-limitiert)
- `GET /api/recipes` (Suche/Filter/Pagination), `GET /api/recipes/random`
- `GET /api/recipes/:idOrSlug/bring` (schema.org-Seite für den Bring!-Import, `?servings=` skaliert)
- `POST /api/recipes/import` (Rezept von fremder Webseite per schema.org-JSON-LD übernehmen)
- `GET|DELETE /api/weekplan`, `POST /api/weekplan/:day`, `DELETE /api/weekplan/:day/:recipeId`
- `GET /api/weekplan/bring` (aggregierte Einkaufsliste der Woche für Bring!)
- `GET|POST|PATCH|DELETE /api/recipes/:idOrSlug` (+ `/publish`, `/archive`, `/duplicate`)
- `PUT|DELETE /api/recipes/:slug/favorite`, `PATCH /api/recipes/:slug/notes`
- `GET|POST|DELETE /api/recipes/:slug/rating`
- `GET|POST|PATCH|DELETE /api/categories`
- `GET|POST /api/admin/users`, `PATCH /api/admin/users/:id/role`, `GET /api/admin/recipes`
- `GET /api/admin/export`, `POST /api/admin/import` (Backup)
- `POST /api/uploads`, `GET /uploads/:file`

## Umgebungsvariablen

| Variable | Bedeutung |
| --- | --- |
| `PORT` | Port, Standard 4000 |
| `DATA_DIR` | Datenablage, Standard `./.data` (mit Postgres nur Bild-Cache) |
| `DATABASE_URL` | PostgreSQL-Verbindung — aktiviert die Prisma-Persistenz |
| `CORS_ORIGIN` | Erlaubter Frontend-Origin |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin-Konto — in Produktion Pflicht |
| `ADMIN_NAME` | Anzeigename des Admin-Kontos (Standard `Admin`; benennt auch ein bestehendes Konto um) |
| `SEED_USERS` | Optional: JSON-Array weiterer Konten (`[{"name":…,"email":…,"password":…,"role":…}]`) |
| `NODE_ENV` | `production` deaktiviert Demo-/Default-Zugänge |
