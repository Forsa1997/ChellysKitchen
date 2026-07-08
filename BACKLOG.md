# Backlog

Stand Juli 2026: Alle Punkte aus dem App-Review sind umgesetzt.

## Erledigt

### 1. Persistenz-Absicherung
- [x] Backup-Export/-Import im Admin-Dashboard (inkl. hochgeladener Bilder)

### 2. Zufallsfunktion
- [x] `GET /api/recipes/random` wählt serverseitig aus allen passenden Rezepten
- [x] Lotterie-Panel entfernt; Würfel-Button respektiert die aktiven Filter
- [x] „Nochmal würfeln" auf der Detailseite (ohne Wiederholung)

### 3. Sicherheit
- [x] Registrierung per Einladungscode (`INVITE_CODE`, optional) — inzwischen
      abgelöst: öffentliche Registrierung komplett entfernt, Konten entstehen
      nur noch über das Admin-Dashboard oder `SEED_USERS`/`ADMIN_EMAIL`
- [x] Demo-User/-Banner und Default-Admin nur noch in Entwicklung
- [x] Passwort-Hashing auf scrypt umgestellt (Alt-Hashes migrieren beim Login)
- [x] Session-TTL (Access 1 Tag, Refresh 30 Tage) + Refresh-Token-Rotation
- [x] Redirect nach Session-Ablauf berücksichtigt den Hash-Router

### 4. Familien-Features
- [x] Suche findet auch Zutatennamen
- [x] Favoriten pro Person + „Nur Favoriten"-Filter (gilt auch für den Zufall)
- [x] Zutatenliste skaliert kopieren/teilen (Einkaufshilfe)
- [x] PWA-Manifest (Homescreen-Installation)
- [x] Gemeinsame Notizen pro Rezept

### 5. Aufräumen
- [x] Ungenutztes Prisma/Fastify-Backend entfernt — `server.mjs` ist DAS Backend
      (Entscheidung: kein externer Datenbank-Anbieter, Backup/Restore stattdessen)
- [x] Deprecated Wrapper aus `frontend/src/api/client.ts` entfernt
- [x] `.idea/` entfernt und ignoriert; `.copilot/` + `.github/copilot/` entfernt
- [x] Frontend-Paket heißt `chellys-kitchen-frontend`
- [x] README/DEPLOYMENT/CLAUDE.md beschreiben die reale Architektur
- [x] DRAFT-Entscheidung: Rezepte erscheinen sofort (Familien-App); der
      Status-Workflow bleibt nur fürs Archivieren im Admin-Bereich

## Ideen für später (bewusst zurückgestellt)

- Zutaten in die Bring!-Einkaufsliste exportieren (nächster geplanter Schritt)
- Persistent Disk bei Render (kostenpflichtig) statt manuellem Backup
- Wochenplaner / „Was kochen wir diese Woche?"
- Rezept-Import von fremden Webseiten
- Rate-Limiting für Login-Versuche
