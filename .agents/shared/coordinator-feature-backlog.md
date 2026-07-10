# Chellys Kitchen – Nächste Feature-Kandidaten

## Zweck dieses Dokuments
Diese Datei dient als Arbeitsgrundlage, um die nächsten Umsetzungsrunden zu planen, passende Skills auszuwählen und die Reihenfolge sinnvoll zu priorisieren.

## Priorisierungslogik
- **P0 (Foundation zuerst):** Alles, was nötig ist, damit aus dem Prototyp eine echte App mit persistenter Datenhaltung wird.
- **P1 (Produktkern):** Funktionen, die den Kernnutzen für reale Nutzer:innen abbilden.
- **P2 (Qualität & Wachstum):** Verbesserungen für Betrieb, UX-Reife und Skalierbarkeit.

---

## P0 – Foundation ✅ ABGESCHLOSSEN

### 1) ✅ Backend-Grundstruktur mit persistenter Datenhaltung – DONE
- TypeScript Backend mit Fastify (port 4000)
- PostgreSQL mit Prisma ORM
- Migrations und Schema für User, Role, Recipe, Category, Rating vorhanden
- Layered Architecture (Domain, Application, Infrastructure, API)
- Zod Validierung für alle Inputs implementiert

### 2) ✅ Authentifizierung (Email/Passwort) + JWT-Basis – DONE
- Sign-up / Sign-in / Sign-out API vollständig
- JWT mit Access + Refresh Tokens
- bcrypt Passwort-Hashing
- Frontend SignIn/SignUp Seiten integriert
- requireAuth Middleware implementiert

### 3) ✅ RBAC-Grundlage (guest/member/editor/admin) – DONE
- 4-stufiges Rollenmodell in DB (GUEST, MEMBER, EDITOR, ADMIN)
- Policy-Middleware auf API-Ebene
- Ownership-Enforcement: Member darf nur eigene Rezepte editieren
- 403 Fehler bei unerlaubten Aktionen

---

## P1 – Produktkern ✅ ABGESCHLOSSEN

### 4) ✅ Recipe CRUD mit Ownership & Status-Workflow – DONE
- Complete Create/Read/Update/Delete API für Rezepte
- Statusmodell (DRAFT, PUBLISHED, ARCHIVED) in DB
- Ownership-Enforcement: nur Creator oder Admin können editieren
- Frontend: HomePage (Rezept-Liste), CreateRecipePage, RecipeDetailPage
- Rating-System (1-5 Sterne, ein Rating pro User pro Rezept)
- Kategorie-Support vorhanden

### 5) ✅ Suche, Filter und Sortierung auf API-Ebene – DONE
- API Query-Parameter: `q`/`search`, `category`, `difficulty`, `status`, `sort`
- Sortierung: `newest`, `oldest`, `title_asc`, `title_desc`
- Pagination: `page`, `limit`/`pageSize` (max 50)
- Filter nach Gesamtkochzeit (`maxTotalMinutes`)
- Frontend HomePage mit allen Filtern integriert
- URL-Synchronisierung für sharebare Suchergebnisse

### 6) ✅ Medien-Strategie für Rezeptbilder – DONE
- Image Upload API mit Bildverarbeitung (sharp)
- Validierung von Dateityp und Größe
- Storage-Abstraction in `storage/` Infrastruktur
- Bilder in Recipe.img gespeichert
- Frontend-Integration in RecipeDetailPage

---

## P2 – Qualität, Betrieb, Skalierung

### 7) ✅ Observability & Operations-Basics – DONE (2026-07-10)
- ✅ Strukturierte JSON-Request-Logs (Request-ID, Methode, Pfad, Status, Dauer)
- ✅ Request-ID Tracking: `x-request-id` wird übernommen oder generiert und in jeder Antwort gesetzt
- ✅ Basis-Metriken: `GET /metrics` mit Request-Zählern pro Statusklasse, Fehlerquote (5xx) und Latenz (avg/p95/max)
- ✅ Health-Check Endpoint vorhanden
- 📝 Optional später: Metriken-Export im Prometheus-Format

### 8) ✅ Teststrategie (API + UI) – DONE (2026-07-10)
- ✅ API-Tests: recipes, cors, uploads, sessions, rate-limit, persistence u.v.m. (`src/*.test.mjs`)
- ✅ Auth-Integrationstests: Login, Fehl-Login, Refresh-Rotation, Logout, /me (`serverIntegration.test.mjs`)
- ✅ RBAC-Szenarien: 401 ohne Auth, 403 für MEMBER auf Admin-Endpoints, 201 für ADMIN
- ✅ Observability-Unit-Tests (`observability.test.mjs`)
- ✅ CI-Pipeline: GitHub Actions (Lint, Typecheck, Tests, Build) auf PRs **und** push auf main

### 9) ✅ Sprachkonsistenz (DE/EN-Strategie) – ENTSCHIEDEN (2026-07-10)
**Entscheidung: Deutsch ist Primärsprache für alle nutzerseitigen Texte.**
- Alle API-Fehlermeldungen und UI-Texte auf Deutsch (im Backend bereits konsequent umgesetzt)
- Code (Bezeichner, Commits) und technische Kommentare bleiben Englisch
- Kein i18n-Framework, solange nur eine Sprache ausgeliefert wird
- 📝 Folgeaufgabe: Frontend-Restbestände auf Deutsch vereinheitlichen (MUI-Standardtexte, gemischte CustomText-Labels)

---

## Bereits gelieferte Features (Stand 2026-07-10)

Über P0/P1 hinaus sind inzwischen umgesetzt:
- Wochenplaner mit aggregierter Zutatenliste
- Export der Einkaufsliste zu Bring!
- Rezept-Import per URL (schema.org/JSON-LD mit Fallback) und per Foto (Gemini)
- Backup/Restore (Admin-Export/-Import inkl. Bilder)
- Favoriten, Zufallsrezept, Admin-Dashboard mit Nutzerverwaltung
- Login-Rate-Limiting, Session-TTL mit Refresh-Token-Rotation, scrypt-Passwörter

## P3 – Feature-Kandidaten (nächste Produkt-Iteration)

Noch nicht priorisierte Ideen:
1. **Rezept-Skalierung** – Zutatenmengen dynamisch an Portionszahl anpassen
2. **Kommentare auf Rezepten** – zusätzlich zu Sternebewertungen
3. **Rezept-Export als PDF** – Druckansicht / Teilen außerhalb der App
4. **Erweiterte Metadaten** – Allergene, Ernährungsform (vegetarisch/vegan), Saison
5. **Sammlungen** – eigene Rezeptlisten über Favoriten hinaus (z.B. "Weihnachten")
6. **Koch-Modus** – Schritt-für-Schritt-Ansicht mit großen Schriften, Display-Wachhalten

---

## Offene Entscheidungen

### Cloud-Strategie mittelfristig
- **Options:** AWS S3, Azure Blob Storage, GCP Cloud Storage
- **Impact:** Image-Upload Infrastruktur
- **Current:** Local Storage, aber abstrakt genug für Migration

### CI/CD Pipeline
- **Status:** ✅ Konfiguriert – GitHub Actions (`.github/workflows/ci.yml`) mit Lint, Typecheck, Tests und Build für Frontend + Backend, auf PRs und push nach main; zusätzlich Deploy- und Nightly-Security-Workflows

> **Hinweis:** P0–P2 sind abgeschlossen. Nächster Fokus: P3-Feature-Kandidaten priorisieren.
