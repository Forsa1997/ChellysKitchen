# 🔧 Setup: Custom Copilot Agents für GitHub Copilot

## Option 1: Auto-Discovery via VS Code Settings (Empfohlen)

### Schritt 1: Copilot Extension installieren
1. Öffne VS Code
2. Gehe zu Extensions (Cmd+Shift+X / Strg+Shift+X)
3. Suche "GitHub Copilot"
4. Installiere die Extension von GitHub

### Schritt 2: Agenten registrieren via Settings

Das Projekt nutzt bereits `.copilot/agents/*.md` Dateien. VS Code findet diese automatisch.

**VS Code Settings öffnen:**
1. `Cmd+,` (Mac) oder `Strg+,` (Windows)
2. Suche nach "Copilot"
3. Stelle sicher dass "Copilot: Workspace Agent Paths" aktiv ist

**Optional: Settings JSON editieren**
```json
{
  "copilot.webExtension.options": {
    "agentPaths": [".copilot/agents"]
  }
}
```

### Schritt 3: Agenten im Chat aufrufen
1. Öffne Copilot Chat (Cmd+Shift+I / Strg+Shift+I)
2. Gib `@` ein
3. Wähle einen Agent: `@coordinator`, `@feature-developer`, etc.

---

## Option 2: Manuelle Custom Instructions (GitHub Copilot Web + VS Code)

Falls Auto-Discovery funktioniert nicht.

### Für VS Code:
1. **Command Palette öffnen** (Cmd+Shift+P / Strg+Shift+P)
2. Suche: `"Copilot: Use Custom Instructions"`
3. Wähle das Projekt-Verzeichnis: `C:\Users\Chris\git\ChellysKitchen\.copilot\agents`

### Für GitHub Copilot Chat (Web):
1. Gehe zu github.com/copilot
2. **Settings** → **Custom Instructions**
3. Für jedem Agent erstelle eine neue Custom Instruction:

#### Beispiel: Coordinator Setup
```
Name: @coordinator
Description: Product Manager Orchestrator
Instructions: [Content von .copilot/agents/coordinator.md kopieren]
```

#### Beispiel: Feature Developer Setup
```
Name: @feature-developer
Description: Implementation Specialist
Instructions: [Content von .copilot/agents/feature-developer.md kopieren]
```

Wiederhole für alle 8 Agenten...

---

## Option 3: Copilot CLI (Für Teams)

Falls du Copilot CLI hast:
```bash
copilot config --add-agent-path ".copilot/agents"
```

---

## ✅ Verifikation: Agenten sind aktiv?

Fürhre diesen Test im Chat durch:

```
@coordinator Hai, hast du Zugriff auf .agents/shared/project-vision.md?
```

Coordinator sollte antworten dass er die Datei finden kann.

---

## 📝 Agenten laden vs. Custom Instructions

| Methode | Vorteil | Nachteil |
|---------|---------|---------|
| **Auto-Discovery** (empfohlen) | Agenten immer aktuell | Braucht VS Code 1.80+ |
| **Custom Instructions** | Browser-kompatibel | Manual synchronisieren nötig |
| **Copilot CLI** | Team-standardization | Erfordert CLI Installation |

---

## 🎯 Nach Setup: Erste Schritte

### Test 1: Einfache Feature (Coordinator)
```
@coordinator Ich möchte dass Nutzer Rezepte mit anderen teilen können
```

Coordinator sollte:
- Anfrage analysieren
- Scope definieren
- Spezialisten-Plan zeigen

### Test 2: Direkter Agent (Feature Developer)
```
@feature-developer Schreib mir einen GET Endpoint für Rezepte
```

Feature Developer sollte:
- Nach Tests fragen (Red-Phase!)
- Codebase inspizieren
- Spezialisten koordinieren falls nötig

### Test 3: Security Review
```
@security-expert Ist dieser POST /recipes Endpoint sicher?
```

Security Expert sollte:
- Threat-Modell stellen
- Validierungen checken
- Auth-Logik prüfen

---

## 🚨 Troubleshooting

### Problem: Agent nicht sichtbar in Chat
**Lösung:**
1. Reload VS Code (Cmd+Shift+P → Developer: Reload Window)
2. Check dass `.copilot/agents/*.md` Dateien existieren
3. Restart Copilot Extension (VS Code Extension Activity Bar → Copilot → Restart)

### Problem: Agent antwortet generisch
**Lösung:**
1. Stelle sicher dass `.agents/shared/project-vision.md` existiert
2. Agent braucht mehr Context in deiner Frage
3. Spezifiziere die relevanten Dateien/Komponenten

### Problem: Agents kennt Codebase nicht
**Lösung:**
1. Root-Verzeichnis muss offen sein (C:\Users\Chris\git\ChellysKitchen)
2. VS Code Workspace sollte geöffnet sein
3. `Cmd+Shift+P` → "Copilot: Reset" probieren

### Problem: Custom Instructions funktionieren nicht
**Lösung:**
1. Kopiere direkt aus `.copilot/agents/coordinator.md`
2. Stelle sicher dass die ganze Datei in Instructions ist
3. Test mit einfacher Frage: "Hallo, wer bist du?"

---

## 📊 Agenten Status prüfen

Im Chat kannst du fragen:
```
@coordinator Wer sind alle Agenten im Team?
```

Der Coordinator listet auf:
- ✅ Coordinator (sich selbst)
- ✅ Feature Developer
- ✅ Testing Agent
- ✅ Security Expert
- ✅ Solution Architect
- ✅ UI Designer
- ✅ Researcher
- ✅ Code Reviewer

Alle sollten ✅ sein.

---

## 🔄 Updates & Wartung

Wenn `.copilot/agents/*.md` Dateien aktualisiert werden:

**Bei Auto-Discovery:**
- Automatisch beim nächsten Chat (keine Aktion nötig)

**Bei Custom Instructions:**
- Manuell die Datei-Inhalte kopieren im Settings

---

## ❓ Häufige Fragen

**F: Können mehrere Agenten parallel arbeiten?**  
A: Ja! Aber der Coordinator koordiniert sie. Direkter paralleler Chat ist möglich, aber nicht für Anfänger empfohlen.

**F: Was ist wenn ich Agent X nicht sehe?**  
A: 1. Restart VS Code 2. Check `.copilot/agents/` Verzeichnis 3. Reload Copilot Extension

**F: Können Agenten sich untereinander aufrufen?**  
A: Noch nicht (Roadmap). Coordinator macht die Koordination manuell.

**F: Funktioniert das auch in GitHub Codespaces?**  
A: Ja, mit Option 2 (Custom Instructions in GitHub Settings).

---

## 📞 Support

Falls etwas nicht funktioniert:

1. **Logs prüfen:** VS Code Output → GitHub Copilot
2. **Workspace Neuladen:** Cmd+Shift+P → Developer: Reload Window
3. **Extension updaten:** VS Code Extensions → GitHub Copilot → Update

---

## 🎉 Ready to go!

Öffne jetzt Copilot Chat und gib ein:
```
@coordinator Hallo! Ich bin bereit mit dir Features zu bauen
```

Viel Spaß! 🚀

