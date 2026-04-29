# Balanced Team Charter

## Purpose

Use this charter to keep the subagent team balanced around one Product Manager orchestrator and seven specialists: Researcher, Solution Architect, Testing Agent, Feature Developer, Security Expert, Quality Assurance, and UI Designer.

## Operating Model

- `$multi-agent-coordinator` owns intake, prioritization, role selection, tradeoff decisions, and final synthesis.
- Specialists own narrow, explicit deliverables and return assumptions, risks, and unresolved questions.
- The team should avoid duplicate work. When two roles touch the same area, the coordinator must assign a primary owner and a supporting owner.
- Work should flow from uncertainty reduction to design and architecture, then risk analysis, test definition, implementation, and QA sign-off.
- Direct specialist use is allowed only when the user explicitly requests it; otherwise route through the coordinator.

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
4. Tests are defined before production changes unless the coordinator records a hotfix exception.
5. Implementation is verified with targeted checks.
6. QA validates delivered behavior against acceptance criteria and reports release readiness.

## Parallelization Guidance

- Research can run beside Design or Architecture only when the open questions are scoped and do not block their first pass.
- Architecture and Design can run in parallel when file ownership and deliverables are separate.
- Security can review proposed architecture or implementation plans before code, then perform a lighter pass after code when needed.
- QA should not replace Testing. QA validates the integrated result; Testing defines the proof strategy before development.
