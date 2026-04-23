# Kostenfrei hosten: klare Empfehlung + Schritt-für-Schritt

Stand: 23. April 2026

## Kurzempfehlung (für den Start)

Für dieses Repository ist der einfachste kostenfreie Start:

1. **Frontend:** GitHub Pages (bereits als Workflow vorbereitet)
2. **Backend (optional):** Render Free Web Service
3. **Datenbank (optional, wenn ihr auf echte Persistenz umstellt):** Supabase Free (PostgreSQL)

Warum genau diese Kombination?

- GitHub Pages hostet statische Seiten kostenlos in öffentlichen Repos.
- Render bietet kostenlose Web Services für Prototypen (mit Spin-down bei Inaktivität).
- Supabase bietet einen Free-Plan für PostgreSQL mit begrenzten, aber brauchbaren Ressourcen für MVPs.

Wenn du stattdessen alles möglichst zentral bei Render betreiben willst, siehe auch: `docs/render-github-actions-setup.md`.

## Wichtiger Hinweis zum aktuellen Stand des Repos

Aktuell verwendet das Backend noch lokale Daten (`backend/data/recipes.mjs`). Eine externe Datenbank ist deshalb **noch nicht zwingend** nötig, bis Backend-Endpunkte auf echte DB-Abfragen umgestellt wurden.

---

## Schritt 1: Frontend kostenlos auf GitHub Pages deployen

Voraussetzungen:

- Repo liegt auf GitHub
- Hauptbranch heißt `main`

Schritte:

1. **Workflow-Datei prüfen**
   - Datei: `.github/workflows/deploy-frontend-pages.yml`
   - Sie baut bei Push auf `main` und deployed auf GitHub Pages.

2. **Pages-Quelle in GitHub setzen**
   - GitHub Repo öffnen → **Settings** → **Pages**
   - Bei Source: **GitHub Actions** auswählen

3. **(Optional) Backend-URL als Variable hinterlegen**
   - **Settings** → **Secrets and variables** → **Actions** → **Variables**
   - Neue Variable:
     - Name: `VITE_API_BASE_URL`
     - Wert (Beispiel): `https://dein-backend.onrender.com`

4. **Deployment starten**
   - Code nach `main` pushen oder Workflow manuell ausführen
   - Ergebnis unter:
     - `https://<github-user>.github.io/<repo-name>/`

5. **Routing-Check**
   - Der Workflow setzt `VITE_ROUTER_MODE=hash`, damit Routen auf statischem Hosting funktionieren.

---

## Schritt 2: (Optional) Backend kostenlos auf Render deployen

Nur nötig, wenn die API öffentlich erreichbar sein soll.

1. Bei Render anmelden: `https://render.com`
2. **New +** → **Web Service**
3. GitHub-Repo verbinden
4. Service konfigurieren:
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: *(leer lassen, da kein Build nötig)*
   - Start Command: `npm run start`
5. Plan: **Free**
6. Deploy starten
7. Die erzeugte URL kopieren, z. B. `https://chellys-kitchen-api.onrender.com`
8. Diese URL als `VITE_API_BASE_URL` im GitHub-Repo (Actions Variables) speichern
9. Frontend neu deployen (Push oder Workflow erneut ausführen)

Hinweis: Free Web Services bei Render schlafen bei Inaktivität ein, der erste Request kann daher verzögert sein.

---

## Schritt 3: (Optional) Datenbank kostenlos hosten (Supabase)

Nur nötig, wenn ihr Backend auf echte DB-Zugriffe erweitert.

1. Bei Supabase anmelden: `https://supabase.com`
2. Neues Projekt erstellen (Free Plan)
3. Region auswählen (möglichst nah an euren Nutzern/Backend)
4. In Supabase Verbindungsdaten öffnen (Postgres URI/Host/User/Passwort)
5. Im Backend-Host (z. B. Render) als Umgebungsvariable setzen, z. B.:
   - `DATABASE_URL=postgresql://...`
6. Backend-Code so erweitern, dass statt `recipes.mjs` die DB genutzt wird
7. Migrationen ausführen und Healthcheck testen

---

## Kostenfrei bleiben: praktische Leitplanken

- Public Repository für GitHub Pages Free nutzen
- Render Free nur für Test/MVP (nicht für kritische Produktion)
- Supabase Free Limits im Blick behalten (Projekt-/Ressourcenlimits)
- Wenn ihr regelmäßig Sleep/Limit-Probleme habt:
  - zuerst Backend auf bezahlten kleinen Plan upgraden
  - danach ggf. DB-Plan upgraden
