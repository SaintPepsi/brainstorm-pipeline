---
name: task
description: "Create and manage terminal checkbox tasks to track progress on any work. Breaks down goals into actionable items, renders live checkboxes in the terminal, and persists tasks to a markdown file for cross-session tracking. TRIGGERS: task, create tasks, track progress, break this down, make a checklist, todo list, task list."
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - TodoWrite
argument-hint: "[goal or file path]"
---

# Task — Terminal Checkbox Task Tracker

Create actionable task lists with live terminal checkboxes and optional file persistence.

## When to Use

- Breaking down a feature, bug fix, or refactor into steps before starting work
- Creating a checklist from a design doc, issue, or PR description
- Tracking multi-file changes across a codebase
- Giving yourself (or the user) visibility into what's done and what's left

## How It Works

This skill uses Claude Code's built-in `TodoWrite` tool to render interactive checkbox tasks directly in the terminal. Each task shows its status — pending, in progress, or completed — as work proceeds.

Optionally, tasks are also persisted to a markdown file so they survive across sessions.

## How to Run

### From a goal description

```
/task Refactor the auth module to use JWT tokens
```

### From a file (design doc, issue evaluation, etc.)

```
/task session-history/2025-01-15/01-design-doc.md
```

### No argument (analyse current context)

```
/task
```

When invoked without arguments, analyse the current conversation context and recent git changes to infer what the user is working on, then propose a task breakdown.

## Task Creation Process

### Step 1 — Understand the Goal

Determine the source of work:

1. **Argument is a file path** — Read the file. Extract actionable items from headings, acceptance criteria, bullet points, or TODO markers.
2. **Argument is a description** — Parse the goal. If needed, explore the codebase (`Glob`, `Grep`, `Read`) to understand what files and components are involved.
3. **No argument** — Look at the conversation history and recent `git diff`/`git status` to infer the current task.

### Step 2 — Break Down into Tasks

Create a flat list of **specific, actionable tasks**. Follow these rules:

- **3-15 tasks** — Fewer than 3 means the goal is trivial (just do it). More than 15 means you should group related items.
- **Each task = one action** — "Update the config and write tests" is two tasks, not one.
- **Ordered by dependency** — Tasks that must happen first come first.
- **Include verification** — If the work involves code, add a final task for running tests or verifying the change.

Good tasks:
- `Add JWT token generation to auth/tokens.ts`
- `Update login endpoint to return access + refresh tokens`
- `Write unit tests for token refresh flow`
- `Run test suite and fix failures`

Bad tasks:
- `Work on auth` (too vague)
- `Update auth module to use JWT tokens, add tests, update docs, and deploy` (too many actions)
- `Think about the approach` (not actionable)

### Step 3 — Render in Terminal

Use the `TodoWrite` tool to create the task list. Every task needs both forms:

```
content: "Add JWT token generation to auth/tokens.ts"    (imperative — what to do)
activeForm: "Adding JWT token generation to auth/tokens.ts"  (present continuous — shown while in progress)
status: "pending"
```

Set the first task to `in_progress` immediately — the user invoked this skill to start working, not to stare at a list.

### Step 4 — Persist to File (Optional)

If the work spans multiple sessions or involves more than 5 tasks, also write a markdown task file:

**Location:** `tasks/YYYY-MM-DD-<topic>.md` (create the `tasks/` directory if it doesn't exist)

**Format:**

```markdown
# Task: <Goal Summary>

Created: YYYY-MM-DD HH:MM
Source: <file path, description, or "conversation context">

## Tasks

- [ ] Task 1 description
- [ ] Task 2 description
- [ ] Task 3 description
- [ ] Task 4 description
- [ ] Task 5 description

## Notes

<Any context, constraints, or decisions captured during breakdown>
```

**Keeping the file in sync:** When marking a task complete via `TodoWrite`, also update the corresponding line in the markdown file from `- [ ]` to `- [x]`. This keeps the file usable as a standalone checklist.

## Updating Tasks

As work progresses, keep the terminal checkboxes current:

1. **Starting a task** — Set it to `in_progress` (only one at a time)
2. **Finishing a task** — Set it to `completed`, move the next task to `in_progress`
3. **Discovering new work** — Add new tasks to the list. Insert them in dependency order, not just at the end.
4. **Task becomes irrelevant** — Remove it from the list entirely

If a persistence file exists, mirror all updates there.

## Integration with Other Skills

When used alongside `/design-to-deploy` or `/github-issue-to-deploy`, this skill can create a task list from the pipeline's session history artifacts:

```
/task session-history/2025-01-15/01-design-doc.md
```

This gives the user a quick overview of implementation steps derived from the design doc, separate from the pipeline's internal stage tracking.

## Examples

### Breaking down a feature

```
User: /task Add dark mode support to the dashboard

Tasks created:
  [x] Explore current theme/styling setup in the dashboard
  [ ] Create dark mode colour palette in theme config
  [ ] Add theme toggle component to dashboard header
  [ ] Wire toggle to theme context/state management
  [ ] Update dashboard components to use theme-aware styles
  [ ] Run tests and verify no visual regressions
```

### From a design doc

```
User: /task docs/designs/2025-01-15-webhook-retry-design.md

Tasks created:
  [x] Add retry configuration schema to webhook settings
  [ ] Implement exponential backoff retry logic in webhook dispatcher
  [ ] Add dead-letter queue for permanently failed webhooks
  [ ] Write unit tests for retry logic and backoff calculation
  [ ] Write integration test for end-to-end retry flow
  [ ] Update webhook dashboard to show retry status
  [ ] Run full test suite
```

### No argument (infer from context)

```
User: /task

(Claude analyses recent git diff showing half-finished migration)

Tasks created:
  [x] Complete the user table migration (3 columns remaining)
  [ ] Update User model to match new schema
  [ ] Fix broken queries in user repository
  [ ] Run migration on test database
  [ ] Run test suite and fix failures
```
