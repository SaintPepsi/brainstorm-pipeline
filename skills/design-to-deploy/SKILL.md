---
name: design-to-deploy
description: "Recursive multi-agent pipeline that automates idea to design to implementation to verified tests. Each stage spawns a fresh-context agent with specific inputs/outputs, passing artifacts via filesystem. Manages git worktrees, conventional commits, test verification with retry logic, and failure escalation. TRIGGERS: design-to-deploy, brainstorm and build, implement this idea end-to-end, full pipeline, idea to implementation, design and implement."
user-invocable: true
---

# Design-to-Deploy Pipeline

Automate the journey from rough idea to verified, tested implementation.

## Code Quality: DRY, SOLID, YAGNI

All pipeline stages — planning, implementation, and tests — must follow DRY, SOLID, and YAGNI principles. Import shared logic, never copy-paste it. If something exists in the codebase, use it. If it will be needed in more than one place, extract it into a shared module. Tests import production constants/types — never redefine them.

### Dependency Inversion (DIP) — First-Class Principle

DIP is the most impactful SOLID principle for generated code and gets special emphasis across the pipeline. The full pattern reference lives at `references/patterns/dependency-inversion.md` — sub-agents that produce or review code should read it.

The core rule: **business logic defines the interfaces it needs; infrastructure implements them.** Dependencies point inward — the domain never imports from infrastructure.

Every pipeline stage enforces DIP:

- **Brainstorm**: Identify module boundaries and list which dependencies should be abstracted in an "Interfaces & Contracts" section of the design doc.
- **Planning**: Sequence abstraction definitions before implementations. Interfaces are created first, then concrete classes, then wiring at the composition root.
- **Implementation**: Create interface/protocol files before implementation files. Wire dependencies at a single composition root — never construct dependencies inside business logic.
- **Testing**: Write test doubles that implement the same interfaces as production code. Test through abstractions, not concrete implementations.
- **Review**: Flag DIP violations — business logic importing infrastructure, missing interfaces at boundaries, dependencies constructed internally instead of injected.

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

### 2. Create Pipeline Tasks

After setting up the worktree, create a task for each pipeline stage so progress is visible in the terminal:

- Create a task for "Brainstorm design with user"
- Create a task for "Validate scope"
- Create a task for "Plan unit tests"
- Create a task for "Plan e2e tests"
- Create a task for "Plan feature implementation"
- Create a task for "Cross-check plans"
- Create a task for "Implement tests (failing)"
- Create a task for "Implement feature"
- Create a task for "Verify unit tests pass"
- Create a task for "Verify e2e tests pass"
- Create a task for "Verify design compliance"
- Create a task for "Compile final review"

Mark each task in-progress when starting the stage and complete when the stage finishes.

### 3. Phase 1 — Interactive Brainstorm

**Run this yourself in main context. Do NOT spawn a Task agent.**

Mark the "Brainstorm design with user" task as in-progress.

Read `references/sub-skills/brainstormer.md` for the brainstorm process. Then have a conversation with the user:

1. Explore the codebase to understand existing patterns, architecture, and conventions.
2. Ask the user probing questions about their idea — what problem it solves, constraints, expected behaviour.
3. Iterate on the design through dialogue until the user is satisfied.
4. Write the design doc to `session-history/${SESSION_ID}/01-design-doc.md` and `docs/designs/YYYY-MM-DD-${TOPIC}-design.md`.
5. Commit: `design(${TOPIC}): brainstorm complete`

Mark the "Brainstorm design with user" task as complete.

**The design doc is the handoff point.** It must capture every decision so that Phase 2 agents can work without asking the user anything.

### 4. Phase 2 — Autonomous Build

Once the design doc is committed, **run `/compact` to clear the brainstorm conversation from context**, then run the remaining stages as Task agents. For each stage, spawn a fresh Task agent with: the sub-skill doc path (for the agent to read) + the input file paths + the recommended model.

**Stage 2 — Validate Scope:** Mark the "Validate scope" task as in-progress. Spawn Task agent (model: `haiku`) → reads `references/sub-skills/scope-validator.md` + design doc. Checks scope against heuristics, may split into multiple design docs.

- Output: `session-history/${SESSION_ID}/02-scope-validation.md`
- Commit: `design(${TOPIC}): scope validated`
- Mark the "Validate scope" task as complete.

**Stages 3-5 — Plan (parallel):** Mark the "Plan unit tests", "Plan e2e tests", and "Plan feature implementation" tasks as in-progress. Launch **3 Task agents in a single message** (model: `sonnet`):

- Agent 1 → reads `references/sub-skills/unit-test-planner.md` + design doc → `session-history/${SESSION_ID}/03-unit-test-plan.md`
- Agent 2 → reads `references/sub-skills/e2e-test-planner.md` + design doc → `session-history/${SESSION_ID}/04-e2e-test-plan.md`
- Agent 3 → reads `references/sub-skills/feature-planner.md` + design doc → `session-history/${SESSION_ID}/05-feature-plan.md`
- Commit: `plan(${TOPIC}): all plans generated`
- Mark all three planning tasks as complete.
- **Run `/compact` after collecting results**

**Stage 6 — Cross-Check:** Mark the "Cross-check plans" task as in-progress. Spawn Task agent (model: `sonnet`) → reads `references/sub-skills/plan-reviewer.md` + all 3 plans + design doc. Finds gaps, inconsistencies, patches the plans.

- Output: `session-history/${SESSION_ID}/06-cross-check-report.md`
- Commit: `plan(${TOPIC}): cross-check complete`
- Mark the "Cross-check plans" task as complete.

**Stage 7a — Implement Unit Tests:** Mark the "Implement tests (failing)" task as in-progress. Spawn Task agent (model: `sonnet`) → reads `references/sub-skills/test-implementer.md` + unit test plan. Writes tests that **must fail** (feature doesn't exist yet). Run test command to confirm failure.

- Commit: `test(${TOPIC}): unit tests implemented (failing)`

**Stage 7b — Implement E2E Tests:** Spawn Task agent (model: `sonnet`) → same sub-skill + e2e test plan. Tests **must fail**.

- Commit: `test(${TOPIC}): e2e tests implemented (failing)`
- Mark the "Implement tests (failing)" task as complete.

**Stage 7c — Implement Feature:** Mark the "Implement feature" task as in-progress. Spawn Task agent (model: `sonnet`, or `opus` for complex logic) → reads `references/sub-skills/feature-implementer.md` + feature plan + design doc + test files (so it knows what to satisfy).

- Commit: `feat(${TOPIC}): feature implemented`
- Mark the "Implement feature" task as complete.
- **Run `/compact` after implementation completes**

**Stage 7d — Verify Unit Tests:** Mark the "Verify unit tests pass" task as in-progress. Spawn Task agent (model: `sonnet`) → reads `references/sub-skills/test-verifier.md`. Runs unit tests. If they fail, apply retry logic (see below).

- Commit: `test(${TOPIC}): unit tests passing`
- Mark the "Verify unit tests pass" task as complete.

**Stage 7e — Verify E2E Tests:** Mark the "Verify e2e tests pass" task as in-progress. Spawn Task agent (model: `sonnet`) → same sub-skill for e2e. Runs e2e tests. Apply retry logic if needed.

- Commit: `test(${TOPIC}): e2e tests passing`
- Mark the "Verify e2e tests pass" task as complete.

**Stage 7f — Verify Design Compliance:** Mark the "Verify design compliance" task as in-progress. Spawn Task agent (model: `sonnet`) → reads `references/sub-skills/design-compliance-checker.md` + design doc + all implementations. Checks every acceptance criterion.

- Output: `session-history/${SESSION_ID}/09-design-compliance.md`
- Commit: `verify(${TOPIC}): design compliance confirmed`
- Mark the "Verify design compliance" task as complete.

**Stage 8 — Final Review:** Mark the "Compile final review" task as in-progress. Spawn Task agent (model: `haiku`) → reads `references/sub-skills/review-compiler.md` + all artifacts. Produces human handoff notes.

- Output: `session-history/${SESSION_ID}/10-review-notes.md`
- Mark the "Compile final review" task as complete.

### 5. Finalise

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
