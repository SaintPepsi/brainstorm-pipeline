# Brainstormer — Main Context Instructions

## Execution Model

**This stage runs in YOUR main context, not as a Task agent.** You need to have a back-and-forth conversation with the user to shape their idea. The user must be able to answer questions and make decisions.

## Purpose

Transform a rough idea into a structured design document through dialogue with the user. The design doc is the handoff point to Phase 2 — it must capture every decision so autonomous agents can work without user input.

## Input

- User's rough idea or feature request
- Project codebase (explore it yourself to understand patterns, architecture, conventions)

## Process

1. **Explore the Codebase**: Before asking the user anything, look at the project structure, existing patterns, and conventions. Understand how similar features are built.

2. **Ask Probing Questions**: Have a dialogue with the user to clarify:
   - What problem does this solve?
   - Who benefits from this?
   - What's the expected behaviour?
   - Are there constraints or dependencies?
   - How should it interact with existing features?

3. **Iterate on the Design**: Refine based on user feedback. Ask follow-ups. Validate your understanding before documenting. Don't assume — confirm.

4. **Write the Design Doc**: Once the user is satisfied, produce the document.

## Output

Write the design doc to two locations:
- `session-history/${SESSION_ID}/01-design-doc.md`
- `docs/designs/YYYY-MM-DD-${TOPIC}-design.md`

## Required Sections

The design doc MUST include these sections:

### Problem Statement
The pain point, existing limitations, and motivation for change.

### Proposed Solution
The approach, key components, and how it solves the problem.

### Scope Declaration
**REQUIRED** — all four fields:
- **Type**: `atomic-feature`, `multi-feature`, or `epic`
- **Estimated Complexity**: `small`, `medium`, or `large`
- **Dependencies**: External services, libraries, or existing features required
- **Can Be Split**: `yes` or `no` — if yes, describe natural split points

### User Stories
Format: "As a [role], I want [action] so that [benefit]"
- Include acceptance criteria for each story
- At least 3 stories for non-trivial features
- Acceptance criteria must be testable (not vague)

### Technical Approach
- Architecture overview
- Key design decisions and rationale
- Integration points with existing systems
- References to existing patterns in the codebase
- Identify shared modules / reusable code that implementation and tests should both import (DRY)

### Interfaces & Contracts (Dependency Inversion)
Identify every boundary where business logic meets infrastructure (databases, APIs, file systems, external services, clocks, configuration). For each boundary:
- **Name the abstraction**: e.g., `OrderRepository`, `PaymentGateway`, `NotificationService`
- **Define the contract**: list the methods/operations the business logic needs
- **Where it lives**: the interface is owned by the domain/business layer, not the infrastructure
- **Known implementations**: which concrete implementations are expected (production, test doubles)

This section drives the entire implementation sequence — interfaces are created first, implementations second, wiring last. If this section is empty or missing, the feature has no external boundaries and DIP does not apply.

### Risks & Assumptions
- **Risks**: Potential technical or scope challenges
- **Assumptions**: Dependencies on external factors, infrastructure

## Guidelines

- Be thorough but concise (2-3 pages typical)
- Use dialogue to ensure clarity — confirm understanding before documenting
- Focus on "why" before "how"
- Document trade-offs explicitly
- Reference existing codebase patterns so Phase 2 agents follow conventions
- The design doc must be self-contained: a reader with no context should understand what to build
