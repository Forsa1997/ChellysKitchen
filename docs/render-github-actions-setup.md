# Render + GitHub Actions: Was ich von dir brauche

Stand: 23. April 2026

## Kurzantwort

Damit ich Render-Deploys aus GitHub Actions zuverlässig automatisieren kann, brauche ich von dir:

1. **Deploy Hook URL vom Backend-Service** (Render Web Service)
2. **Deploy Hook URL vom Frontend-Service** (Render Static Site oder Web Service)
3. (Falls DB genutzt wird) Bestätigung, dass die DB-Umgebungsvariablen im Backend-Service gesetzt sind

In diesem Repo ist dafür bereits eine Action hinterlegt:

- `.github/workflows/deploy-render.yml`

Die Action triggert Render direkt per Deploy Hook.

## Einschätzung zu deinen Screenshots

Ja, das sind die richtigen zwei Render-Seiten (Web Service + Static Site).  
Beim Web Service sieht man aber einen Build-Fehler mit `npm`-Hilfeausgabe – das passt typischerweise zu fehlenden/falschen Commands oder falschem Root Directory.

In diesem Repo gibt es jetzt zusätzlich eine `render.yaml`, damit diese Einstellungen konsistent und reproduzierbar sind.

---

## Warum Deploy Hooks statt Render API Key?

Für den Start ist das die einfachste und sicherste Variante:

- Kein breit berechtigter API-Key in GitHub nötig
- Pro Service ein klarer Hook
- Weniger Setup-Aufwand

---

## Exakte Schritte, die du jetzt durchführen musst

## 1) Render Services erstellen (einmalig)

### Option A (empfohlen): Blueprint aus `render.yaml`

1. Render Dashboard → **New +** → **Blueprint**
2. Repo auswählen
3. Render liest `render.yaml` und erstellt:
   - `chellys-kitchen-db` (PostgreSQL, Free Plan)
   - `chellys-kitchen-api` (Web Service, `backend/`, `npm ci`, `npm run start`)
   - `chellys-kitchen-web` (Static Site, `frontend/`, `npm ci && npm run build`, `dist`)
4. Alle Services auf Plan **Free** deployen

Die API bekommt dabei `DATABASE_URL` automatisch aus der Blueprint-DB (`fromDatabase.connectionString`).

Datei: `render.yaml`

### Backend
- In Render: **New +** → **Web Service**
- Repo verbinden
- Root Directory: `backend`
- Build Command: `npm ci`
- Start Command: `npm run start`
- Plan: Free

### Frontend
Du hast zwei Optionen:

- **A (empfohlen): Static Site**
  - Root Directory: `frontend`
  - Build Command: `npm ci && npm run build`
  - Publish Directory: `dist`
- **B: Web Service** (falls du SSR/Node brauchst; aktuell nicht nötig)

---

## 2) Deploy Hook URLs in Render erzeugen

Für **jeden** Service:

1. Service öffnen
2. **Settings** → **Deploy Hook** (oder „Build & Deploy“ je nach UI)
3. Hook erstellen
4. URL kopieren

Du brauchst danach:

- `RENDER_BACKEND_DEPLOY_HOOK_URL`
- `RENDER_FRONTEND_DEPLOY_HOOK_URL`

---

## 3) GitHub Secrets setzen

Im GitHub-Repo:

- **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Anlegen:

- `RENDER_BACKEND_DEPLOY_HOOK_URL` = `<deine-backend-hook-url>`
- `RENDER_FRONTEND_DEPLOY_HOOK_URL` = `<deine-frontend-hook-url>`

---

## 4) Frontend mit Backend verbinden

Im Render-Frontend-Service Environment Variable setzen:

- `VITE_API_BASE_URL=https://<dein-backend-service>.onrender.com`

Dann Frontend neu deployen.

---

## 5) Datenbank (Render Free) anbinden

### Wenn du den Blueprint aus `render.yaml` nutzt (empfohlen)

Du musst **keine** `DATABASE_URL` manuell setzen. Die Zuordnung passiert im Blueprint über:

- Service `chellys-kitchen-db` (PostgreSQL)
- API-EnvVar `DATABASE_URL` mit `fromDatabase.connectionString`

### Wenn du manuell statt Blueprint erstellst

1. In Render eine Free Postgres DB anlegen
2. In Render DB-Verbindungsstring kopieren (Internal/External URL)
3. Im Backend-Service als Environment Variable setzen, z. B.:
   - `DATABASE_URL=postgres://...`
4. Backend-Code auf DB umstellen (aktuell nutzt dieses Repo noch lokale Daten in `backend/data/recipes.mjs`)

---

## Was ich als Nächstes von dir konkret brauche

Schick mir bitte:

1. Ob das Frontend als **Static Site** oder **Web Service** laufen soll
2. Ob du die zwei Deploy-Hooks bereits erstellt hast
3. Falls ja: Bestätigung, dass die zwei GitHub Secrets gesetzt sind (Werte musst du mir nicht senden)
4. Ob du auf Render bereits mit Blueprint (`render.yaml`) neu aufgesetzt hast oder die bestehenden Services manuell korrigierst

Danach kann ich dir im nächsten Schritt die Workflows noch um Health-Checks erweitern (z. B. `/health` nach Backend-Deploy prüfen).
