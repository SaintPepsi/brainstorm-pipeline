---
name: design-to-deploy
description: "Recursive multi-agent pipeline that automates idea to design to implementation to verified tests. Each stage spawns a fresh-context agent with specific inputs/outputs, passing artifacts via filesystem. Manages git worktrees, conventional commits, test verification with retry logic, and failure escalation. TRIGGERS: design-to-deploy, brainstorm and build, implement this idea end-to-end, full pipeline, idea to implementation, design and implement."
user-invocable: true
---

# Design-to-Deploy Pipeline

Automate the journey from rough idea to verified, tested implementation.

## Code Quality Principles: DRY + SOLID

These principles apply to **every stage** of the pipeline — planning, implementation, and tests.

### DRY (Don't Repeat Yourself)

Never copy-paste code that can be imported. If logic exists somewhere, import it. If it doesn't exist yet but will be used in more than one place, extract it into a shared module first.

- **In implementation**: Extract shared utilities, constants, types, and helpers into dedicated modules. Import them everywhere they're needed.
- **In tests**: Create shared test helpers, fixtures, factories, and setup utilities. Import them across test files instead of duplicating setup code.
- **Between implementation and tests**: Tests should import the same constants, types, and validation logic that production code uses — never redefine them.

### SOLID

- **Single Responsibility**: Each module, class, and function does one thing. If a function needs an "and" to describe it, split it.
- **Open/Closed**: Design for extension without modification. Use composition, callbacks, or strategy patterns over conditional branching on type.
- **Liskov Substitution**: Subtypes must be substitutable for their base types without breaking behaviour.
- **Interface Segregation**: Don't force consumers to depend on methods they don't use. Keep interfaces focused.
- **Dependency Inversion**: Depend on abstractions, not concretions. Pass dependencies in rather than hard-coding them.

### Enforcement

These principles are checked at multiple pipeline stages:
- **Planning** — planners must identify shared modules and reuse opportunities
- **Cross-check** — reviewer flags duplication across plans
- **Implementation** — implementers must extract, not copy
- **Compliance** — checker verifies no DRY/SOLID violations in final code

## Two Phases

The pipeline has two distinct phases with different execution models:

**Phase 1 — Interactive Brainstorm (main context).** You talk directly with the user to shape their idea into a design doc. This is a conversation — the user needs to answer questions, make decisions, and approve the design. Run this in your own context, not as a sub-agent.

**Phase 2 — Autonomous Build (sub-agents).** Once the design doc captures all decisions, the remaining stages run autonomously as Task agents. Each stage gets a fresh context with only the files it needs. No user interaction required.

## Cost Management

Running a full pipeline on Opus can easily exceed $30. Most of that cost comes from context re-processing across many turns, not from output generation. Follow these rules to keep costs under control:

### Model Selection

Not every stage needs Opus. Use the `model` parameter on Task agents:

| Stage                  | Recommended Model                      | Why                                         |
| ---------------------- | -------------------------------------- | ------------------------------------------- |
| Phase 1 brainstorm     | User's current model                   | Interactive, benefits from strong reasoning |
| Scope validation       | `haiku`                                | Checklist-based, low complexity             |
| Test/feature planning  | `sonnet`                               | Structured output from a design doc         |
| Cross-check review     | `sonnet`                               | Comparison and gap analysis                 |
| Test implementation    | `sonnet`                               | Translating plans to code                   |
| Feature implementation | `sonnet` (or `opus` for complex logic) | Code generation from a clear plan           |
| Test verification      | `sonnet`                               | Running tests, reading output               |
| Systematic debugger    | `opus`                                 | Complex reasoning about failures            |
| Design compliance      | `sonnet`                               | Checklist verification                      |
| Final review           | `haiku`                                | Summarisation task                          |

### Compaction Checkpoints

Run `/compact` at these points to prevent context bloat in the orchestrator:

1. **After Phase 1 completes** — the brainstorm conversation is no longer needed; the design doc captures everything.
2. **After launching parallel planning agents** — while waiting for results, compact the orchestrator context.
3. **Before the implementation stages** — context from planning results can be dropped once plans are written to disk.

### Turn Budget

Aim for these approximate turn counts per phase:

- Phase 1 brainstorm: 15-30 turns (batch questions, avoid single-question turns)
- Phase 2 orchestration: 20-30 turns (launch agents, collect results, commit)
- Each sub-agent: 10-30 turns depending on complexity

If the orchestrator exceeds 60 turns or context exceeds 80K tokens, something is wrong — compact or split.

## CRITICAL: Context Isolation Rules

1. **Do NOT read sub-skill docs in your main context** (except `brainstormer.md` for Phase 1). When spawning Task agents for Phase 2, pass the sub-skill doc path in the prompt and let the Task agent read it.
2. **Each Task agent gets only** the sub-skill doc path + its specific input files. Never dump accumulated context into a Task prompt.
3. **Artifacts pass via filesystem.** Each stage writes its output to `session-history/`, and the next stage reads from there.

Bad (pollutes your context):

```
# DON'T do this
Read references/sub-skills/scope-validator.md   ← you're reading it yourself
Then spawn Task agent with the content
```

Good (context stays clean):

```
# DO this
Spawn Task agent with prompt:
  "Read references/sub-skills/scope-validator.md, then validate the design doc at
   session-history/{SESSION_ID}/01-design-doc.md. Write output to
   session-history/{SESSION_ID}/02-scope-validation.md"
```

## Pipeline Overview

```
Phase 1 (interactive, main context):
  BRAINSTORM with user → design doc

Phase 2 (autonomous, Task agents):
  VALIDATE SCOPE → [PLAN UNIT | PLAN E2E | PLAN FEATURE] → CROSS-CHECK
    → IMPL TESTS (failing) → IMPL FEATURE → VERIFY TESTS → VERIFY DESIGN → REVIEW
```

## How to Run

### 1. Set Up Worktree

Create an isolated branch. All work happens here — main stays clean.

```bash
TOPIC="my-feature"  # kebab-case, derived from the idea
SESSION_ID=$(date +%Y-%m-%d-%H-%M)-${TOPIC}

git worktree add .worktrees/${SESSION_ID} -b feature/${TOPIC}
cd .worktrees/${SESSION_ID}
mkdir -p session-history/${SESSION_ID}/08-test-results/screenshots
```

### 2. Phase 1 — Interactive Brainstorm

**Run this yourself in main context. Do NOT spawn a Task agent.**

Read `references/sub-skills/brainstormer.md` for the brainstorm process. Then have a conversation with the user:

1. Explore the codebase to understand existing patterns, architecture, and conventions.
2. Ask the user probing questions about their idea — what problem it solves, constraints, expected behaviour.
3. Iterate on the design through dialogue until the user is satisfied.
4. Write the design doc to `session-history/${SESSION_ID}/01-design-doc.md` and `docs/designs/YYYY-MM-DD-${TOPIC}-design.md`.
5. Commit: `design(${TOPIC}): brainstorm complete`

**The design doc is the handoff point.** It must capture every decision so that Phase 2 agents can work without asking the user anything.

### 3. Phase 2 — Autonomous Build

Once the design doc is committed, **run `/compact` to clear the brainstorm conversation from context**, then run the remaining stages as Task agents. For each stage, spawn a fresh Task agent with: the sub-skill doc path (for the agent to read) + the input file paths + the recommended model.

**Stage 2 — Validate Scope:** Spawn Task agent (model: `haiku`) → reads `references/sub-skills/scope-validator.md` + design doc. Checks scope against heuristics, may split into multiple design docs.

- Output: `session-history/${SESSION_ID}/02-scope-validation.md`
- Commit: `design(${TOPIC}): scope validated`

**Stages 3-5 — Plan (parallel):** Launch **3 Task agents in a single message** (model: `sonnet`):

- Agent 1 → reads `references/sub-skills/unit-test-planner.md` + design doc → `session-history/${SESSION_ID}/03-unit-test-plan.md`
- Agent 2 → reads `references/sub-skills/e2e-test-planner.md` + design doc → `session-history/${SESSION_ID}/04-e2e-test-plan.md`
- Agent 3 → reads `references/sub-skills/feature-planner.md` + design doc → `session-history/${SESSION_ID}/05-feature-plan.md`
- Commit: `plan(${TOPIC}): all plans generated`
- **Run `/compact` after collecting results**

**Stage 6 — Cross-Check:** Spawn Task agent (model: `sonnet`) → reads `references/sub-skills/plan-reviewer.md` + all 3 plans + design doc. Finds gaps, inconsistencies, patches the plans.

- Output: `session-history/${SESSION_ID}/06-cross-check-report.md`
- Commit: `plan(${TOPIC}): cross-check complete`

**Stage 7a — Implement Unit Tests:** Spawn Task agent (model: `sonnet`) → reads `references/sub-skills/test-implementer.md` + unit test plan. Writes tests that **must fail** (feature doesn't exist yet). Run test command to confirm failure.

- Commit: `test(${TOPIC}): unit tests implemented (failing)`

**Stage 7b — Implement E2E Tests:** Spawn Task agent (model: `sonnet`) → same sub-skill + e2e test plan. Tests **must fail**.

- Commit: `test(${TOPIC}): e2e tests implemented (failing)`

**Stage 7c — Implement Feature:** Spawn Task agent (model: `sonnet`, or `opus` for complex logic) → reads `references/sub-skills/feature-implementer.md` + feature plan + design doc + test files (so it knows what to satisfy).

- Commit: `feat(${TOPIC}): feature implemented`
- **Run `/compact` after implementation completes**

**Stage 7d — Verify Unit Tests:** Spawn Task agent (model: `sonnet`) → reads `references/sub-skills/test-verifier.md`. Runs unit tests. If they fail, apply retry logic (see below).

- Commit: `test(${TOPIC}): unit tests passing`

**Stage 7e — Verify E2E Tests:** Spawn Task agent (model: `sonnet`) → same sub-skill for e2e. Runs e2e tests. Apply retry logic if needed.

- Commit: `test(${TOPIC}): e2e tests passing`

**Stage 7f — Verify Design Compliance:** Spawn Task agent (model: `sonnet`) → reads `references/sub-skills/design-compliance-checker.md` + design doc + all implementations. Checks every acceptance criterion.

- Output: `session-history/${SESSION_ID}/09-design-compliance.md`
- Commit: `verify(${TOPIC}): design compliance confirmed`

**Stage 8 — Final Review:** Spawn Task agent (model: `haiku`) → reads `references/sub-skills/review-compiler.md` + all artifacts. Produces human handoff notes.

- Output: `session-history/${SESSION_ID}/10-review-notes.md`

### 4. Finalise

**On success** — merge and clean up:

```bash
cd ../../  # back to project root
git merge feature/${TOPIC}
git worktree remove .worktrees/${SESSION_ID}
```

**On failure** — preserve for human review:

```
Pipeline failed at stage: {STAGE}
Worktree preserved at: .worktrees/${SESSION_ID}
To resume: cd .worktrees/${SESSION_ID}
To abandon: git worktree remove .worktrees/${SESSION_ID} --force
```

## Test Verification Retry Logic

When tests fail during verification:

1. **Attempt 1-2**: Fix within the test-verifier agent context (model: `sonnet`)
2. **Attempt 3**: Spawn a new Task agent (model: `opus`) using `references/sub-skills/systematic-debugger.md` — 4-phase methodology: root cause investigation, pattern analysis, hypothesis testing, implementation. This is where Opus earns its cost.
3. **Attempt 4+**: **STOP PIPELINE** — write a failure report to session history, preserve worktree, tell the user what failed and why

**Red flags that trigger immediate STOP**: "quick fix for now", multiple changes at once, 3+ failed attempts without clear progress.

## Scope Validation Heuristics

Flag for splitting when any of these are true:

- Estimated files to create > 10
- Estimated files to modify > 15
- Estimated implementation time > 4 hours
- Distinct feature areas > 3
- External API integrations > 2
- New database tables > 3

Design docs must include:

```markdown
## Scope Declaration

- Type: [atomic-feature | multi-feature | epic]
- Estimated Complexity: [small | medium | large]
- Dependencies: [list]
- Can Be Split: [yes | no]
```

## Session History

```
session-history/${SESSION_ID}/
  01-design-doc.md
  02-scope-validation.md
  03-unit-test-plan.md
  04-e2e-test-plan.md
  05-feature-plan.md
  06-cross-check-report.md
  07-implementation-log.md
  08-test-results/
    unit-test-output.txt
    e2e-test-output.txt
    screenshots/
  09-design-compliance.md
  10-review-notes.md
```

## Sub-Skill Reference

| Sub-Skill                   | Runs In          | Input                       | Output               |
| --------------------------- | ---------------- | --------------------------- | -------------------- |
| `brainstormer`              | **Main context** | User idea + project context | design-doc.md        |
| `scope-validator`           | Task agent       | design-doc.md               | validated/split docs |
| `unit-test-planner`         | Task agent       | design-doc.md               | unit-test-plan.md    |
| `e2e-test-planner`          | Task agent       | design-doc.md               | e2e-test-plan.md     |
| `feature-planner`           | Task agent       | design-doc.md               | feature-plan.md      |
| `plan-reviewer`             | Task agent       | All 3 plans + design doc    | patched plans        |
| `test-implementer`          | Task agent       | test-plan.md                | test files (failing) |
| `feature-implementer`       | Task agent       | feature-plan.md             | feature code         |
| `test-verifier`             | Task agent       | test files + code           | pass/fail + fixes    |
| `systematic-debugger`       | Task agent       | failing tests + errors      | debugging-report.md  |
| `design-compliance-checker` | Task agent       | design doc + all code       | compliance-report.md |
| `review-compiler`           | Task agent       | all artifacts               | review-notes.md      |

All sub-skill docs live in `references/sub-skills/`.
