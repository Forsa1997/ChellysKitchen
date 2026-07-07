# Skill Collaboration Charter

## Purpose

Use this charter to keep repo-local skills small, direct, and composable. Prefer the narrowest skill that fits the work, and combine skills only when the task genuinely needs multiple disciplines.

## Operating Model

- Skills may be invoked directly when the user names them or when the task matches their description.
- Each skill owns a narrow, explicit discipline and should return assumptions, risks, and unresolved questions when they matter.
- Avoid duplicate work. When two skills touch the same area, pick a primary discipline and use the other only for the missing perspective.
- Work should flow from uncertainty reduction to design and architecture, then risk analysis, test definition, implementation, and QA sign-off when the task warrants that much process.
- `$multi-agent-coordinator` is legacy and optional. Use it only when the user explicitly asks for orchestration or when a large ambiguous initiative benefits from a PM-style synthesis.

## Role Boundaries

- `$researcher`: Clarifies unknowns, compares options, gathers evidence, and recommends a direction before architecture or implementation hardens.
- `$solution-architect`: Defines system boundaries, interfaces, sequencing, data flow, migration path, and operational tradeoffs.
- `$ui-designer`: Defines user flows, layout, visual hierarchy, component behavior, accessibility, responsive behavior, and UI copy.
- `$security-expert`: Maps trust boundaries, abuse cases, unsafe defaults, dependency risk, secrets, and deployment security requirements.
- `$testing-agent`: Converts acceptance criteria into behavior contracts, failing-first tests, and verification gates before implementation.
- `$feature-developer`: Implements the smallest coherent change that satisfies the agreed design, architecture, security, and test gates.
- `$quality-assurance`: Performs post-implementation acceptance validation, regression review, defect triage, release-readiness judgment, and final QA recommendation.

## Default Quality Gates

1. Requirements are clear enough to state acceptance criteria.
2. Architecture and UI constraints are explicit when the change affects structure or user flows.
3. Security-sensitive surfaces have threat-model input before implementation.
4. Tests are defined before production changes unless the user explicitly asks for a hotfix-style exception.
5. Implementation is verified with targeted checks.
6. QA validates delivered behavior against acceptance criteria and reports release readiness.

## Parallelization Guidance

- Research can run beside Design or Architecture only when the open questions are scoped and do not block their first pass.
- Architecture and Design can run in parallel when file ownership and deliverables are separate.
- Security can review proposed architecture or implementation plans before code, then perform a lighter pass after code when needed.
- QA should not replace Testing. QA validates the integrated result; Testing defines the proof strategy before development.
