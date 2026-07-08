# Backlog

Offene Punkte aus dem App-Review (Juli 2026). Punkt 1 (Backup/Export als
Persistenz-Absicherung) und Punkt 2 (Zufallsfunktion serverseitig) sind
umgesetzt; die folgenden Punkte sind bewusst zurückgestellt.

## 3. Sicherheit härten

- [ ] Registrierung absichern: Einladungscode (z. B. Env-Variable `INVITE_CODE`)
      oder öffentliche Registrierung ganz abschalten, Accounts nur per Admin.
- [ ] Demo-Zugang entfernen: Demo-Banner auf der Startseite und den geseedeten
      `demo@chellys-kitchen.local`-Benutzer in Produktion nicht mehr anlegen.
- [ ] Default-Admin absichern: ohne gesetzte `ADMIN_EMAIL`/`ADMIN_PASSWORD`
      keinen Admin mit `admin1234` anlegen (Start verweigern oder warnen).
- [ ] Passwort-Hashing verstärken: SHA-256 in `server.mjs` durch
      `crypto.scrypt` ersetzen (bestehende Hashes beim nächsten Login migrieren).
- [ ] Session-TTL: Access-/Refresh-Tokens ablaufen lassen, Sessions-Map nicht
      unbegrenzt wachsen lassen.
- [ ] Redirect-Bug: Nach fehlgeschlagenem Token-Refresh leitet `client.ts` auf
      `/signin` um — mit HashRouter in Produktion muss es `/#/signin` sein.

## 4. Familien-Features (schlank halten)

- [ ] Zutaten-Suche: Die Volltextsuche (`filterRecipes` in
      `backend/src/queryRecipes.mjs`) zusätzlich über Zutatennamen laufen
      lassen — der Platzhalter „Rezept, Zutat oder Anlass suchen" verspricht es schon.
- [ ] Favoriten: „Lieblingsrezept"-Herz pro Benutzer (Muster analog Ratings),
      Filter „Nur Favoriten" in der Liste.
- [ ] Einkaufshilfe: Auf der Detailseite skalierte Zutatenliste kopieren/teilen
      (Web Share API) — keine eigene Listenverwaltung bauen.
- [ ] PWA-Manifest + Icons, damit die App am Handy auf den Homescreen kann.
- [ ] Kurznotizen pro Rezept („nächstes Mal weniger Salz") — einfaches
      Textfeld, keine Kommentar-Threads.

## 5. Aufräumen

- [ ] Entscheidung zweites Backend: Das Prisma/Fastify-Backend unter
      `backend/src/` läuft in Produktion nicht (Render startet `server.mjs`).
      Entweder fertig anbinden (löst Persistenz dauerhaft) oder entfernen;
      CLAUDE.md/README an die reale Architektur anpassen.
- [ ] Deprecated Wrapper-Funktionen am Ende von `frontend/src/api/client.ts`
      entfernen (~200 Zeilen, alles über `apiClient` verfügbar).
- [ ] `.idea/` aus dem Repo nehmen und in `.gitignore` aufnehmen.
- [ ] Doppelte Agent-Konfigurationen (`.copilot/`, `.github/copilot/`)
      konsolidieren.
- [ ] Frontend-Paketname von `vite-project` auf `chellys-kitchen-frontend` ändern.
- [ ] DRAFT-Workflow entscheiden: Neue Rezepte sind hart `PUBLISHED`; entweder
      Entwurfs-Flow im UI anbieten oder Status/EDITOR-Rolle vereinfachen.
