# feat: allow users to create recipes

## Änderungen
- Backend-Rezeptlisting auf `optionalAuth` umgestellt, damit eingeloggte Nutzer neben veröffentlichten Rezepten auch eigene Rezepte sehen.
- `getAllRecipes` erweitert (inkl. `q`/`pageSize`-Handling und angereicherter `meta`-Antwort).
- Testabdeckung für Sichtbarkeitslogik und Draft-Erstellung ergänzt.
- Frontend-Routing für Rezeptdetail auf `:slug` umgestellt.
- Home-Ansicht überarbeitet (Filter/Search UX, Chips, Skeletons, Empty State, Category-Integration).
- Rezeptdetailseite auf `slug`-Parametrisierung angepasst.

## API-Endpunkte
- `GET /recipes`
  - nutzt jetzt `optionalAuth` als `preHandler`.
  - bei authentifizierten Nutzern: zeigt `PUBLISHED` plus eigene Rezepte (`createdById = currentUserId`), sofern kein expliziter `status` gesetzt ist.
  - unterstützt Query-Parameter-Mapping `q`/`search`, `pageSize`/`limit`.
- Bestehende Endpunkte bleiben unverändert, Detailroute wird im Frontend über Slug konsumiert (`/recipes/:slug`).

## DB-Änderungen
- Keine Migration/Schema-Änderung in diesem Commit.
- Verhalten nutzt bestehende Felder (`status`, `createdById`, `slug`).

## UI
- HomePage:
  - neue Such-/Filterleiste mit Debounce, Kategorie-/Schwierigkeits-/Zeitfiltern, Sortierung, aktiven Filter-Chips und Reset.
  - Loading-Skeletons und verbesserter Empty State.
- Routing:
  - Rezeptdetailroute von `:id` auf `:slug` geändert.
- RecipeDetailPage:
  - Datenabruf und Rating-Mutationen auf `slug` umgestellt.

## Commands run
- `git checkout -b codex/allow-users-create-recipes`
- `git add backend/src/api/recipes/index.ts backend/src/application/recipes/index.ts backend/src/application/recipes/index.test.ts frontend/src/App.tsx frontend/src/pages/HomePage.tsx frontend/src/pages/RecipeDetailPage.tsx`
- `git commit -m "feat: allow users to create recipes"`
- `git push -u origin codex/allow-users-create-recipes`

## Test/Build Ergebnis
- Automatisierte Tests/Build in diesem Worker-Schritt nicht ausgeführt.
- Neuer Testfall hinzugefügt: `backend/src/application/recipes/index.test.ts`.

## Deployment-Hinweise
- Kein DB-Migrationsschritt erforderlich.
- Nach Deployment bitte prüfen:
  - öffentliche Rezeptliste zeigt weiterhin veröffentlichte Rezepte.
  - eingeloggte Nutzer sehen zusätzlich eigene (nicht veröffentlichte) Rezepte in der Liste.
  - Rezeptdetailrouting über Slug funktioniert für bestehende Links.
