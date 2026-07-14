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
- [x] Zutaten an die Bring!-Einkaufsliste senden (Deeplink; das Backend liefert
      dafür eine öffentliche schema.org-Seite pro Rezept)
- [x] Wochenplaner („Was kochen wir diese Woche?") mit aggregierter
      Bring!-Einkaufsliste für die ganze Woche
- [x] Rezept-Import von fremden Webseiten (schema.org-JSON-LD)
- [x] PWA-Manifest (Homescreen-Installation)
- [x] Gemeinsame Notizen pro Rezept

### 5. Aufräumen
- [x] Ungenutztes Prisma/Fastify-Backend entfernt — `server.mts` ist DAS Backend
      (Entscheidung: kein externer Datenbank-Anbieter, Backup/Restore stattdessen)
- [x] Deprecated Wrapper aus `frontend/src/api/client.ts` entfernt
- [x] `.idea/` entfernt und ignoriert; `.copilot/` + `.github/copilot/` entfernt
- [x] Frontend-Paket heißt `chellys-kitchen-frontend`
- [x] README/DEPLOYMENT/CLAUDE.md beschreiben die reale Architektur
- [x] DRAFT-Entscheidung: Rezepte erscheinen sofort (Familien-App); der
      Status-Workflow bleibt nur fürs Archivieren im Admin-Bereich

### 6. Persistenz

- [x] PostgreSQL via Prisma als Produktions-Persistenz (Render Frankfurt);
      JSON-Datei-Store bleibt für Entwicklung/Tests — damit ist die
      „kein externer Datenbank-Anbieter"-Entscheidung aus Punkt 5 bewusst
      revidiert
- [x] Hochgeladene Bilder liegen mit in der Datenbank und überleben Redeploys

### 7. Nachzügler

- [x] Rate-Limiting für Login-Versuche (pro IP+Konto und pro Konto,
      Standard 8 Fehlversuche / 10 Minuten)
- [x] Rezept duplizieren („Variante anlegen") — Kopie gehört dem
      Duplizierenden, Bewertungen/Notizen starten leer

## Ideen für später (bewusst zurückgestellt)

Stand Juli 2026, gesammelt aus einem Ideen-Review. Priorität: Rezept-Import
per Foto steht oben, weil er den initialen Rezeptbestand am meisten
beschleunigt.

### Rezept-Import erweitern
- [x] Foto-Import: Zutatenliste/Rezept von einem Foto (Kochbuch, handschriftlicher
      Zettel) per Vision-Modell erfassen — umgesetzt mit Google Gemini
      (`POST /api/recipes/import/photo`, aktiv mit `GEMINI_API_KEY`)
- [x] Fallback-Import für Seiten ohne schema.org/JSON-LD (einfaches HTML-Parsing) —
      umgesetzt: erst Microdata (`itemprop`), dann Überschriften-Heuristik
      („Zutaten"/„Zubereitung" + Listen bzw. Absätze)

### Kochen im Alltag
- [x] Kochmodus / Wake-Lock: Vollbild, große Schrift, Bildschirm bleibt an
      (Screen Wake Lock API), Schritt-für-Schritt statt Fließtext — umgesetzt
      als „Kochmodus"-Button auf der Detailseite (Zutatenübersicht in der
      gewählten Portionsgröße, dann ein Schritt pro Seite)
- [x] Timer direkt aus dem Rezepttext: Zeitangaben klickbar → startet Countdown
- [ ] Mengen-/Einheiten-Umrechner (g ↔ ml ↔ Tasse/EL, °C ↔ Umluft-Hinweis)

### Familien-Organisation
- [ ] Essensplan-Historie / "Wiederholungs-Cooldown": zuletzt gekochte Rezepte
      beim Würfeln/Wochenplan niedriger gewichten statt nur hart auszuschließen
- [ ] Notizen als Kommentar-Thread (Autor + Zeitstempel) statt ein gemeinsames,
      überschreibbares Textfeld pro Rezept
- [ ] Essensplan-Vorlagen speichern und wiederverwenden
- [ ] Wochenplan als iCal-Feed exportieren (Familienkalender-Sync)

### Rezeptwelt (3D-Foodtruck-Festival)
- [ ] „Besucher-Modus": mit Steuerkreuz/Joystick in Ego-Perspektive über den
      Festivalplatz laufen statt nur um ihn zu orbiten; Trucks öffnen das
      Rezept beim Herantreten/Antippen

### Rezeptqualität & Auffindbarkeit
- [ ] Nährwert-Schätzung (Kalorien/Makros pro Portion)
- [ ] Vorrats-/Saison-Filter: "Was kann ich aus dem kochen, was ich zuhause habe?"
- [ ] Zusätzliche Tags/Anlässe (Resteverwertung, Meal Prep, Kindergeburtstag)
- [ ] "Ähnliche Rezepte" auf der Detailseite (Kategorie + Zutaten-Überlappung)

### Import & Pflege
- [ ] Rezept-Versionierung: einfacher Änderungsverlauf am Original (wer hat
      wann was geändert), ergänzend zu "Variante anlegen"

### Admin/Technik
- [ ] Soft-Delete/Papierkorb für Rezepte statt direktem Löschen
- [ ] Verwaiste Uploads periodisch aufräumen (Bild hochgeladen, Rezept nie
      gespeichert/gelöscht → Bytes bleiben aktuell dauerhaft in Postgres)
- [ ] Druckansicht/PDF-Export pro Rezept

### Sicherheit/Robustheit
- [ ] 2FA optional für Admin-Rolle (volle Backup-Export-Rechte)
- [x] Audit-Log für Admin-Aktionen (User angelegt/gelöscht, Rolle geändert,
      Backup importiert)
