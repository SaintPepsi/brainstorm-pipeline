---
name: github-issue-to-deploy
description: "Fully autonomous pipeline: takes a GitHub issue, evaluates requirements, writes a design doc, and runs the full design-to-deploy build — no user interaction required. TRIGGERS: github-issue-to-deploy, implement issue, build from issue, issue to implementation, github issue pipeline."
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Task
  - Glob
  - Grep
  - WebFetch
argument-hint: "<owner/repo#number | issue-url>"
---

# GitHub Issue to Deploy Pipeline

Fully autonomous pipeline from GitHub issue to verified implementation. No interactive brainstorm — the issue IS the brainstorm. This skill fetches the issue, evaluates requirements, writes a design doc, and orchestrates the full design-to-deploy build pipeline without user interaction.

## Why This Exists

`/design-to-deploy` requires an interactive brainstorm phase where the user answers probing questions. That's valuable when starting from a vague idea, but when work comes from a well-defined GitHub issue — with a body, acceptance criteria, contributor comments, and labels — the brainstorm is redundant. The issue discussion already captured the decisions.

This skill replaces the interactive brainstorm with an autonomous design-doc-writer that synthesises the issue context into a design doc, then feeds it directly into Phase 2's autonomous build pipeline. You invoke it and walk away.

## Pipeline Overview

```
PHASE 0 — EVALUATE (this skill, main context)
  ├── Fetch issue metadata, body, comments, labels
  ├── Fetch linked/referenced issues for context
  └── Spawn issue-evaluator agent → 00-issue-evaluation.md

PHASE 1 — DESIGN (this skill, Task agent — replaces interactive brainstorm)
  └── Spawn design-doc-writer agent → 01-design-doc.md

PHASE 2 — BUILD (design-to-deploy sub-agents, orchestrated by this skill)
  ├── VALIDATE SCOPE → [PLAN UNIT | PLAN E2E | PLAN FEATURE] → CROSS-CHECK
  └── IMPL TESTS (failing) → IMPL FEATURE → VERIFY TESTS → VERIFY DESIGN → REVIEW
```

Everything after Phase 0 runs autonomously as Task agents. You don't interact.

## How to Run

Pass a GitHub issue reference — either a full URL or `owner/repo#number`:

```
/github-issue-to-deploy owner/repo#42
/github-issue-to-deploy https://github.com/owner/repo/issues/42
```

If you're inside the target repo, just the issue number works:

```
/github-issue-to-deploy #42
```

### What Happens

1. **Fetch** — Pull issue title, body, labels, comments, and linked issues via `gh` CLI
2. **Evaluate** — Classify the issue and extract structured requirements (haiku agent)
3. **Design** — Write a complete design doc from the evaluation + codebase exploration (sonnet agent)
4. **Build** — Run the full design-to-deploy Phase 2 pipeline autonomously (multiple agents)
5. **Link back** — All commits include `refs #N`, and the final PR uses `closes #N`

## Phase 0 — Evaluate

This phase runs in your main context. It's the only part that isn't delegated to sub-agents.

### Step 1: Parse Issue Reference

Parse the argument to extract `owner`, `repo`, and `issue number`. Handle these formats:
- `owner/repo#42`
- `https://github.com/owner/repo/issues/42`
- `#42` (infer owner/repo from the current git remote)

### Step 2: Fetch Issue Context

```bash
# Core issue data
gh issue view <number> --repo <owner/repo> --json title,body,labels,comments,assignees,milestone,projectItems

# Referenced issues (parse body/comments for #N references)
gh issue view <referenced-number> --repo <owner/repo> --json title,body,state
```

**Extract:**
- Issue title and full body
- All comments (contributors may have refined requirements in discussion)
- Labels (help classify: bug, enhancement, feature, etc.)
- Linked/referenced issues (for dependency context)
- Milestone (for priority/timeline context)

### Step 3: Set Up Worktree

```bash
TOPIC="<kebab-case-from-issue-title>"
ISSUE_NUM=<number>
SESSION_ID=$(date +%Y-%m-%d-%H-%M)-${TOPIC}

git worktree add .worktrees/${SESSION_ID} -b feature/${TOPIC}
cd .worktrees/${SESSION_ID}
mkdir -p session-history/${SESSION_ID}/08-test-results/screenshots
```

### Step 4: Evaluate and Classify

Spawn a Task agent (model: `haiku`) to read `references/sub-skills/issue-evaluator.md` and classify the issue.

**Agent prompt pattern:**
```
Read references/sub-skills/issue-evaluator.md, then evaluate the following GitHub issue data:
<issue data here>
Write output to session-history/${SESSION_ID}/00-issue-evaluation.md
```

- Output: `session-history/${SESSION_ID}/00-issue-evaluation.md`
- **Run `/compact` after this step** — the raw issue data is now captured in the evaluation.

## Phase 1 — Design (Autonomous)

**This replaces the interactive brainstorm.** Instead of asking the user questions, the design-doc-writer explores the codebase and synthesises a design doc from the issue evaluation.

**Model selection:** Read the issue evaluation's autonomy assessment and scope estimate:
- **Default (`sonnet`)**: Scope is `small` or `medium`, autonomy is `yes` or `yes-with-assumptions` with `low`/`medium` risk
- **Escalate (`opus`)**: Scope is `large`, OR autonomy is `yes-with-assumptions` with `high` assumption risk

Spawn a Task agent with the selected model to read `references/sub-skills/design-doc-writer.md` and produce the design doc.

**Agent prompt pattern:**
```
Read references/sub-skills/design-doc-writer.md, then write a design doc based on
the issue evaluation at session-history/${SESSION_ID}/00-issue-evaluation.md.
The topic is "${TOPIC}" and the session ID is "${SESSION_ID}".
Write output to session-history/${SESSION_ID}/01-design-doc.md
and docs/designs/YYYY-MM-DD-${TOPIC}-design.md.
```

- Output: `session-history/${SESSION_ID}/01-design-doc.md`
- Commit: `design(${TOPIC}): design doc from issue #${ISSUE_NUM}`
- **Run `/compact` after this step**

## Phase 2 — Build (Autonomous)

Run the design-to-deploy Phase 2 stages exactly as documented in the design-to-deploy SKILL.md. All sub-skill docs come from `../design-to-deploy/references/sub-skills/`. The only difference: commit messages include `refs #${ISSUE_NUM}` in the body.

**Stage 2 — Validate Scope:** Task agent (model: `haiku`) → `scope-validator.md` + design doc

- Output: `session-history/${SESSION_ID}/02-scope-validation.md`
- Commit: `design(${TOPIC}): scope validated  refs #${ISSUE_NUM}`

**Stages 3-5 — Plan (parallel):** Launch 3 Task agents in a single message (model: `sonnet`):

- Agent 1 → `unit-test-planner.md` + design doc → `03-unit-test-plan.md`
- Agent 2 → `e2e-test-planner.md` + design doc → `04-e2e-test-plan.md`
- Agent 3 → `feature-planner.md` + design doc → `05-feature-plan.md`
- Commit: `plan(${TOPIC}): all plans generated  refs #${ISSUE_NUM}`
- **Run `/compact` after collecting results**

**Stage 6 — Cross-Check:** Task agent (model: `sonnet`) → `plan-reviewer.md` + all 3 plans + design doc

- Output: `session-history/${SESSION_ID}/06-cross-check-report.md`
- Commit: `plan(${TOPIC}): cross-check complete  refs #${ISSUE_NUM}`

**Stage 7a — Implement Unit Tests:** Task agent (model: `sonnet`) → `test-implementer.md` + unit test plan. Tests **must fail**.

- Commit: `test(${TOPIC}): unit tests implemented (failing)  refs #${ISSUE_NUM}`

**Stage 7b — Implement E2E Tests:** Task agent (model: `sonnet`) → same sub-skill + e2e test plan. Tests **must fail**.

- Commit: `test(${TOPIC}): e2e tests implemented (failing)  refs #${ISSUE_NUM}`

**Stage 7c — Implement Feature:** Task agent (model: `sonnet`, or `opus` for complex logic) → `feature-implementer.md` + feature plan + design doc + test files.

- Commit: `feat(${TOPIC}): feature implemented  refs #${ISSUE_NUM}`
- **Run `/compact` after implementation**

**Stage 7d — Verify Unit Tests:** Task agent (model: `sonnet`) → `test-verifier.md`. Apply retry logic on failure.

- Commit: `test(${TOPIC}): unit tests passing  refs #${ISSUE_NUM}`

**Stage 7e — Verify E2E Tests:** Task agent (model: `sonnet`) → same sub-skill. Apply retry logic.

- Commit: `test(${TOPIC}): e2e tests passing  refs #${ISSUE_NUM}`

**Stage 7f — Verify Design Compliance:** Task agent (model: `sonnet`) → `design-compliance-checker.md` + design doc + all implementations.

- Output: `session-history/${SESSION_ID}/09-design-compliance.md`
- Commit: `verify(${TOPIC}): design compliance confirmed  refs #${ISSUE_NUM}`

**Stage 8 — Final Review:** Task agent (model: `haiku`) → `review-compiler.md` + all artifacts.

- Output: `session-history/${SESSION_ID}/10-review-notes.md`

## Finalise

### On Success

Merge, clean up, and create a PR that closes the issue:

```bash
cd ../../  # back to project root
git merge feature/${TOPIC}
git worktree remove .worktrees/${SESSION_ID}
```

Create a PR with `closes #${ISSUE_NUM}` in the body so the issue auto-closes on merge.

### On Failure

Preserve for human review:

```
Pipeline failed at stage: {STAGE}
Worktree preserved at: .worktrees/${SESSION_ID}
Source issue: #${ISSUE_NUM}
To resume: cd .worktrees/${SESSION_ID}
To abandon: git worktree remove .worktrees/${SESSION_ID} --force
```

## Test Verification Retry Logic

Same as design-to-deploy:

1. **Attempt 1-2**: Fix within the test-verifier agent context (model: `sonnet`)
2. **Attempt 3**: Escalate to systematic-debugger (model: `opus`) from `../design-to-deploy/references/sub-skills/systematic-debugger.md`
3. **Attempt 4+**: **STOP PIPELINE** — write failure report, preserve worktree, report to user

## Session History

```
session-history/${SESSION_ID}/
  00-issue-evaluation.md      ← Phase 0 (this skill)
  01-design-doc.md            ← Phase 1 (this skill, autonomous)
  02-scope-validation.md      ← Phase 2
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

## Cost Management

| Stage | Model | Why |
|-------|-------|-----|
| Issue fetch | N/A | `gh` CLI calls, no LLM cost |
| Issue evaluation | `haiku` | Classification — structured, low complexity |
| Design doc writer | `sonnet` (or `opus` for large/risky scope) | Codebase exploration + doc synthesis |
| Scope validation | `haiku` | Checklist-based |
| Test/feature planning | `sonnet` | Structured output from design doc |
| Cross-check | `sonnet` | Comparison and gap analysis |
| Test implementation | `sonnet` | Translating plans to code |
| Feature implementation | `sonnet` (or `opus`) | Code generation from clear plan |
| Test verification | `sonnet` | Running tests, reading output |
| Systematic debugger | `opus` | Complex reasoning about failures |
| Design compliance | `sonnet` | Checklist verification |
| Final review | `haiku` | Summarisation |

### Compaction Checkpoints

Run `/compact` at these points:

1. **After Phase 0** — raw issue data is captured in the evaluation
2. **After Phase 1** — design doc captures everything, evaluation no longer needed in context
3. **After parallel planning** — plans are on disk
4. **After feature implementation** — code is committed

## Sub-Skill Reference

| Sub-Skill | Source | Runs In | Input | Output |
|-----------|--------|---------|-------|--------|
| `issue-evaluator` | This skill | Task agent (haiku) | Issue JSON data | issue-evaluation.md |
| `design-doc-writer` | This skill | Task agent (sonnet/opus) | issue-evaluation.md + codebase | design-doc.md |
| `scope-validator` | design-to-deploy | Task agent (haiku) | design-doc.md | scope-validation.md |
| `unit-test-planner` | design-to-deploy | Task agent (sonnet) | design-doc.md | unit-test-plan.md |
| `e2e-test-planner` | design-to-deploy | Task agent (sonnet) | design-doc.md | e2e-test-plan.md |
| `feature-planner` | design-to-deploy | Task agent (sonnet) | design-doc.md | feature-plan.md |
| `plan-reviewer` | design-to-deploy | Task agent (sonnet) | all plans + design | cross-check-report.md |
| `test-implementer` | design-to-deploy | Task agent (sonnet) | test-plan.md | test files (failing) |
| `feature-implementer` | design-to-deploy | Task agent (sonnet/opus) | feature-plan.md | feature code |
| `test-verifier` | design-to-deploy | Task agent (sonnet) | test files + code | pass/fail + fixes |
| `systematic-debugger` | design-to-deploy | Task agent (opus) | failing tests | debugging-report.md |
| `design-compliance-checker` | design-to-deploy | Task agent (sonnet) | design + code | compliance-report.md |
| `review-compiler` | design-to-deploy | Task agent (haiku) | all artifacts | review-notes.md |

## Error Handling

- **Issue not found**: Stop and tell the user. Don't guess.
- **No `gh` CLI**: Fall back to GitHub API via `curl` with `GITHUB_TOKEN` if available. If neither works, ask the user to provide the issue content manually.
- **Empty issue body**: Warn the user that the issue lacks detail. The design-doc-writer will work with what's available but flag that the design doc is based on limited input.
- **Private repo without auth**: Stop and tell the user to authenticate with `gh auth login`.
- **Issue too vague**: If the evaluator flags too many open questions (more than 5 with no answers in comments), warn the user that the autonomous design may make incorrect assumptions. Suggest using `/design-to-deploy` instead for interactive refinement.
