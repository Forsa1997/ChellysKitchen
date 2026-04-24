#  GitHub Copilot Agents Setup Guide

Diese Agenten sind konfiguriert und ready to use im GitHub Copilot. So stellst du sie auf:

---

##  Pre-Check: Dateien sind an Ort und Stelle ✅

Alle 8 Agenten existieren in `.github/copilot/agents/`:
- ✅ coordinator/
- ✅ feature-developer/
- ✅ testing-agent/
- ✅ security-expert/
- ✅ solution-architect/
- ✅ ui-designer/
- ✅ researcher/
- ✅ code-reviewer/

Jeder Agent hat:
- `agent.yaml` - Konfiguration
- `instructions.md` - System Instructions

---

##  Setup im GitHub Copilot

### Option 1: Automatische Erkennung (GitHub Copilot v1.2+)

GitHub erkennt Agents automatisch in diesen Verzeichnissen:
```
.github/copilot/agents/*/agent.yaml
```

1. Git commit & push:
```bash
git add .github/copilot/
git commit -m "Add 8 specialized Copilot agents"
git push
```

2. GitHub Copilot neu starten
3. Im Chat solltest du die Agenten sehen:
```
@coordinator
@feature-developer
@testing-agent
@security-expert
@solution-architect
@ui-designer
@researcher
@code-reviewer
```

### Option 2: Manuelle Konfiguration (Fallback)

Falls automatische Erkennung nicht funktioniert:

1. Öffne GitHub Copilot Einstellungen
2. Suche nach "Custom Instructions" oder "Agent Configuration"
3. Für jeden Agent erstelle eine neue Konfiguration:

```yaml
name: @coordinator
type: agent
description: Product Manager Orchestrator
instructions_file: .github/copilot/agents/coordinator/instructions.md
```

---

## ✨ Agents Ready für Use

| Agent | Aufrufen | Use Case |
|-------|----------|----------|
| Product Manager | `@coordinator` | Feature Planning |
| Implementierung | `@feature-developer` | Code schreiben |
| Tests | `@testing-agent` | TDD, Tests |
| Sicherheit | `@security-expert` | Auth, Vulns |
| Architektur | `@solution-architect` | Design |
| UI/UX | `@ui-designer` | Layouts |
| Research | `@researcher` | Discovery |
| Code Review | `@code-reviewer` | QA |

---

##  First Example: Test It

Versuche diese Anfrage im Copilot Chat:

```
@coordinator Ich möchte dass Nutzer Rezepte favorisieren können
```

Der Coordinator wird:
1. Die Anfrage verstehen
2. Plan erstellen
3. Spezialisten delegieren
4. Kohärentes Ergebnis liefern

---

##  Agent Struktur

```
.github/copilot/
├── README.md                          ← Agent Überblick
├── SETUP.md                           ← Diese Datei
├── agents/
│   ├── coordinator/
│   │   ├── agent.yaml                 ← Metadaten
│   │   └── instructions.md            ← System Instructions
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

---

##  Context Files (aus .agents/shared/)

Alle Agenten lesen automatisch:
- `.agents/shared/project-vision.md` - Product Vision
- `.agents/shared/coordinator-feature-backlog.md` - Feature Roadmap

Diese Dateien sind die **Single Source of Truth** für Product Direction.

---

##  Usage Patterns

### Pattern 1: Komplette Features (über Coordinator)
```
User:
@coordinator Ich möchte Rezept-Suche implementieren

Coordinator:
1. Versteht die Anfrage
2. Delegiert an Spezialisten
3. Liefert kohärenten Plan

Result: Feature-Ready Specification
```

### Pattern 2: Schnelle Fragen (direkt)
```
@security-expert Ist JWT in localStorage sicher?
@code-reviewer Überprüfe diesen Code
@testing-agent Was sind gute Tests dafür?
```

---

##  Workflows Ready

**Workflow 1: Feature Planning** (Empfohlen)
```
Coordinator → Researcher → Architect → Designer 
          → Security Expert → Testing Agent 
          → Feature Developer → Code Reviewer
```

**Workflow 2: Security Audit**
```
Security Expert → Validation → Feature Developer
```

**Workflow 3: Architecture Spike**
```
Solution Architect → Design → Implementation Plan
```

---

##  Troubleshooting

### Problem: Agents nicht sichtbar

**Lösung 1**: Git synchronisieren
```bash
git pull origin main
```

**Lösung 2**: Copilot neu starten
- VSCode: Beende Copilot und starte neu
- GitHub.com: Browser refresh
- GitHub CLI: `gh copilot --reset`

**Lösung 3**: agent.yaml validieren
```bash
# Check syntax
cat .github/copilot/agents/coordinator/agent.yaml
```

### Problem: Agent antwortet merkwürdig

**Lösung**: Instructions.md prüfen
```bash
# Verifiy content
cat .github/copilot/agents/[agent]/instructions.md
```

---

## ✅ Validierung

Alle 8 Agenten sind configured und ready:

✅ `.github/copilot/agents/coordinator/`  
✅ `.github/copilot/agents/feature-developer/`  
✅ `.github/copilot/agents/testing-agent/`  
✅ `.github/copilot/agents/security-expert/`  
✅ `.github/copilot/agents/solution-architect/`  
✅ `.github/copilot/agents/ui-designer/`  
✅ `.github/copilot/agents/researcher/`  
✅ `.github/copilot/agents/code-reviewer/`  

---

##  Ready to Use!

1. ✅ Git commit & push
2. ✅ Copilot neu starten
3. ✅ Try: `@coordinator Ich möchte...`
4. ✅ Enjoy coordinated team!

Viel Erfolg! 
