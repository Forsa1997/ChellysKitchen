---
name: multi-agent-coordinator
description: Coordinate multiple specialist Codex agents for application work. Use when a task benefits from parallel expert passes, cross-functional breakdowns, or deliberate handoffs between architecture, design, security, and implementation roles.
---

# Multi Agent Coordinator

## Overview

Coordinate specialist work for this repository without duplicating effort. Split the task into bounded expert scopes, keep ownership clear, and integrate the results into one coherent outcome.

## Required Context

Read `../../shared/project-vision.md` before planning or delegating work. Treat it as the shared product brief for this repository, and include its assumptions in delegated prompts when they matter.

## Workflow

1. Read the user request and inspect the relevant code before assigning work.
2. Decide which specialists are necessary. Skip roles that do not add material value.
3. Give each specialist a narrow scope, explicit deliverable, and concrete ownership when code changes are involved.
4. Run independent work in parallel only when the write scopes do not overlap.
5. Keep immediate blocking work local when waiting on another agent would stall progress.
6. Reconcile conflicts between specialists and return one recommendation or implementation path.

## Role Selection

- Use `$solution-architect` for system boundaries, interfaces, sequencing, and tradeoffs.
- Use `$ui-designer` for UX flows, layout, hierarchy, component behavior, and responsive design.
- Use `$security-expert` for trust boundaries, auth, validation, dependency risk, browser security, and exploit analysis.
- Use `$feature-developer` for implementation once the requirements and constraints are clear enough to code.

## Delegation Rules

- Assign ownership by file set, module, or responsibility area.
- Require each specialist to state assumptions, risks, and unresolved questions.
- Avoid sending the same open question to multiple specialists unless comparison is the point.
- Integrate specialist output back into one answer instead of relaying disconnected notes.
- When the task touches foundations, explicitly ask specialists to call out cloud-hosting implications.

## Output

- Start with the recommended path.
- Summarize specialist input by role.
- Call out conflicts, tradeoffs, and the chosen resolution.
- End with the next concrete implementation or review step.

## Repo Focus

This repository currently centers on a React, TypeScript, Vite, and MUI frontend. Treat backend architecture as future-facing unless the user explicitly introduces backend scope.
