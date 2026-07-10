# Deployment

Die App läuft auf Render, konfiguriert über `render.yaml` (Blueprint):

- **chellys-kitchen-db** — Managed Postgres (Frankfurt, Plan basic-256mb).
  Hier leben alle Daten: Rezepte, Benutzer, Bewertungen, Favoriten,
  Wochenplan und hochgeladene Bilder.
- **chellys-kitchen-api** — Node-Web-Service (Frankfurt), startet
  `backend/server.mjs`. Beim Start läuft `prisma migrate deploy`, danach
  lädt der Server den kompletten Zustand aus Postgres.
- **chellys-kitchen-web** — statische Site aus `frontend/dist` (globales
  CDN, keine Region nötig).

Ohne `DATABASE_URL` (lokale Entwicklung, Tests) nutzt das Backend weiterhin
den JSON-Datei-Store unter `DATA_DIR` — es braucht dann keine Datenbank.

## Einmalige Einrichtung

1. Auf render.com „New → Blueprint" und dieses Repository wählen.
   Die Datenbank und beide Services entstehen laut `render.yaml`
   (API und DB in Frankfurt).
2. Env-Variablen des API-Service setzen:
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Pflicht, sonst gibt es keinen Admin.
   - `ADMIN_NAME` — optionaler Anzeigename des Admin-Kontos (Standard
     `Admin`); eine Änderung benennt das Konto beim nächsten Start um.
   - `SEED_USERS` — optional, legt weitere Konten an (JSON-Array mit
     `name`, `email`, `password`, optional `role`). Eine öffentliche
     Registrierung gibt es nicht; Konten entstehen nur hierüber oder im
     Admin-Dashboard.
   - `ANTHROPIC_API_KEY` — optional, aktiviert den Rezept-Import per Foto
     (Vision-Modell). Ohne den Key antwortet der Endpoint mit einem
     verständlichen Hinweis; der Rest der App funktioniert normal.
     `PHOTO_IMPORT_MODEL` kann das verwendete Modell übersteuern
     (Standard `claude-opus-4-8`).
   - `CORS_ORIGIN` — kommt aus der `render.yaml`: kommaseparierte Liste der
     erlaubten Browser-Origins (`https://chellys-kitchen.de`, `www`-Variante
     und die Render-Fallback-URL). Bei einer neuen Domain dort erweitern.
   - `VITE_API_BASE_URL` (Frontend) — URL der API.
   `DATABASE_URL` wird automatisch aus der Blueprint-Datenbank verdrahtet.

## Eigene Domain

Die Website läuft unter `https://chellys-kitchen.de` (Custom Domain der
statischen Site; DNS: `www` als CNAME auf die onrender-Adresse, Apex als
A-Record auf Renders IP). TLS-Zertifikate stellt Render automatisch aus.
Wichtig bei Domain-Änderungen: die neue Origin in `CORS_ORIGIN`
(`render.yaml`) ergänzen, sonst blockiert der Browser die API-Aufrufe.
3. Optional in GitHub die Secrets `RENDER_BACKEND_DEPLOY_HOOK_URL` und
   `RENDER_FRONTEND_DEPLOY_HOOK_URL` hinterlegen; der Deploy-Workflow stößt
   dann bei jedem Push auf `main` einen Render-Deploy an.

## Umzug bestehender Services nach Frankfurt

Render kann die Region eines bestehenden Service **nicht** ändern — die
Services müssen einmal neu entstehen:

1. Im Admin-Dashboard der laufenden App ein **Backup herunterladen**.
2. Im Render-Dashboard die alten Services (`chellys-kitchen-api`, ggf.
   `chellys-kitchen-web`) **löschen** und den Blueprint neu syncen — die
   neuen Services entstehen laut `render.yaml` in Frankfurt, die Datenbank
   wird angelegt und verdrahtet.
3. Env-Variablen wie oben neu setzen (Werte mit `sync: false` überleben die
   Neuanlage nicht).
4. Prüfen, ob sich die Service-URLs geändert haben; ggf. `CORS_ORIGIN` und
   `VITE_API_BASE_URL` anpassen.
5. In der neuen App als Admin anmelden und das **Backup einspielen** —
   Rezepte, Benutzer, Bewertungen, Wochenplan und Bilder landen damit
   direkt in Postgres.

## Datensicherheit

Mit Postgres überleben alle Daten (inklusive hochgeladener Bilder — die
Datenbank hält die dauerhafte Kopie, die lokale Platte ist nur Cache)
Redeploys und Neustarts. Der Backup-Export im Admin-Dashboard bleibt als
zusätzliche Absicherung und für Umzüge erhalten. Der Render-Postgres-Plan
bringt eigene tägliche Backups mit.
