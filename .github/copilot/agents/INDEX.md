# GitHub Copilot Agents - Directory Index

Dieses Verzeichnis enthält 8 spezialisierte Custom Agents für GitHub Copilot.

---

##  Agent Directory

### 1.  **@coordinator** - Product Manager Orchestrator
**Dateiort**: `agents/coordinator/`
- **role**: Single entry point for all requests
- **responsibility**: Plans, delegates, synthesizes solutions
- **use**: `@coordinator [Feature Request oder komplexe Anfrage]`
- **workflow**: Intake → Plan → Delegate → Track → Decide → Synthesize

### 2.  **@feature-developer** - Implementation Specialist
**Dateiort**: `agents/feature-developer/`
- **role**: Write code following TDD
- **responsibility**: Red → Green → Refactor cycle
- **use**: `@feature-developer [Implementation Task]`
- **prerequisite**: Tests from @testing-agent

### 3.  **@testing-agent** - Test-First Quality
**Dateiort**: `agents/testing-agent/`
- **role**: Write failing tests before implementation
- **responsibility**: Define specifications as tests
- **use**: `@testing-agent [Feature to Spec as Tests]`
- **prerequisite**: None (comes first)

### 4.  **@security-expert** - Security & Auth Specialist
**Dateiort**: `agents/security-expert/`
- **role**: Identify exploitable issues
- **responsibility**: Validate auth, permissions, inputs
- **use**: `@security-expert [Code/Flow to Review]`
- **focus**: Backend-first security, RBAC enforcement

### 5. ️ **@solution-architect** - System Designer
**Dateiort**: `agents/solution-architect/`
- **role**: Define system architecture
- **responsibility**: Module boundaries, interfaces, sequencing
- **use**: `@solution-architect [Architectural Question]`
- **deliverable**: Design options + recommendation

### 6.  **@ui-designer** - Product & UX Designer
**Dateiort**: `agents/ui-designer/`
- **role**: Design layouts and interactions
- **responsibility**: Responsive design, accessibility, states
- **use**: `@ui-designer [Screen/Flow to Design]`
- **output**: MUI-ready specifications

### 7.  **@researcher** - Discovery Specialist
**Dateiort**: `agents/researcher/`
- **role**: Clarify requirements and options
- **responsibility**: Research, compare, recommend
- **use**: `@researcher [Question to Research]`
- **output**: Recommendations + trade-offs

### 8. ✅ **@code-reviewer** - Quality Gate
**Dateiort**: `agents/code-reviewer/`
- **role**: Final quality validation
- **responsibility**: Identify defects, regressions, security issues
- **use**: `@code-reviewer [Code to Review]`
- **gate**: Approve / Approve with Changes / Blocked

---

##  Agent Selection Guide

| I Need | Use This Agent |
|--------|----------------|
| Plan komplexe Feature | @coordinator |
| Code schreiben | @feature-developer |
| Tests definieren | @testing-agent |
| Security Check | @security-expert |
| Architecture Design | @solution-architect |
| UI/UX Design | @ui-designer |
| Research + Options | @researcher |
| Code Review | @code-reviewer |

---

##  File Structure

Each agent has:
- `agent.yaml` - Agent configuration (name, type, display info)
- `instructions.md` - Detailed system instructions (context + workflow)

---

##  Getting Started

1. **Read**: `../README.md` - Agent overview
2. **Setup**: `../SETUP.md` - Installation instructions
3. **Try**: `@coordinator Ich möchte...`
4. **Explore**: Each agent's `instructions.md`

---

##  Context Files

All agents reference these shared files:
- `../../.agents/shared/project-vision.md` - Product vision & constraints
- `../../.agents/shared/coordinator-feature-backlog.md` - Feature roadmap

These are the **source of truth** for product direction.

---

## ✨ Key Features

✅ **Fully Coordinated**: Agents work through coordinator  
✅ **TDD Enforced**: Tests before implementation  
✅ **Security-First**: Security expert in every flow  
✅ **Cloud-Ready**: Design thinks about deployment  
✅ **Well Documented**: Each agent is self-contained  

---

##  Typical Workflows

### Quick Feature
```
@coordinator [Feature Idea]
→ All specialists coordinate
→ Return coherent plan
```

### Quick Question
```
@security-expert Is this safe?
@code-reviewer Review this
@testing-agent Plan tests
```

### Architecture Decision
```
@solution-architect Compare options for X
```

---

##  Support

**Agents not showing?**
1. Check Git status: `git status`
2. Verify files exist: `ls -la agents/*/`
3. Restart Copilot

**Agent acting weird?**
1. Check its `instructions.md` file
2. Verify `agent.yaml` syntax
3. Restart GitHub Copilot

**Need help?**
- Read agent's `instructions.md`
- Check `../SETUP.md`
- Reference `../README.md`

---

##  Learning Path

**Beginner**: Start with simple request
```
@coordinator Nutzer sollen Favoriten speichern könne
```

**Intermediate**: Try direct specialists
```
@testing-agent Plan tests for X
@code-reviewer Review this code
```

**Advanced**: Build complete features
```
@coordinator [Complex Request]
→ Follow coordinator's plan
```

---

##  Agents Ready to Work

All 8 agents configured, documented, and ready for your Chellys Kitchen project.

**Go ahead and start using them!** 
