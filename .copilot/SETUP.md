# Custom Copilot Agents - System Configuration

## 📦 Package Structure

These agents are designed as **Custom Instructions** or **Custom System Prompts** for GitHub Copilot.

### How to Setup in GitHub Copilot

1. **GitHub Copilot Chat Settings**:
   - Open GitHub Copilot Settings
   - Navigate to "Custom Instructions"
   - For each agent, create a new custom instruction

2. **Custom Instruction Template**:
   ```
   Name: @[agent-name]
   Description: [Short description from .md file]
   Instructions: [Content of .md file]
   ```

3. **Example Setup for @coordinator**:
   ```
   Name: @coordinator
   Description: Product Manager Orchestrator - coordinating specialist agents
   Instructions: [Full content of coordinator.md]
   ```

### File Mapping

| Agent | File | Use Case |
|-------|------|----------|
| Coordinator | `coordinator.md` | Feature planning, complex requests |
| Feature Developer | `feature-developer.md` | Code implementation |
| Testing Agent | `testing-agent.md` | Test-first TDD |
| Security Expert | `security-expert.md` | Auth, Validation, Vulnerabilities |
| Solution Architect | `solution-architect.md` | System design, architecture |
| UI Designer | `ui-designer.md` | Layouts, UX flows, responsiveness |
| Researcher | `researcher.md` | Discovery, unknowns, options |
| Code Reviewer | `code-reviewer.md` | QA, defect finding, regressions |

---

## 🤖 Agent Reference Summary

### Quick Summaries

**@coordinator**
- Role: Product Manager Orchestrator
- Entry point for all requests
- Plans, delegates, synthesizes
- Use: Feature requests, planning, complex decisions

**@feature-developer**
- Role: Implementation Specialist
- Writes minimal, testable code
- Follows Red → Green → Refactor
- Use: Code implementation (usually via coordinator)

**@testing-agent**
- Role: Test-First Quality
- Writes failing tests FIRST
- Defines acceptance criteria as tests
- Use: Before implementation; TDD gating

**@security-expert**
- Role: Security & Auth Specialist
- Finds exploitable issues
- Enforces backend-first auth
- Use: Auth flows, validation, vulnerabilities, secrets

**@solution-architect**
- Role: System Designer
- Defines module boundaries, interfaces
- Compares architecture options
- Use: System design, refactoring, cloud deployment

**@ui-designer**
- Role: UI/UX Designer
- Specifies layouts, components, states
- Responsive & accessible design
- Use: New screens, UX flows, design specs

**@researcher**
- Role: Discovery Specialist
- Clarifies requirements, unknowns
- Compares options & tradeoffs
- Use: Unclear requirements, tech decisions

**@code-reviewer**
- Role: Quality Gate
- Finds bugs, regressions, risks
- Tests & security validation
- Use: Code review, merge approval

---

## 🎯 Coordinator Workflow

When using @coordinator, provide:

```
Goal: [What should be achieved?]
Business Value: [Why is this important?]
Scope In: [What's included?]
Scope Out: [What's NOT included?]
Constraints: [Time, tech, dependencies]
Deadline: [Priority - P0/P1/P2 or timeline]
```

Coordinator will:
1. **Understand** the request
2. **Plan** which specialists needed
3. **Delegate** with clear scope
4. **Collect** assumptions & risks
5. **Decide** on conflicts
6. **Synthesize** one coherent plan

---

## 📚 Context Files (Already Exist)

All agents read and reference these:

**`.agents/shared/project-vision.md`**
- Product goals for Chellys Kitchen
- Technical direction (React/TypeScript/MUI frontend, PostgreSQL backend)
- RBAC model (guest/member/editor/admin)
- Architecture guidance
- Cloud hosting principles

**`.agents/shared/coordinator-feature-backlog.md`**
- Feature roadmap
- P0/P1/P2 prioritization
- Next iteration planning
- Dependencies between features

Both files are **source of truth** for product direction.

---

## 🔗 Integration Points

### Frontend Development
Agents understand:
- React + TypeScript + Vite + Material UI stack
- Component structure: pages, components, hooks, types
- Test framework: Vitest + React Testing Library
- Existing patterns in `frontend/src/`

### Backend Development
Agents understand:
- TypeScript + Node.js (Express/Fastify TBD)
- Structure: routes, services, data (repositories)
- Database: PostgreSQL
- Test patterns: `*.test.mjs` files
- RBAC enforcement in backend

### Deployment
Agents think:
- Cloud-ready (stateless, env-config)
- Migrations, health checks, secrets management
- No hardcoded config

---

## ✅ Quality Gates

Every feature passes these gates:

1. **Testing Agent**: Tests written & failing (RED)
2. **Feature Developer**: Code implemented, tests green (GREEN)
3. **Refactoring**: Code clarity if tests stay green
4. **Code Reviewer**: No defects, regressions, security issues
5. **Done**: All tests pass, linting clean, team approval

---

## 🚨 Common Patterns

### Pattern 1: "I Want Feature X"
```
User: @coordinator [Feature description]

Coordinator → Researchers (clarify) → Architect (design) 
           → Security Expert (validate) → Testing Agent (define tests)
           → Feature Developer (implement) → Code Reviewer (approve)
```

### Pattern 2: "Are These Tests Good?"
```
User: @code-reviewer [Test code]

Reviewer: Checks coverage, identifies gaps, validates behavior-protection
```

### Pattern 3: "What's the Right Architecture?"
```
User: @solution-architect [Architecture question]

Architect: Compares options, recommends best for Chellys Kitchen
```

### Pattern 4: "Is This Secure?"
```
User: @security-expert [Code/architecture]

Expert: Identifies vulnerabilities, recommends fixes
```

---

## 📋 Checklist: Setup Complete

- ☐ Read `.agents/shared/project-vision.md` (understand product)
- ☐ Read `.agents/shared/coordinator-feature-backlog.md` (know roadmap)
- ☐ Create custom instructions for all 8 agents in Copilot
- ☐ Test with @coordinator on a simple feature request
- ☐ Verify agents understand your project structure
- ☐ Use coordinator as primary entry point for planning

---

## 🎓 Learning Resources

**For using this system effectively:**

1. Start with simple requests to @coordinator
2. Example: "I want users to favorite recipes"
3. Watch how Coordinator plans & delegates
4. Try direct agent calls for quick questions
5. Build confidence in the workflow

**Key files to understand:**

- `.copilot/agents/README.md` - Agents overview
- `.copilot/INTEGRATION_GUIDE.md` - This guide
- `.agents/shared/project-vision.md` - Product north star
- `.agents/shared/coordinator-feature-backlog.md` - Roadmap

