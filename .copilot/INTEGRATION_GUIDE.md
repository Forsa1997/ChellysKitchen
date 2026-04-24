# GitHub Copilot Integration Guide für Chellys Kitchen

## 📋 Überblick

Dieses Projekt nutzt **8 spezialisierte Custom Agents für GitHub Copilot**, die als virtuelles Entwickler-Team arbeiten. Der **Coordinator** (Product Manager) orchestriert die anderen Spezialisten.

---

## 🚀 Quick Start

### Für normale Feature-Requests:

```
@coordinator Ich möchte [Feature X] implementieren

Beispiel:
@coordinator Nutzer sollen ihre eigenen Rezepte löschen können
```

Der Coordinator wird:
1. Die Anfrage verstehen
2. Entscheiden, welche Spezialisten helfen
3. Mit ihnen parallel arbeiten
4. Ein kohärentes Plan-Ergebnis liefern

### Für schnelle technische Fragen:

```
@researcher Sind JWT oder Cookies besser für Auth?
@code-reviewer Bitte überprüfe diese Implementierung
@security-expert Ist dieser Login-Flow sicher?
```

---

## 👥 Die 8 Agenten

### 1. **@coordinator** - Product Manager Orchestrator
**Rolle**: Eingang für alle Anfragen  
**Macht**: Nimmt Anfrage entgegen, plant, delegiert, synthesiert Ergebnis  
**Nutze wenn**: Feature-Request, Bug-Fix, Architektur-Entscheidung, komplexe Planung  

**Beispiel-Prompt**:
```
@coordinator Ich möchte dass Rezepte nach Kategorie filterbar sind.
Nutzer sollen via Sidebar filtern können, und die URL soll sich mitändern.
Priority: P1, Timeline: diese Woche wenn möglich
```

---

### 2. **@feature-developer** - Implementation Specialist
**Rolle**: Code schreiben  
**Macht**: Schreibt minimal, getesteter, wartbarer Code  
**Nutze wenn**: Ihr wollt Code implementieren (meistens via Coordinator)  

**Richtlinien**:
- Tests kommen ZUERST (Red → Green → Refactor)
- Nutze bestehende Projekt-Patterns
- Keine versteckten Behavior-Änderungen
- Frage nach wenn unklar

---

### 3. **@testing-agent** - Test-First Quality Specialist
**Rolle**: Tests schreiben BEVOR Implementierung  
**Macht**: Definiert Verhalten, schreibt failing tests  
**Nutze wenn**: Feature-Definition unklar ist, oder ihr wollt TDD forcieren  

**Handoff zu Feature Developer**: "Hier sind die Tests. Mach sie grün."

---

### 4. **@security-expert** - Security & Auth Specialist
**Rolle**: Sicherheitsvalidation  
**Macht**: Findet exploitable Issues, empfiehlt Fixes  
**Nutze wenn**: Auth/Authz, Input-Handling, sensitive Daten, Secrets, Vulnerabilities  

**Sicherheits-Prinzipien für dieses Projekt**:
- Backend enforced auth/authz (nicht Frontend!)
- RBAC: guest / member / editor / admin
- Input validation auf allen Ebenen
- Ownership checks: members können nur eigene Rezepte editieren

---

### 5. **@solution-architect** - System Designer
**Rolle**: Architektur & Modulgrenzen  
**Macht**: Definiert saubere Schnittstellen, Datenfluss, Sequenzen  
**Nutze wenn**: Architektur unklar, große Refactor geplant, Cloud-Deployment  

**Anfrage-Style**:
```
@solution-architect
Wie sollten wir die Rezept-Suche mit Filter architektieren?
- Frontend API: Welche Parameter?
- Datenbank: Full-text search oder Like queries?
- Pagination: Limit/Offset odercursor?
```

---

### 6. **@ui-designer** - Product & UX Designer
**Rolle**: Interface Layout, Flows, Responsive Design  
**Macht**: Spezifiziert Layouts, Komponenten, Responsive Breakpoints, States  
**Nutze wenn**: Neue Screens/Flows, UX-Fragen, Accessibility  

**Output**: Konkrete Design-Spec mit MUI-Komponenten, Responsive-Verhalten, States

---

### 7. **@researcher** - Discovery Specialist
**Rolle**: Unklarheiten reduzieren  
**Macht**: Researcht Anforderungen, Optionen, Trade-offs  
**Nutze wenn**: Requirements unklar, Tech-Entscheidungen offen, Best Practices gefragt  

**Output**: Empfohlenr Weg + Alternativen + Risks

---

### 8. **@code-reviewer** - Quality Gate
**Rolle**: Final Review vor Merge  
**Macht**: Findet Bugs, Regressions, Sicherheitsmängel, fehlende Tests  
**Nutze wenn**: Code-Review nötig, Merge-Approval gefragt  

---

## 🔄 Typische Workflows

### Workflow 1: Einfache Feature (über Coordinator)

```
User: @coordinator Ich möchte eine Sign-up Page

Coordinator Plan:
→ UI Designer: Design die Sign-up Form (loading, error states)
→ Security Expert: Validate password rules, token storage
→ Testing Agent: Test-Plan (happy path, invalid email, weak password)
→ Feature Developer: Implementierung mit Tests
→ Code Reviewer: Final QA

Output: Kohärente Sign-up Implementierung end-to-end
```

### Workflow 2: Sicherheits-Audit

```
User: @security-expert Bitte überprüfe unseren Login-Flow auf Vulnerabilities

Security Expert:
1. Liest Login-Code
2. Prüft Token-Handling, Session-Sicherheit, Password-Hashing
3. Findet Issues (wenn vorhanden)
4. Empfiehlt Fixes

Falls nötig: Delegiert Implementierung an Feature Developer via Coordinator
```

### Workflow 3: Architektur-Spike

```
User: @solution-architect Wie sollten wir Rezept-Upload architektieren?

Solution Architect:
1. Vergleicht Cloud-Storage (S3, Azure Blob, etc.)
2. Schlägt Abstraction Layer vor
3. Gibt Implementierungs-Sequenz
4. Koordiniert mit Security Expert für Upload-Validierung

Ergebnis: Klare Architecture, dann Feature Developer kann bauen
```

---

## 🏢 Projekt-Struktur

Die Agenten arbeiten mit dieser Datei-Struktur:

```
.agent/
  shared/
    project-vision.md               ← Alle Agenten lesen das!
    coordinator-feature-backlog.md  ← Feature-Roadmap
  skills/
    [Jeder Agent hat SKILL.md]

.copilot/
  agents/
    coordinator.md          ← Dieser Agent führt die Anderen
    feature-developer.md    ← Agent Specs
    testing-agent.md
    security-expert.md
    solution-architect.md
    ui-designer.md
    researcher.md
    code-reviewer.md
```

---

## 📝 Best Practices

### ✅ DOs

- ✅ **Immer via Coordinator für Komplexes**: 5+ Minuten Planung sparen Stunden Implementation
- ✅ **Klare Anfragen schreiben**: "Was", "Warum", "Constraints" sagen
- ✅ **Spec vor Implementation**: Testing Agent → Feature Developer
- ✅ **Red-First Tests**: Failing tests THEN implementation
- ✅ **Separate Concerns**: Frontend-Task ≠ Backend-Task
- ✅ **Code Review am Ende**: Code Reviewer gibt Final OK

### ❌ DON'Ts

- ❌ **Nicht "schnell machen" ohne Planung**: Fehler entstehen
- ❌ **Nicht Tests überspringen**: Sie sind nicht optional
- ❌ **Nicht "Security kommt später"**: Das ist ein kritisches Risiko
- ❌ **Nicht Coordinator umgehen für komplexe Features**: Koordination ist der Wert
- ❌ **Nicht Hardcoded Config**: Env-Variablen immer
- ❌ **Nicht Privacy-Daten in Logs**: Security-Regel #1

---

## 🎯 Feature Backlog (Priorität)

**P0 - Foundation (nächste Priorität):**
1. Backend-Grundstruktur + DB-Persistenz
2. Auth (Email/Passwort Sign-up/Sign-in)
3. RBAC-Baseline (guest/member/editor/admin)

**P1 - Produktkern:**
4. Recipe CRUD (Create/Read/Update/Delete)
5. Suche + Filter + Pagination
6. Bild-Upload

**P2 - Qualität:**
7. Observability & Logging
8. Teststrategie ausbauen

Siehe `.agents/shared/coordinator-feature-backlog.md` für Details.

---

## 🔐 Sicherheits-Standards

Diese Prinzipien gelten für ALLE Features:

1. **Backend enforces permissions** (nicht Frontend)
2. **Input validation on all borders** (frontend + backend)
3. **No secrets in code** (env-vars only)
4. **RBAC**: guest/member/editor/admin Rollen
5. **Ownership checks**: members nur eigene Rezepte
6. **Error messages don't leak** (keine DB-Struktur in 500 errors)
7. **Tests cover security cases** (fehlgeschlagene Auth, keine Permissions)

---

## 💬 Beispiel-Session

```
User:
@coordinator 
Goal: Ermögliche es Nutzern, ihre Lieblingsrezepte zu speichern
Scope: Use heart-icon auf Recipe Cards, speichere in user.favorites
Constraint: Schnell (< 2 Std), keine Änderung der Recipe-Struktur

Coordinator:
Ich verstanden: Users können Rezepte favorisieren. Nutzerfreundlich.

Plan:
→ $ui-designer (5 min): Heart-Icon UX, Favoriten-Counter
→ $security-expert (5 min): Sind die Permissions OK?
→ $testing-agent (10 min): Test für Favoriten Toggle
→ $feature-developer (30 min): API + Frontend Implementation
→ $code-reviewer (10 min): Final QA

Coordinator:
Okay, beginnen wir.

---

User:
@ui-designer [Output von Coordinator]
Bitte spezifiziere die Heart-Icon UX

UI Designer:
**Recipe Card - Favorite Toggle**

Component: Heart Icon Button (top-right corner)
States:
- Default (hollow heart)
- Hovered (filled heart preview)
- Favorited (filled red heart)
- Loading (spinner inside heart)

Mobile: Same, but bigger tap target (48px min)

---

[Weitere Agenten liefern OUTPUT...]
---

Feature Developer:
Alle Tests sind grün. Implementierung fertig.

Code Reviewer:
Approved ✅
```

---

## 📞 Support

**Fehler bei einem Agent?**
- Coordinator kann eskalierten
- Frag den Coord: `@coordinator Agent X gibt merkwürdige Outputs`

**Umgebung konfigurieren?**
- Lese `.agents/shared/project-vision.md`
- Frontend: React + TypeScript + Vite + MUI
- Backend: TypeScript + Node.js + PostgreSQL

**Neue Entscheidungs-Prinzipien?**
- Editiere `.agents/shared/project-vision.md`
- Ändre `.agents/shared/coordinator-feature-backlog.md` für Roadmap
- Alle Agenten lesen diese Dateien, sind also synchronized

