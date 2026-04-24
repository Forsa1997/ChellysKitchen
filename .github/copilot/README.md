# GitHub Copilot Custom Agents für Chellys Kitchen

Dieses Verzeichnis enthält die Konfigurationen für 8 spezialisierte Custom Agents, die als dein virtuelles Entwickler-Team fungieren.

##  Agent-Struktur

Jeder Agent hat ein eigenes Verzeichnis mit:
- `agent.yaml` - Agent-Konfiguration & Metadaten
- `instructions.md` - Detaillierte System Instructions

```
.github/copilot/
├── README.md (diese Datei)
├── agents/
│   ├── coordinator/
│   │   ├── agent.yaml
│   │   └── instructions.md
│   ├── feature-developer/
│   │   ├── agent.yaml
│   │   └── instructions.md
│   ├── testing-agent/
│   │   ├── agent.yaml
│   │   └── instructions.md
│   ├── security-expert/
│   │   ├── agent.yaml
│   │   └── instructions.md
│   ├── solution-architect/
│   │   ├── agent.yaml
│   │   └── instructions.md
│   ├── ui-designer/
│   │   ├── agent.yaml
│   │   └── instructions.md
│   ├── researcher/
│   │   ├── agent.yaml
│   │   └── instructions.md
│   └── code-reviewer/
│       ├── agent.yaml
│       └── instructions.md
```

##  Verwendung im GitHub Copilot

### 1. Agents in Copilot aktivieren

Im GitHub Copilot Chat:
- Settings öffnen
- Custom Agents suchen
- Diese Agenten sollten automatisch erkannt werden

### 2. Agent aufrufen

```
@coordinator Ich möchte Rezept-Suche mit Filtern implementieren
@feature-developer Implementiere diesen Endpoint
@testing-agent Schreib Tests für X
@security-expert Ist dieser Auth-Flow sicher?
@code-reviewer Review diese Changes
@solution-architect Designt die Architektur
@ui-designer Erstelle UI-Spec für X
@researcher Recherchiere die besten Optionen
```

##  Agent-Übersicht

| Agent | Rolle | Use Case |
|-------|-------|----------|
| **@coordinator** | Product Manager Orchestrator | Feature Planning, Complex Requests |
| **@feature-developer** | Implementation Specialist | Code schreiben |
| **@testing-agent** | Test-First Quality | TDD, Test-Pläne |
| **@security-expert** | Security & Auth | Auth Flows, Vulnerabilities |
| **@solution-architect** | System Designer | Architecture, Design Decisions |
| **@ui-designer** | Product & UX Designer | UI/UX, Layouts, Responsive Design |
| **@researcher** | Discovery Specialist | Research, Clarify Requirements |
| **@code-reviewer** | Quality Gate | Code Review, QA |

##  Quick Start

**Für eine komplette Feature:**
```
@coordinator [Feature-Anfrage]
```

Der Coordinator plant alles und delegiert zu anderen Agenten.

**Für schnelle Fragen:**
```
@security-expert Ist das sicher?
@code-reviewer Review das
@testing-agent Plan Tests
```

##  Weitere Dokumentation

- `../.copilot/INTEGRATION_GUIDE.md` - Detaillierte Nutzungsanleitung
- `.../../agents/shared/project-vision.md` - Product Vision & Constraints
- `.../../agents/shared/coordinator-feature-backlog.md` - Feature Roadmap

## ✨ Key Features

✅ **Fully Coordinated**: Alle Agenten arbeiten über den Coordinator  
✅ **TDD Enforced**: Tests MÜSSEN vor Implementierung geschrieben werden  
✅ **Security-First**: Security Expert in jedem Workflow  
✅ **Cloud-Ready**: Alle Lösungen sind deployment-ready  
✅ **Well Documented**: Umfassende Anleitung & Beispiele  
