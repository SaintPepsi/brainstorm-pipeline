# Design Doc Writer — Autonomous Agent Instructions

## Execution Model

**This stage runs as a Task agent (model: `sonnet` or `opus`).** It receives a structured issue evaluation and produces a complete design document — no user interaction. This replaces the interactive brainstormer when requirements are already captured in a GitHub issue.

**Model selection:** Use `sonnet` by default. Escalate to `opus` when the issue evaluator flags:
- Estimated scope as `large`, OR
- Autonomy assessment as `yes-with-assumptions` with `high` assumption risk

## Purpose

Transform a structured issue evaluation into a design document that meets the same spec as the brainstormer output. The issue evaluation has already extracted requirements, acceptance criteria, and constraints from the GitHub issue — this agent's job is to explore the codebase and translate those into a design doc that Phase 2 agents can execute autonomously.

## Input

- Issue evaluation at `session-history/${SESSION_ID}/00-issue-evaluation.md`
- Project codebase (explore it yourself to understand patterns, architecture, conventions)

## Process

### 1. Read the Issue Evaluation

Read the evaluation completely. Understand:
- What type of change this is (bug-fix, enhancement, new-feature, refactor)
- All functional and non-functional requirements
- Acceptance criteria
- Constraints and context from discussion
- Related issues and dependencies
- Open questions and risks

### 2. Explore the Codebase

Before writing anything, understand how the project works:
- Read the project structure (file tree, package.json/Cargo.toml/etc.)
- Find existing patterns for similar features
- Identify the files that will need modification
- Understand testing patterns (test framework, test file locations, naming conventions)
- Check for architectural patterns (MVC, component structure, service layers, etc.)

### 3. Resolve Open Questions

The issue evaluation may flag open questions. Since there's no user to ask, resolve them by:
- **Checking the codebase** — if the question is about existing patterns, just look
- **Choosing the conservative option** — if ambiguous, pick the simpler approach
- **Documenting assumptions** — if you must assume, state it explicitly in the design doc's Risks & Assumptions section

### 4. Write the Design Doc

Produce a complete design document matching the brainstormer's output spec.

## Output

Write the design doc to two locations:
- `session-history/${SESSION_ID}/01-design-doc.md`
- `docs/designs/YYYY-MM-DD-${TOPIC}-design.md`

## Required Sections

The design doc MUST include ALL of these sections:

### Problem Statement
The pain point, existing limitations, and motivation for change. Source this from the issue evaluation's requirements and context.

### Proposed Solution
The approach, key components, and how it solves the problem. Ground this in actual codebase patterns you discovered during exploration.

### Scope Declaration
**REQUIRED** — all four fields:
- **Type**: `atomic-feature`, `multi-feature`, or `epic`
- **Estimated Complexity**: `small`, `medium`, or `large` (use the evaluator's scope estimate as a starting point)
- **Dependencies**: External services, libraries, or existing features required
- **Can Be Split**: `yes` or `no` — if yes, describe natural split points

### User Stories
Format: "As a [role], I want [action] so that [benefit]"
- Derive from the issue evaluation's functional requirements
- Include acceptance criteria for each story — pull directly from the evaluation's acceptance criteria
- At least 3 stories for non-trivial features
- Acceptance criteria must be testable (not vague)

### Technical Approach
- Architecture overview grounded in existing codebase patterns
- Key design decisions and rationale
- Integration points with existing systems
- References to existing patterns in the codebase (with file paths)
- Specific files to create or modify

### Interfaces & Contracts (Dependency Inversion)
Identify every boundary where business logic meets infrastructure (databases, APIs, file systems, external services, clocks, configuration). For each boundary:
- **Name the abstraction**: e.g., `OrderRepository`, `PaymentGateway`, `NotificationService`
- **Define the contract**: list the methods/operations the business logic needs
- **Where it lives**: the interface is owned by the domain/business layer, not the infrastructure
- **Known implementations**: which concrete implementations are expected (production, test doubles)

This section drives the entire implementation sequence — interfaces are created first, implementations second, wiring last. If this section is empty or missing, the feature has no external boundaries and DIP does not apply.

### Risks & Assumptions
- **Risks**: From the issue evaluation's risks, plus any you identified during codebase exploration
- **Assumptions**: Any open questions you resolved by assumption (be explicit)

### Source Issue
**REQUIRED** — link back to the GitHub issue:
```
- **Issue:** <owner/repo>#<number>
- **Issue Type:** <type from evaluation>
- **Labels:** <labels>
```

## Guidelines

- **Ground everything in the codebase.** Reference actual files, patterns, and conventions you found. Follow existing patterns.
- **Be thorough but concise** (2-3 pages typical). Phase 2 agents will read this as their primary input.
- **Stick to extracted requirements.** If something seems missing, note it as a risk — keep the requirements section faithful to the issue evaluation.
- **The design doc must be self-contained.** A reader with no context should understand what to build.
- **Prefer simple solutions.** When the issue is ambiguous, choose the approach with fewer moving parts.
- **Include file paths.** When referencing existing code or proposing new files, include the full path.
