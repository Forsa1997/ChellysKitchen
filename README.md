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
- **Rezept-Import**: per Link (schema.org-Rezeptseiten, z. B. Chefkoch) oder
  **per Foto** (Kochbuchseite/handgeschriebener Zettel, Vision-Modell —
  Google Gemini; benötigt `GEMINI_API_KEY` auf dem Server). Anderssprachige
  Fotorezepte werden beim Import ins Deutsche übersetzt.
- Bewertungen (1–5 Sterne), Rollen (Mitglied/Editor/Admin), Admin-Dashboard
- **Backup**: kompletter Export/Import (inkl. Bilder) im Admin-Dashboard
- **Kochmodus** mit Schrittansicht, Wake-Lock und direkt startbaren Timern aus
  Zeitangaben im Rezepttext
- Als PWA auf dem Handy-Homescreen installierbar

## Stack

| Teil | Technologie |
| --- | --- |
| Frontend | React 19 + Vite + Material UI (`frontend/`) |
| Backend | Node.js (`backend/server.mts`), PostgreSQL in Produktion und JSON-Datei-Store lokal |
| Hosting | Render (siehe `render.yaml`), Deploy-Hooks via GitHub Actions |

Mit `DATABASE_URL` speichert das Backend Rezepte, Benutzer und Bilder dauerhaft
in PostgreSQL. Ohne Datenbankverbindung nutzt die lokale Entwicklung weiterhin
eine JSON-Datei unter `DATA_DIR` (Standard `./.data`). Der Backup-Export im
Admin-Dashboard ist in beiden Betriebsarten als zusätzliche Absicherung
empfohlen, etwa vor größeren Änderungen oder einem Umzug.

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
| `DATABASE_URL` | PostgreSQL-Verbindung — aktiviert die Prisma-Persistenz (Produktion) |
| `CORS_ORIGIN` | Erlaubter Frontend-Origin |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin-Konto — in Produktion Pflicht |
| `ADMIN_NAME` | Anzeigename des Admin-Kontos (Standard `Admin`) |
| `SEED_USERS` | Optional: JSON-Array weiterer Konten, z. B. `[{"name":"Chelly","email":"c@example.com","password":"…","role":"EDITOR"}]` |
| `GEMINI_API_KEY` | Aktiviert den Rezept-Import per Foto über Google Gemini |
| `PHOTO_IMPORT_MODEL` | Optionales Gemini-Modell, Standard `gemini-3.5-flash` |

Es gibt keine öffentliche Registrierung — Konten entstehen nur über das
Admin-Dashboard oder die Umgebungsvariablen `ADMIN_EMAIL`/`SEED_USERS`.

Details zum Deployment: siehe `DEPLOYMENT.md`. Offene Ideen: `BACKLOG.md`.
