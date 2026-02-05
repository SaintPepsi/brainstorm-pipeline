---
name: design-to-deploy
description: "Recursive multi-agent pipeline that automates idea to design to implementation to verified tests. Each stage spawns a fresh-context agent with specific inputs/outputs, passing artifacts via filesystem. Manages git worktrees, conventional commits, test verification with retry logic, and failure escalation. TRIGGERS: design-to-deploy, brainstorm and build, implement this idea end-to-end, full pipeline, idea to implementation, design and implement."
---

# Design-to-Deploy Pipeline

Automate the journey from rough idea to verified, tested implementation using context-isolated agent stages.

## Core Principle: Context Isolation

Each pipeline stage runs in a **fresh agent context** (via the Task tool) with:
- Specific input files only (design docs, plans)
- Clear output requirements
- Artifacts passed via filesystem, not accumulated context

## Quick Start

1. Copy `assets/design-to-deploy.yml.example` to `.design-to-deploy.yml` in the project root
2. Customise test frameworks, paths, and validation limits
3. Run the pipeline (see "Running the Pipeline" below)

## Pipeline Overview

```
BRAINSTORM -> VALIDATE SCOPE -> [PLAN UNIT | PLAN E2E | PLAN FEATURE] -> CROSS-CHECK
    -> IMPL TESTS (failing) -> IMPL FEATURE -> VERIFY TESTS -> VERIFY DESIGN -> REVIEW
```

### Stage Details

**Stage 1: Brainstorm** — Transform rough idea into structured design doc
- Prompt: `references/prompts/brainstorm.md`
- Sub-skill: `references/sub-skills/brainstormer.md`
- Output: `{session}/01-design-doc.md` + `docs/designs/YYYY-MM-DD-{topic}-design.md`

**Stage 2: Validate & Split** — Check scope, split if too large
- Prompt: `references/prompts/validate-scope.md`
- Sub-skill: `references/sub-skills/scope-validator.md`
- Output: `{session}/02-scope-validation.md` (may produce split design docs)

**Stages 3-5: Parallel Planning** — Run 3 agents simultaneously via Task tool
- Unit test plan: `references/sub-skills/unit-test-planner.md`
- E2E test plan: `references/sub-skills/e2e-test-planner.md`
- Feature plan: `references/sub-skills/feature-planner.md`

**Stage 6: Cross-Check** — Verify consistency across all 3 plans
- Sub-skill: `references/sub-skills/plan-reviewer.md`
- Output: `{session}/06-cross-check-report.md` + patched plans

**Stage 7: Implementation Sub-Pipeline**
1. Implement unit tests (must fail) — `references/sub-skills/test-implementer.md`
2. Implement e2e tests (must fail) — same sub-skill, TEST_TYPE=e2e
3. Implement feature — `references/sub-skills/feature-implementer.md`
4. Verify unit tests pass — `references/sub-skills/test-verifier.md`
5. Verify e2e tests pass — same sub-skill
6. Verify design compliance — `references/sub-skills/design-compliance-checker.md`

**Stage 8: Final Review** — Human handoff notes
- Sub-skill: `references/sub-skills/review-compiler.md`
- Output: `{session}/10-review-notes.md`

## Running the Pipeline

### Step 1: Initialise

```bash
TOPIC="my-feature"
SESSION_ID=$(date +%Y-%m-%d-%H-%M)-${TOPIC}
SESSION_DIR="session-history/${SESSION_ID}"

git worktree add ../worktrees/${SESSION_ID} -b feature/${TOPIC}
cd ../worktrees/${SESSION_ID}
mkdir -p ${SESSION_DIR}/08-test-results/screenshots
```

### Step 2: Execute Stages

For each stage, spawn a fresh agent using the Task tool:

```
Task(subagent_type="general-purpose", prompt=<contents of prompt template with placeholders filled>)
```

Read the appropriate prompt template from `references/prompts/`, substitute `{{PLACEHOLDERS}}`, and pass to a Task agent. The agent reads the sub-skill reference for detailed instructions.

**Parallel stages (3-5):** Launch all 3 Task agents in a single message block.

### Step 3: Commit After Each Stage

```bash
git add . && git commit -m "design(${TOPIC}): brainstorm complete"
git add . && git commit -m "design(${TOPIC}): scope validated"
git add . && git commit -m "plan(${TOPIC}): all plans generated"
git add . && git commit -m "plan(${TOPIC}): cross-check complete"
git add . && git commit -m "test(${TOPIC}): unit tests implemented (failing)"
git add . && git commit -m "test(${TOPIC}): e2e tests implemented (failing)"
git add . && git commit -m "feat(${TOPIC}): feature implemented"
git add . && git commit -m "test(${TOPIC}): unit tests passing"
git add . && git commit -m "test(${TOPIC}): e2e tests passing"
git add . && git commit -m "verify(${TOPIC}): design compliance confirmed"
```

### Step 4: Finalise

On success:
```bash
cd ../{project-root}
git merge feature/${TOPIC}
git worktree remove ../worktrees/${SESSION_ID}
```

On failure — preserve worktree for human review:
```bash
echo "Worktree preserved at: ../worktrees/${SESSION_ID}"
echo "Resume: cd ../worktrees/${SESSION_ID}"
echo "Abandon: git worktree remove ../worktrees/${SESSION_ID} --force"
```

## Test Verification Retry Logic

When tests fail during verification (stages VERIFY_UNIT_TESTS or VERIFY_E2E_TESTS):

1. **Attempt 1-2**: Fix within the test-verifier agent context
2. **Attempt 3**: Invoke systematic debugging — read `references/sub-skills/systematic-debugger.md`
3. **Attempt 4+**: **STOP PIPELINE** — generate failure report, preserve worktree

The systematic debugger follows a strict 4-phase methodology:
1. Root cause investigation (no fixes without understanding)
2. Pattern analysis (compare to working code)
3. Hypothesis testing (one change at a time)
4. Implementation (fix root cause, not symptoms)

**Red flags that trigger STOP**: "quick fix", multiple changes at once, 3+ failed attempts.

## Scope Validation Heuristics

The scope validator flags for splitting when:
- Estimated files to create: > 10
- Estimated files to modify: > 15
- Estimated implementation time: > 4 hours
- Distinct feature areas: > 3
- External API integrations: > 2
- New database tables: > 3

Design docs must include a Scope Declaration section:
```markdown
## Scope Declaration
- Type: [atomic-feature | multi-feature | epic]
- Estimated Complexity: [small | medium | large]
- Dependencies: [list]
- Can Be Split: [yes | no]
```

## Session History Structure

```
session-history/{SESSION_ID}/
  00-brainstorm-transcript.md
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

## Configuration

Copy `assets/design-to-deploy.yml.example` to `.design-to-deploy.yml` in your project root. Key settings:

- `testing.unit.command` — command to run unit tests (e.g., `npx vitest run`)
- `testing.e2e.command` — command to run e2e tests (e.g., `npx playwright test`)
- `validation.max_files_to_create` — scope limit trigger
- `validation.max_implementation_hours` — time limit trigger

## Orchestrator Script

`scripts/orchestrator.ts` provides programmatic pipeline management:
- Git worktree lifecycle (create, commit, merge, cleanup)
- Pipeline state persistence (`pipeline-state.json`)
- Test retry logic with escalation
- Resume from failed state (`--resume` flag)
- Failure report generation

Usage: `ts-node scripts/orchestrator.ts --idea "description" [--config path] [--resume]`

Type definitions: `scripts/types.ts`

## Sub-Skill Reference

| Sub-Skill | Input | Output |
|-----------|-------|--------|
| `brainstormer` | User idea + project context | design-doc.md |
| `scope-validator` | design-doc.md | validated/split docs |
| `unit-test-planner` | design-doc.md | unit-test-plan.md |
| `e2e-test-planner` | design-doc.md | e2e-test-plan.md |
| `feature-planner` | design-doc.md | feature-plan.md |
| `plan-reviewer` | All 3 plans + design doc | Patched plans |
| `test-implementer` | test-plan.md | Test files (failing) |
| `feature-implementer` | feature-plan.md | Feature code |
| `test-verifier` | Test files + code | Pass/fail + fixes |
| `systematic-debugger` | Failing tests + errors | debugging-report.md |
| `design-compliance-checker` | Design doc + all code | compliance-report.md |
| `review-compiler` | All artifacts | review-notes.md |

All sub-skill docs: `references/sub-skills/`
All prompt templates: `references/prompts/`
