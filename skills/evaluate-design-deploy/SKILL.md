---
name: evaluate-design-deploy
description: "GitHub issue intake pipeline that evaluates an issue, structures requirements, and feeds them into design-to-deploy for autonomous implementation. Bridges GitHub issues to the full brainstorm-to-verified-code workflow. TRIGGERS: evaluate-design-deploy, implement issue, build from issue, issue to implementation, github issue pipeline."
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

# Evaluate-Design-Deploy Pipeline

Bridge GitHub issues into the design-to-deploy pipeline. Takes an issue reference, evaluates the requirements, structures them for the brainstormer, and hands off to the full autonomous build pipeline.

## Why This Exists

The `/design-to-deploy` skill takes a free-text idea and runs a 12-stage pipeline. But when work comes from GitHub issues, there's context that shouldn't be lost — the issue body, discussion comments, labels, linked issues, and acceptance criteria that contributors have already defined. This skill captures that context and feeds it into design-to-deploy so the brainstorm phase starts informed rather than from scratch.

## Pipeline Overview

```
EVALUATE (this skill)
  ├── Fetch issue metadata, body, comments, labels
  ├── Fetch linked/referenced issues for context
  ├── Classify issue type and extract structured requirements
  ├── Generate pre-seeded brainstorm brief
  └── Hand off to /design-to-deploy with enriched context

DESIGN-TO-DEPLOY (existing pipeline)
  ├── Phase 1: Interactive brainstorm (pre-seeded with issue context)
  └── Phase 2: Autonomous build (12 sub-agents)
```

## How to Run

### Basic Usage

Pass a GitHub issue reference — either a full URL or `owner/repo#number`:

```
/evaluate-design-deploy owner/repo#42
/evaluate-design-deploy https://github.com/owner/repo/issues/42
```

If you're inside the target repo, just the issue number works:

```
/evaluate-design-deploy #42
```

### What Happens

1. **Fetch** — Pull issue title, body, labels, comments, and linked issues via `gh` CLI
2. **Evaluate** — Classify the issue and extract structured requirements using the issue-evaluator sub-skill
3. **Brief** — Generate a brainstorm brief that pre-seeds Phase 1 of design-to-deploy
4. **Hand off** — Launch `/design-to-deploy` with the enriched brief as input
5. **Link back** — All commits include `refs #N`, and the final PR uses `closes #N`

## Phase 0 — Evaluate (this skill)

This phase runs in your main context before handing off to design-to-deploy.

### Step 1: Fetch Issue Context

Use `gh` CLI to pull all relevant context. The goal is to capture everything contributors have already discussed so the brainstorm doesn't re-ask answered questions.

```bash
# Core issue data
gh issue view <number> --json title,body,labels,comments,assignees,milestone,projectItems

# Referenced issues (if any are mentioned in the body/comments)
# Parse issue body for #N references and fetch those too
gh issue view <referenced-number> --json title,body,state
```

**Extract:**
- Issue title and full body (may contain specs, mockups, acceptance criteria)
- All comments (contributors may have refined requirements in discussion)
- Labels (help classify: bug, enhancement, feature, etc.)
- Linked/referenced issues (for dependency context)
- Milestone (for priority/timeline context)

### Step 2: Evaluate and Classify

Spawn a Task agent (model: `haiku`) to read `references/sub-skills/issue-evaluator.md` and classify the issue.

The evaluator produces a structured brief at `session-history/${SESSION_ID}/00-issue-evaluation.md` containing:
- **Issue Type**: `bug-fix`, `enhancement`, `new-feature`, `refactor`, `documentation`
- **Requirements extracted** from issue body and comments
- **Acceptance criteria** (pulled from issue or inferred)
- **Constraints and context** from discussion
- **Related issues** summary
- **Suggested scope** estimate

### Step 3: Generate Brainstorm Brief

Using the evaluation output, construct a pre-seeded brief for the design-to-deploy brainstormer. This brief gives Phase 1 a head start — the user still interacts and refines, but the brainstorm begins with structured requirements instead of a blank slate.

Write the brief to `session-history/${SESSION_ID}/00-brainstorm-brief.md`.

### Step 4: Hand Off to Design-to-Deploy

Launch the design-to-deploy pipeline with the enriched brief. The brainstormer reads the brief as additional context alongside the user's input.

**Pass to design-to-deploy:**
- The brainstorm brief path
- The issue number (for commit message linking)
- The issue type classification

### Step 5: Git Linking

Throughout the pipeline, ensure GitHub issue linking:

- **Worktree branch**: `feature/<topic>` (same as design-to-deploy)
- **Commit messages**: Include `refs #<issue-number>` in commit bodies
- **Final PR**: Use `closes #<issue-number>` in the PR body so the issue auto-closes on merge

## Session History

This skill adds a `00-` prefix layer to the existing session history:

```
session-history/${SESSION_ID}/
  00-issue-evaluation.md      ← NEW (this skill)
  00-brainstorm-brief.md      ← NEW (this skill)
  01-design-doc.md            ← design-to-deploy
  02-scope-validation.md      ← design-to-deploy
  ... (rest of pipeline)
```

## Cost Management

The evaluate phase adds minimal cost:

| Stage | Model | Why |
|-------|-------|-----|
| Issue fetch | N/A | `gh` CLI calls, no LLM cost |
| Issue evaluation | `haiku` | Classification and extraction — structured, low complexity |
| Brief generation | Main context | Small synthesis task in your existing context |

Total added cost: ~$0.01-0.05 depending on issue length. The existing design-to-deploy cost guidelines still apply for the rest of the pipeline.

## Sub-Skill Reference

| Sub-Skill | Runs In | Input | Output |
|-----------|---------|-------|--------|
| `issue-evaluator` | Task agent (haiku) | Issue JSON data | issue-evaluation.md |

All other sub-skills come from `design-to-deploy/references/sub-skills/`.

## Error Handling

- **Issue not found**: Stop and tell the user. Don't guess.
- **No `gh` CLI**: Fall back to GitHub API via `curl` with `GITHUB_TOKEN` if available. If neither works, ask the user to provide the issue content manually.
- **Empty issue body**: Warn the user that the issue lacks detail. Proceed with title-only context but flag that the brainstorm will need more user input than usual.
- **Private repo without auth**: Stop and tell the user to authenticate with `gh auth login`.
