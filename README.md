# Chellys Kitchen

Die Rezept-App der Familie: Rezepte speichern, teilen, bewerten — und würfeln,
wenn keiner weiß, was es heute geben soll.

## Features

- Rezepte mit Zutaten, Schritten, Bildern, Portionsrechner und Druckansicht
- Suche über Titel, Beschreibung **und Zutaten**, Filter nach Kategorie,
  Schwierigkeit und Gesamtzeit
- **Zufälliges Rezept** (respektiert die aktiven Filter) und „Nochmal würfeln"
  auf der Detailseite
- Favoriten pro Person („Nur Favoriten"-Filter, auch für den Zufall)
- Gemeinsame Notizen pro Rezept („nächstes Mal weniger Salz")
- Zutatenliste skaliert kopieren/teilen (Einkaufshilfe)
- Bewertungen (1–5 Sterne), Rollen (Mitglied/Editor/Admin), Admin-Dashboard
- **Backup**: kompletter Export/Import (inkl. Bilder) im Admin-Dashboard
- Als PWA auf dem Handy-Homescreen installierbar

## Stack

| Teil | Technologie |
| --- | --- |
| Frontend | React 19 + Vite + Material UI (`frontend/`) |
| Backend | Node.js ohne Abhängigkeiten (`backend/server.mjs`), JSON-Datei-Store |
| Hosting | Render (siehe `render.yaml`), Deploy-Hooks via GitHub Actions |

Das Backend speichert alles in einer JSON-Datei unter `DATA_DIR` (Standard
`./.data`). Auf dem Render-Free-Tier ist dieses Verzeichnis **ephemer** —
vor jedem Redeploy im Admin-Dashboard ein Backup herunterladen und danach
wieder einspielen.

## Entwicklung

```bash
# Backend (http://localhost:4000)
cd backend && npm run dev

# Frontend (http://localhost:5173)
cd frontend && npm install && npm run dev
```

Lokale Zugänge (nur in Entwicklung, nicht in Produktion):
`demo@chellys-kitchen.local` / `demo1234` und
`admin@chellys-kitchen.local` / `admin1234`.

## Tests

```bash
cd backend && npm test    # node:test, inkl. End-to-End-Smoke-Tests
cd frontend && npm test   # Vitest + Testing Library
```

## Konfiguration (Backend)

| Variable | Bedeutung |
| --- | --- |
| `PORT` | Port, Standard 4000 |
| `DATA_DIR` | Ablage für JSON-Store und Bilder, Standard `./.data` |
| `CORS_ORIGIN` | Erlaubter Frontend-Origin |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin-Konto — in Produktion Pflicht |
| `SEED_USERS` | Optional: JSON-Array weiterer Konten, z. B. `[{"name":"Chelly","email":"c@example.com","password":"…","role":"EDITOR"}]` |

Es gibt keine öffentliche Registrierung — Konten entstehen nur über das
Admin-Dashboard oder die Umgebungsvariablen `ADMIN_EMAIL`/`SEED_USERS`.

Details zum Deployment: siehe `DEPLOYMENT.md`. Offene Ideen: `BACKLOG.md`.
