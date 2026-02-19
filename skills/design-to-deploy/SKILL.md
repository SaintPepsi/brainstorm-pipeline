---
name: design-to-deploy
description: "Recursive multi-agent pipeline that automates idea to design to implementation to verified tests. Each stage spawns a fresh-context agent with specific inputs/outputs, passing artifacts via filesystem. Manages git worktrees, conventional commits, test verification with retry logic, and failure escalation. TRIGGERS: design-to-deploy, brainstorm and build, implement this idea end-to-end, full pipeline, idea to implementation, design and implement."
user-invocable: true
---

# Design-to-Deploy Pipeline

Automate the journey from rough idea to verified, tested implementation.

## Code Quality: DRY, SOLID, YAGNI

All pipeline stages — planning, implementation, and tests — follow DRY, SOLID, and YAGNI principles. Import shared logic from existing modules. Tests import production constants/types.

### Dependency Inversion (DIP) — First-Class Principle

DIP is the most impactful SOLID principle for generated code and gets special emphasis across the pipeline. The full pattern reference lives at `references/patterns/dependency-inversion.md` — sub-agents that produce or review code should read it.

The core rule: **business logic defines the interfaces it needs; infrastructure implements them.** Dependencies point inward — the domain imports only its own abstractions.

Every pipeline stage enforces DIP:

- **Brainstorm**: Identify module boundaries and list which dependencies should be abstracted in an "Interfaces & Contracts" section of the design doc.
- **Planning**: Sequence abstraction definitions before implementations. Interfaces first, then concrete classes, then wiring at the composition root.
- **Implementation**: Create interface/protocol files before implementation files. Wire dependencies at a single composition root. Business logic accepts dependencies through constructors or parameters.
- **Testing**: Write test doubles that implement the same interfaces as production code. Test business logic through abstractions.
- **Review**: Flag DIP violations — business logic importing infrastructure, missing interfaces at boundaries, dependencies constructed internally.

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

**Before every compaction**, update `PROGRESS.md` in the worktree root (use the template from `workspace/templates/PROGRESS.md`). This captures decisions and state so post-compaction context can be reconstructed cheaply by reading a single file instead of replaying conversation history.

### Iteration Limits

Every retry loop has a hard cap. Include the relevant limit in every Task prompt: *"You have N attempts to fix X. If X still fails after N attempts, stop and report the failures."*

| Loop | Cap | On Exceed |
|------|-----|-----------|
| Test verification (in-context fixes) | 2 attempts | Escalate to systematic-debugger |
| Systematic debugger | 1 attempt | STOP pipeline, write failure report |
| Build/lint fix cycles | 5 attempts | STOP, write failure report |
| Agent self-correction (any stage) | 3 rounds | STOP, report to orchestrator |
| Codebase exploration (tool calls) | 10 calls | Pause, reassess search strategy |

### Agent Persistence for Coupled Stages

**Persist (use resume):** 7a→7b (unit→e2e test impl), 7d→7e (unit→e2e verification).

**Spawn fresh:** planning→implementation, implementation→verification, any stage after compaction.

When resuming, pass only the delta (new file paths, updated `PROGRESS.md`).

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

Best (for agents after a compaction):

```
# DO this for agents after a compaction
Spawn Task agent with prompt:
  "Read PROGRESS.md for pipeline state, then read references/sub-skills/test-verifier.md.
   Run unit tests. You have 2 attempts to fix failures.
   Update PROGRESS.md when done."
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
cp workspace/templates/PROGRESS.md PROGRESS.md
# Fill in Pipeline section immediately: skill, session ID, topic, worktree path
```

### 2. Create Pipeline Tasks

After setting up the worktree, use TodoWrite to create **all 14 tasks upfront** so every stage is visible in the terminal from the start. This is the single source of truth for pipeline progress — a stage is not done until its task is marked complete.

```
TodoWrite tasks (create all at once, all status: pending):
 1. "Brainstorm design with user"
 2. "Validate scope"
 3. "Plan unit tests"
 4. "Plan e2e tests"
 5. "Plan feature implementation"
 6. "Cross-check plans"
 7. "Implement unit tests (failing)"
 8. "Implement E2E tests (failing)"
 9. "Implement feature"
10. "Verify unit tests pass"
11. "Verify E2E tests pass"
12. "Verify design compliance"
13. "Compile final review"
14. "Finalise — push and create PR"
```

**Task discipline (MANDATORY):**

- **Mark in-progress** before starting each stage — no stage begins without this.
- **Mark complete** only after the stage's output artifact is written and committed.
- **Never mark a task complete early.** If a stage has sub-parts (e.g. unit + E2E), each has its own task.
- **Never skip a task.** Every pending task must reach complete or the pipeline is considered failed.
- **Check remaining tasks** after each stage completes. If any tasks were accidentally skipped, go back and do them before continuing.

> **Common failure mode:** After implementing the feature (task 9), the orchestrator "forgets" the remaining verification tasks (10-13) because the core work feels done. The verification stages exist specifically to catch issues that the implementation stage cannot self-verify. Do not skip them.

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
- **Not-applicable outputs:** A planner may determine that its test type is not needed for this feature (e.g. a UI layout refactor needs no unit tests, or a pure utility module needs no E2E tests). This is a valid outcome — the planner writes a short plan stating "Not applicable" with rationale. The corresponding implementation stage (7a/7b) and verification stage (7d/7e) are then skipped. Record the skip reason in `PROGRESS.md`.
- Commit: `plan(${TOPIC}): all plans generated`
- Mark all three planning tasks as complete.
- **Run `/compact` after collecting results**

**Stage 6 — Cross-Check:** Mark the "Cross-check plans" task as in-progress. Spawn Task agent (model: `sonnet`) → reads `references/sub-skills/plan-reviewer.md` + all 3 plans + design doc. Finds gaps, inconsistencies, patches the plans.

- Output: `session-history/${SESSION_ID}/06-cross-check-report.md`
- Commit: `plan(${TOPIC}): cross-check complete`
- Mark the "Cross-check plans" task as complete.

**Stage 7a — Implement Unit Tests:** If the unit test plan says "Not applicable", mark "Implement unit tests (failing)" as complete immediately (no agent spawn needed) and note the skip in `PROGRESS.md`. Otherwise: mark as in-progress, spawn Task agent (model: `sonnet`) → reads `references/sub-skills/test-implementer.md` + unit test plan. Writes tests that **must fail** (feature doesn't exist yet). Run test command to confirm failure.

- Commit: `test(${TOPIC}): unit tests implemented (failing)`
- Mark the "Implement unit tests (failing)" task as complete.
- **Save the agent ID for reuse in 7b.**

**Stage 7b — Implement E2E Tests:** If the E2E test plan says "Not applicable", mark "Implement E2E tests (failing)" as complete immediately and note the skip in `PROGRESS.md`. Otherwise: mark as in-progress, **resume the 7a agent** (same sub-skill, same codebase understanding) → pass the e2e test plan path. Tests **must fail**. Run test command to confirm failure.

- Commit: `test(${TOPIC}): e2e tests implemented (failing)`
- Update `PROGRESS.md` with completed stages.
- Mark the "Implement E2E tests (failing)" task as complete.

**Stage 7c — Implement Feature:** Mark the "Implement feature" task as in-progress. Spawn Task agent (model: `sonnet`, or `opus` for complex logic) → reads `references/sub-skills/feature-implementer.md` + feature plan + design doc + test files (so it knows what to satisfy).

- Commit: `feat(${TOPIC}): feature implemented`
- Mark the "Implement feature" task as complete.
- **Run `/compact` after implementation completes**

**Stage 7d — Verify Unit Tests:** If unit tests were skipped (plan said "Not applicable"), mark "Verify unit tests pass" as complete immediately. Otherwise: mark as in-progress, spawn Task agent (model: `sonnet`) → reads `references/sub-skills/test-verifier.md` + `PROGRESS.md`. Runs unit tests. If they fail, apply retry logic (see below). **Include iteration limit in prompt: "You have 2 attempts to fix failing tests."**

- Commit: `test(${TOPIC}): unit tests passing`
- Mark the "Verify unit tests pass" task as complete.
- **Save the agent ID for reuse in 7e.**

**Stage 7e — Verify E2E Tests:** If E2E tests were skipped (plan said "Not applicable"), mark "Verify E2E tests pass" as complete immediately. Otherwise: mark as in-progress, **resume the 7d agent** (same verification context) → pass e2e test command. Runs e2e tests. Apply retry logic if needed. **Include iteration limit in prompt: "You have 2 attempts to fix failing tests."**

- Commit: `test(${TOPIC}): e2e tests passing`
- Update `PROGRESS.md` with verification results.
- Mark the "Verify e2e tests pass" task as complete.

**Stage 7f — Verify Design Compliance:** Mark the "Verify design compliance" task as in-progress. Spawn Task agent (model: `sonnet`) → reads `references/sub-skills/design-compliance-checker.md` + design doc + all implementations. Checks every acceptance criterion.

- Output: `session-history/${SESSION_ID}/09-design-compliance.md`
- Commit: `verify(${TOPIC}): design compliance confirmed`
- Mark the "Verify design compliance" task as complete.

**Stage 8 — Final Review:** Mark the "Compile final review" task as in-progress. Spawn Task agent (model: `haiku`) → reads `references/sub-skills/review-compiler.md` + all artifacts. Produces human handoff notes.

- Output: `session-history/${SESSION_ID}/10-review-notes.md`
- Commit: `review(${TOPIC}): final review compiled`
- Mark the "Compile final review" task as complete.

### 5. Pipeline Completion Gate

Before finalising, **review the full task list** and confirm every task (1-13) is marked complete. If any task is still pending or in-progress, go back and complete it now. Do not proceed to finalise with incomplete tasks.

```
Expected state before finalise:
 1. "Brainstorm design with user"         → completed
 2. "Validate scope"                      → completed
 3. "Plan unit tests"                     → completed
 4. "Plan e2e tests"                      → completed
 5. "Plan feature implementation"         → completed
 6. "Cross-check plans"                   → completed
 7. "Implement unit tests (failing)"      → completed
 8. "Implement E2E tests (failing)"       → completed
 9. "Implement feature"                   → completed
10. "Verify unit tests pass"              → completed
11. "Verify E2E tests pass"              → completed
12. "Verify design compliance"            → completed
13. "Compile final review"                → completed
14. "Finalise — push and create PR"       → in_progress
```

If any task from 1-13 is not completed, **STOP** and complete it before moving on.

### 6. Finalise

Mark the "Finalise — push and create PR" task as in-progress.

**On success** — push and create PR:

```bash
git push origin feature/${TOPIC} -u
gh pr create --base master --head feature/${TOPIC} \
  --title "{PR title from review notes}" \
  --body "{summary from 10-review-notes.md}"
# Worktree is preserved until PR is merged
```

Mark the "Finalise — push and create PR" task as complete.

**On failure** — preserve for human review:

```
Pipeline failed at stage: {STAGE}
Worktree preserved at: .worktrees/${SESSION_ID}
To resume: cd .worktrees/${SESSION_ID}
To abandon: git worktree remove .worktrees/${SESSION_ID} --force
```

## Test Verification Retry Logic

When tests fail during verification:

1. **Attempt 1-2**: Fix within the test-verifier agent context (model: `sonnet`). Prompt: *"You have 2 attempts to fix failing tests. After 2 failed attempts, stop and report the failures."*
2. **Attempt 3**: Spawn a new Task agent (model: `opus`) using `references/sub-skills/systematic-debugger.md` — 4-phase methodology: root cause investigation, pattern analysis, hypothesis testing, implementation. This is where Opus earns its cost. Prompt: *"You have 1 attempt. If tests still fail after this attempt, write a failure report and stop."*
3. **Attempt 4+**: **STOP PIPELINE** — write a failure report to `session-history/${SESSION_ID}/08-test-results/failure-report.md`, update `PROGRESS.md` with the blocker, preserve worktree, tell the user what failed and why.

**Red flags that trigger immediate STOP**: "quick fix for now", multiple changes at once, 3+ failed attempts without clear progress, context exceeding 100K tokens in a verification agent.

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
