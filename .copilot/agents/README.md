# GitHub Copilot Custom Agents für Chellys Kitchen

Dieses Verzeichnis enthält Custom Agent-Definitionen für GitHub Copilot, die das Multi-Agent-Koordinations-System von Chellys Kitchen implementieren.

## Agent-Struktur

- **coordinator.md** - Product Manager Orchestrator (Einstiegspunkt)
- **feature-developer.md** - Implementierer
- **code-reviewer.md** - Code Review Spezialist
- **security-expert.md** - Sicherheitsspezialist
- **solution-architect.md** - Systemdesigner
- **testing-agent.md** - Test-First / TDD Spezialist
- **researcher.md** - Forschungs- und Entdeckungsspezialist
- **ui-designer.md** - UI/UX Designer

## Leitprinzipien für alle Agenten

- **Produktvision**: Jeder Agent liest `../.agents/shared/project-vision.md` vor Planungs-, Review- oder Implementierungsarbeiten
- **Koordination**: Alle Spezialisten arbeiten über den Coordinator zusammen, nicht isoliert
- **Sequenzen**: Red → Green → Refactor für Tests, Intake → Plan → Delegate → Decide für Features
- **Cloud-Ready**: Alle Lösungen müssen cloud-hostbar ohne Neudesign sein

## Verwendung im Copilot

### Einstieg: Coordinator (Standard)
```
@coordinator [Feature Request oder Bug Report]
```

Der Coordinator wird:
1. Die Anfrage verstehen und in Scope, Goals, Constraints übersetzen
2. Entscheiden, welche Spezialisten benötigt werden
3. Spezialisten nacheinander delegieren
4. Ein kohärentes Planungsergebnis synthesieren

### Direkter Zugriff auf Spezialisten (Optional)
Falls die Anforderung sehr klar ist, können Sie einen Spezialisten direkt aufrufen:

```
@feature-developer [Implementation für X]
@code-reviewer [Bitte überprüfe diese Änderungen]
@testing-agent [TDD-Plan für Feature X]
```

## Workflow-Beispiel

1. User: `@coordinator Ich möchte Rezept-Suchfunktion mit Filter implementieren`
2. Coordinator: Analysiert Request, plant Delegation
3. Coordinator → Researcher: Analysiert Such-Anforderungen
4. Coordinator → Solution Architect: Definiert API-Contract
5. Coordinator → UI Designer: Definiert Filter-UI
6. Coordinator → Security Expert: Validierungspass
7. Coordinator → Testing Agent: TDD-Plan
8. Coordinator → Feature Developer: Umsetzung
9. Coordinator → Code Reviewer: Qualitätsgate
10. User: Erhält kohärent abgestimmte Umsetzung

## Fallbacks und Überrides

- **"Nur Implementierung"**: `@feature-developer --no-coordinator` (schnell aber höheres Risiko)
- **"Nur Security Check"**: `@security-expert [Code/Architecture]`
- **"Designer-Led"**: `@ui-designer [Feature Concept]` (wenn UX Priorität hat)

## Zukunftserweiterungen

- Integration mit GitHub Issues und Pull Request Reviews
- Automatisiertes Routing basierend auf Dateityp/Komponente
- Historische Entscheidungen und ADRs tracken
- Dependency-Graph-Analyse für Impact Assessment

