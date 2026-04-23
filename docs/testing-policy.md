# Chellys Kitchen Test Policy

## Ziel

Dieses Repository folgt künftig einem **Test-First-Ansatz**:

1. Verhalten definieren.
2. Test schreiben (rot).
3. Implementierung ergänzen (grün).
4. Refactoring ohne Verhaltensänderung.

## Verbindliche Regeln

- Für jedes neue Feature muss es vor der Implementierung mindestens einen passenden Testfall geben.
- Für Bugfixes muss zuerst ein reproduzierender Regressionstest erstellt werden.
- Änderungen ohne passende Tests sind nicht fertig.
- Im Frontend sind **beide Ebenen** verpflichtend:
  - Unit Tests mit **Vitest**
  - Integration Tests mit **Cypress**
- Vor jedem Merge müssen mindestens die projektrelevanten Test- und Build-Checks laufen.

## Aktueller Test-Befehl (Frontend)

```bash
cd frontend
npm run test:unit
npm run test:integration
# optional mit automatischem Dev-Server für E2E:
npm run test:integration:local
```

## Workflow mit testing-agent

- Beim Scoping neuer Aufgaben ist der `testing-agent` verpflichtend einzubeziehen, um:
  - den Behavior Contract zu definieren,
  - Testfälle in Ausführungsreihenfolge festzulegen,
  - und die Merge-Gates (Pflichtbefehle) zu bestätigen.

## PR-Integrationsregel

- Feature-Branches müssen vor dem Merge auf den Ziel-Branch **rebased** werden.
- Erst danach wird der Branch gemerged.
- Keine Merge-Freigabe bei offenen Konflikten oder abweichender Test-Dokumentation.
