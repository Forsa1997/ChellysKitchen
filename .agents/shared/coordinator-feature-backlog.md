# Chellys Kitchen – Nächste Feature-Kandidaten für den Coordinator

## Zweck dieses Dokuments
Diese Datei dient als Arbeitsgrundlage für den `$multi-agent-coordinator`, um die nächsten Umsetzungsrunden zu planen, Spezialrollen zuzuweisen und die Reihenfolge sinnvoll zu priorisieren.

## Priorisierungslogik
- **P0 (Foundation zuerst):** Alles, was nötig ist, damit aus dem Prototyp eine echte App mit persistenter Datenhaltung wird.
- **P1 (Produktkern):** Funktionen, die den Kernnutzen für reale Nutzer:innen abbilden.
- **P2 (Qualität & Wachstum):** Verbesserungen für Betrieb, UX-Reife und Skalierbarkeit.

---

## P0 – Foundation (als Nächstes umsetzen)

### 1) Backend-Grundstruktur mit persistenter Datenhaltung
**Ziel:** Weg von Mock-/Hardcoded-Daten hin zu einer echten API + DB.

**Scope:**
- Backend in TypeScript mit klaren Modulen (Routing, Service, Repository).
- Datenbankanbindung (Default: PostgreSQL).
- Erste Migrationen für Kernentitäten (`User`, `Role`, `Recipe`, `RecipeIngredient`, `RecipeStep`, `Category`, `RecipeStatus`).
- Einheitliche Fehlerstruktur und Request-Validierung.

**Coordinator-Zuweisung:**
- `$solution-architect`: Modulgrenzen, Datenmodell, Migrationsstrategie.
- `$feature-developer`: Implementierung API-Grundgerüst + DB-Zugriff.
- `$security-expert`: sichere Defaults (Input Validation, Fehler-/Leak-Vermeidung).

**Done-Kriterien (kurz):**
- Rezepte werden aus DB gelesen, nicht aus Frontend-State.
- API-Dokumentation für Kernendpunkte vorhanden.
- Lokales Starten mit reproduzierbarem Setup möglich.

---

### 2) Authentifizierung (Email/Passwort) + Session/JWT-Basis
**Ziel:** Echte Anmeldung statt Mock-Formulare.

**Scope:**
- Sign-up / Sign-in / Sign-out API.
- Passwort-Hashing (argon2/bcrypt) und minimale Passwortregeln.
- Token- oder Session-Strategie inkl. Ablauf/Refresh-Entscheidung.
- Frontend-Anbindung der bestehenden SignIn/SignUp-Screens.

**Coordinator-Zuweisung:**
- `$security-expert`: Auth-Flow, Token-Lebensdauer, Cookie/Speicherstrategie.
- `$feature-developer`: Backend + Frontend Integration.
- `$ui-designer` (gezielt): Fehlermeldungen, Lade-/Error-States.

**Done-Kriterien (kurz):**
- Nutzer:innen können sich registrieren, anmelden und abmelden.
- Passwort wird nie im Klartext gespeichert.
- Geschützte API-Routen erkennen nicht-authentifizierte Zugriffe korrekt.

---

### 3) RBAC-Grundlage (guest/member/editor/admin)
**Ziel:** Rechte im Backend durchsetzen (nicht nur im UI verstecken).

**Scope:**
- Rollenmodell in DB.
- Policy-Middleware auf API-Ebene.
- Ownership-Regeln als Startpunkt: `member` nur eigene Rezepte editieren/löschen.

**Coordinator-Zuweisung:**
- `$solution-architect`: Rollen-/Policy-Modell.
- `$security-expert`: Missbrauchsszenarien, Privilege Escalation Checks.
- `$feature-developer`: Durchgängige Enforcement-Implementierung.

**Done-Kriterien (kurz):**
- Schreiboperationen sind rollenbasiert geschützt.
- Unerlaubte Aktionen liefern konsistente 403-Antworten.

---

## P1 – Produktkern

### 4) Recipe CRUD mit Ownership & Status-Workflow
**Ziel:** Authentifizierte Nutzer:innen können Rezepte real verwalten.

**Scope:**
- Create/Read/Update/Delete für Rezepte inkl. Zutaten/Schritte.
- Statusmodell (`draft`, `published`, `archived`).
- Frontend-Formulare mit Validierung und UX-States.

**Coordinator-Zuweisung:**
- `$feature-developer`: End-to-End CRUD.
- `$ui-designer`: Formularstruktur, mobile UX, Feldhierarchie.
- `$security-expert`: Validierung, Server-seitige Autorisierung pro Aktion.

**Done-Kriterien (kurz):**
- Vollständiger CRUD-Flow im Frontend über API.
- Statuswechsel gemäß Rollen-/Ownership-Regeln.

---

### 5) Suche, Filter und Sortierung auf API-Ebene
**Ziel:** Performante, reale Rezeptsuche statt reinem Client-Filter.

**Scope:**
- Query-Parameter für Volltextsuche, Kategorie, Status, Sortierung.
- Pagination für Listenansichten.
- Frontend-Filter synchron mit URL (sharebare Suchzustände).

**Coordinator-Zuweisung:**
- `$solution-architect`: API-Contract + Performance-Ansatz.
- `$feature-developer`: Implementierung API + UI-Bindung.

**Done-Kriterien (kurz):**
- Listenansicht lädt paginiert.
- Filter/Suche funktionieren stabil bei größeren Datenmengen.

---

### 6) Medien-Strategie für Rezeptbilder
**Ziel:** Weg von Placeholder-Bildern hin zu echter Bildverwaltung.

**Scope:**
- Upload-Flow (zunächst lokal abstrahiert, cloud-ready entkoppelt).
- Validierung (Dateityp/Größe), Metadaten und Referenzen in DB.
- Sichere Auslieferung/Verlinkung.

**Coordinator-Zuweisung:**
- `$solution-architect`: Storage-Abstraktion + Cloud-Migrationspfad.
- `$security-expert`: Upload-Sicherheit, Content-Type-Prüfung.
- `$feature-developer`: API/Frontend-Integration.

**Done-Kriterien (kurz):**
- Nutzer:innen können Bilder zu Rezepten hochladen und sehen.
- Architektur erlaubt späteren Wechsel auf Managed Object Storage.

---

## P2 – Qualität, Betrieb, Skalierung

### 7) Observability & Operations-Basics
**Ziel:** Betriebssicherheit für Staging/Production erhöhen.

**Scope:**
- Strukturierte Logs, Request-ID, Fehlerkategorien.
- Health- und Readiness-Checks.
- Basis-Metriken (z. B. Request-Latenz, Fehlerquote).

### 8) Teststrategie (API + UI)
**Ziel:** Regressionen früh erkennen.

**Scope:**
- API-Integrationstests für Auth, RBAC und Rezept-CRUD.
- Frontend-Komponententests für zentrale Flows.
- CI-Checkpipeline (Lint, Tests, ggf. Typecheck).

### 9) Sprachkonsistenz (DE/EN-Strategie)
**Ziel:** Konsistente Nutzeransprache statt gemischter Copy.

**Scope:**
- Entscheidung Primärsprache (zunächst DE oder EN).
- Textaudit in bestehenden Screens.
- Vorbereitung auf i18n nur wenn notwendig.

---

## Empfohlene Umsetzungsreihenfolge (3 Iterationen)

### Iteration A (2–3 Stories)
1. Backend-Grundstruktur + DB-Migrationen
2. Auth (Sign-up/Sign-in/sign-out)
3. RBAC-Baseline

### Iteration B (2 Stories)
1. Recipe CRUD + Ownership + Status
2. Suche/Filter/Pagination (API-first)

### Iteration C (1–2 Stories)
1. Bild-Upload-Strategie
2. Observability + Testausbau

---

## Offene Entscheidungen für den Coordinator vor Kickoff
- Public Browsing ohne Login: **ja/nein**?
- Primärsprache zum Start: **Deutsch oder Englisch**?
- Backend-Framework: **Express/Fastify/Nest**?
- Auth-Transport: **HTTP-only Cookie oder Bearer Token**?
- Ziel-Cloud mittelfristig: **AWS/Azure/GCP/anderes**?

> Hinweis für den `$multi-agent-coordinator`: Wenn mehrere Spezialisten parallel arbeiten, Dateibesitz klar trennen (z. B. Architekturdoku vs. Backend-Implementierung vs. UI-Komponenten), um Merge-Konflikte zu minimieren.
