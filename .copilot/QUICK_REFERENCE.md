# 🤖 Copilot Agents Quick Reference

## Schnellstart - Agents im Chat auswählen

Gib `@` im Copilot Chat ein und wähle einen Agent:

### 🎯 Haupteinstieg
```
@coordinator [Deine Feature-Anfrage]
```
**Für:** Complex Features, Planning, Koordination  
**Beispiel:** `@coordinator Ich möchte dass Nutzer Rezepte als Favoriten merken können`

---

## 🔧 Spezialisierte Agenten (Direktaufruf)

### 💻 Implementierung
```
@feature-developer [Task]
```
**Für:** Code schreiben (nach TDD Tests)  
**Beispiel:** `@feature-developer Implementiere den DELETE Endpoint`  
**⚠️ Wichtig:** Testing Agent muss ZUERST Tests mit rotem Status schreiben!

### ✅ Tests & TDD
```
@testing-agent [Was testen?]
```
**Für:** Test-Strategie, Failing-First Tests  
**Beispiel:** `@testing-agent Schreib Failing Tests für Rezept-Löschung`  
**Must:** Vor Feature Developer aufrufen!

### 🔒 Sicherheit
```
@security-expert [Code/Architecture]
```
**Für:** Auth, Validation, Vulns, Trust Boundaries  
**Beispiel:** `@security-expert Ist der Login-Flow sicher?`

### 🏗️ Architektur
```
@solution-architect [Design-Frage]
```
**Für:** System-Design, Interfaces, Data Flow  
**Beispiel:** `@solution-architect Design die API für Rezept-Search`

### 🎨 UI/UX Design
```
@ui-designer [Feature]
```
**Für:** Layouts, Components, Responsive, Accessibility  
**Beispiel:** `@ui-designer Design eine Rezept-Favoriten-Seite`

### 🔍 Forschung
```
@researcher [Unklare Frage]
```
**Für:** Requirements-Klärung, Options-Vergleich  
**Beispiel:** `@researcher JWT vs Cookies - was ist besser für uns?`

### 📋 Code Review
```
@code-reviewer [Code]
```
**Für:** Bugs, Regressions, Security-Issues finden  
**Beispiel:** `@code-reviewer Bitte check diese Änderungen`

---

## 📊 Standard Workflow (Feature Development)

```
1️⃣  @coordinator [Feature Request]
    ↓ Coordinator analysiert und plant
    
2️⃣  @researcher (optional - wenn unklar)
    
3️⃣  @solution-architect + @ui-designer (parallel)
    
4️⃣  @security-expert (wenn nötig)
    
5️⃣  @testing-agent → schreibt FAILING Tests (RED PHASE!)
    
6️⃣  @feature-developer → implementiert (GREEN + REFACTOR)
    
7️⃣  @code-reviewer → Final approval vor Merge
```

---

## 🚨 Wichtige Regeln

### ✅ DO
- ✅ Testing Agent ZUERST für Tests (rot-Phase ist mandatory!)
- ✅ Coordinator für komplexe Anfragen
- ✅ Feature Developer NUR nach Testing Agent
- ✅ Security Expert early bei Auth/Uploads
- ✅ Complete context: Welche Datei? Welche Problem?

### ❌ DON'T
- ❌ Feature Developer ohne vorher Tests (Red-Phase!)
- ❌ Alles auf einmal zu Feature Developer
- ❌ Ignore Security auf sensitive features
- ❌ Code ohne Tests "schnell" implementieren

---

## 💡 Tipps & Best Practices

### Wenn Requirements unklar sind
```
@researcher [Frage zu Options/Decision/Requirements]
```

### Für API-Design
```
@solution-architect [Beschreib die API]
    ↓
@security-expert [Gut auf Sicherheit?]
    ↓
@testing-agent [Schreib Tests]
    ↓
@feature-developer [Implementiere]
```

### Für UI-Features
```
@ui-designer [Beschreib das Feature]
    ↓
@feature-developer [Implementiere nach Design]
    ↓
@code-reviewer [Review vor Merge]
```

### Hot-Fix (schnell, aber risikoreicher)
```
@security-expert [Check den Fix]
    ↓
@feature-developer --override [schnell fixen]
```

---

## 📚 Wichtige Dateien (Context)

Die Agenten lesen automatisch:
- `.agents/shared/project-vision.md` - Product Direction
- `.agents/shared/balanced-team-charter.md` - Team Operating Model  
- `.agents/shared/coordinator-feature-backlog.md` - Feature Roadmap

Du brauchst diese nicht zu schicken - Agenten lesen sie!

---

## 🎯 Agent Selection Guide

| Situation | Agent |
|-----------|-------|
| "Ich möchte [Feature]" | `@coordinator` |
| "Wie bauen wir [X]?" | `@solution-architect` |
| "Wir sind unsicher..." | `@researcher` |
| "Schreib mir Tests dafür" | `@testing-agent` |
| "Implementier [Task]" | `@feature-developer` |
| "Ist das sicher?" | `@security-expert` |
| "Design mich [Screen]" | `@ui-designer` |
| "Check den Code" | `@code-reviewer` |

---

## 🆘 Troubleshooting

**Problem:** Agent findet nicht?  
→ Gib `@` ein und warte auf Autovervollständigung

**Problem:** Agent antwortet generisch?  
→ Gib mehr Context: Welche Datei? Was ist das Problem? Welche Constraint?

**Problem:** Feature Developer sagt "Wo sind die Tests?"  
→ Du brauchst `@testing-agent` ZUERST für Failing Tests!

**Problem:** Tests gehen nicht rot?  
→ Testing Agent muss Tests korrigieren bevor Feature Developer startet

---

**Start jetzt:** Gib `@coordinator [Deine erste Anfrage]` im Chat ein! 🚀

