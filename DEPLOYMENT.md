# Deployment

Die App läuft auf Render, konfiguriert über `render.yaml` (Blueprint):

- **chellys-kitchen-api** — Node-Web-Service, startet `backend/server.mjs`
  (keine Datenbank, keine npm-Abhängigkeiten).
- **chellys-kitchen-web** — statische Site aus `frontend/dist`.

## Einmalige Einrichtung

1. Auf render.com „New → Blueprint" und dieses Repository wählen.
2. Env-Variablen setzen:
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Pflicht, sonst gibt es keinen Admin.
   - `ADMIN_NAME` — optionaler Anzeigename des Admin-Kontos (Standard
     `Admin`); eine Änderung benennt das Konto beim nächsten Start um.
   - `SEED_USERS` — optional, legt weitere Konten an (JSON-Array mit
     `name`, `email`, `password`, optional `role`). Eine öffentliche
     Registrierung gibt es nicht; Konten entstehen nur hierüber oder im
     Admin-Dashboard.
   - `CORS_ORIGIN` — URL der Web-App (z. B. `https://chellys-kitchen-web.onrender.com`).
   - `VITE_API_BASE_URL` (Frontend) — URL der API.
3. Optional in GitHub die Secrets `RENDER_BACKEND_DEPLOY_HOOK_URL` und
   `RENDER_FRONTEND_DEPLOY_HOOK_URL` hinterlegen; der Deploy-Workflow stößt
   dann bei jedem Push auf `main` einen Render-Deploy an.

## ⚠️ Daten überleben keinen Redeploy (Free Tier)

Der JSON-Store und die hochgeladenen Bilder liegen unter `DATA_DIR=./.data`
im ephemeren Dateisystem. **Vor jedem Redeploy**: Admin-Dashboard → Backup
herunterladen. **Nach dem Redeploy**: Backup wieder einspielen.

Dauerhafte Alternative: Persistent Disk (Render, kostenpflichtig) anhängen
und `DATA_DIR` auf den Mount-Pfad zeigen lassen — siehe auskommentierten
`disk`-Block in `render.yaml`.

## Lokale Produktion

```bash
cd backend && NODE_ENV=production ADMIN_EMAIL=... ADMIN_PASSWORD=... npm start
cd frontend && npm run build && npm run preview
```
