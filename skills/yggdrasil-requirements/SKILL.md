---
name: yggdrasil-requirements
description: "Interactive requirements-gathering skill for implementing Yggdrasil — autonomous development through isolated, self-bootstrapping git worktrees. Analyses a target project's stack, infrastructure, and workflows, then interviews the user to produce a complete Yggdrasil requirements document. TRIGGERS: yggdrasil requirements, worktree setup requirements, autonomous environment setup, yggdrasil, gather worktree requirements."
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Task
  - Glob
  - Grep
---

# Yggdrasil Requirements Gathering

Gather everything needed to implement Yggdrasil — autonomous development through isolated, self-bootstrapping git worktrees — in a target project.

## What is Yggdrasil?

Yggdrasil is the infrastructure layer that enables AI agents to independently pick up tasks, create isolated development environments, and ship verified code — without human intervention between steps. Named after the Norse world tree whose branches hold separate realms, it uses git worktrees as isolated branches of work. Each worktree is a self-contained development environment: its own Docker containers, database, ports, and dependencies — created from a single command and torn down without a trace.

## What This Skill Produces

A **Yggdrasil Requirements Document** — a comprehensive analysis of the target project that captures every detail needed to build:

1. **`setup-worktree.sh`** — One-command bootstrap: branch → deps → containers → migrations → ready
2. **`teardown-worktree.sh`** — Clean removal with uncommitted changes protection
3. **Port allocation system** — Automatic, gap-filling, conflict-free port assignment
4. **Isolation model** — Per-worktree `COMPOSE_PROJECT_NAME`, volumes, networks, and env vars
5. **Trap-based cleanup** — If any bootstrap step fails, everything is rolled back
6. **Pipeline integration** — How the worktree infrastructure connects with design-to-deploy

## Two Phases

### Phase 1 — Autonomous Codebase Analysis (Task agent)

A sub-agent explores the target project to discover its technology stack, infrastructure, build processes, and existing automation. This runs autonomously — no user interaction needed.

### Phase 2 — Interactive Requirements Interview (main context)

You interview the user to fill gaps, validate findings, and capture decisions about isolation, resource allocation, and workflow integration. This is a conversation — the user makes decisions.

## How to Run

```
/yggdrasil-requirements
/yggdrasil-requirements /path/to/target/project
```

If no path is provided, use the current working directory as the target project.

## Pipeline Overview

```
Phase 1 (autonomous, Task agent):
  ANALYSE CODEBASE → codebase-analysis.md

Phase 2 (interactive, main context):
  INTERVIEW USER → validate findings, fill gaps, capture decisions
    → PRODUCE REQUIREMENTS DOC → yggdrasil-requirements.md
```

## Create Pipeline Tasks

After determining the target project, create tasks for each stage:

- Create a task for "Analyse target project codebase"
- Create a task for "Interview user for requirements"
- Create a task for "Produce Yggdrasil requirements document"

Mark each task in-progress when starting and complete when finished.

## Phase 1 — Analyse Codebase

Mark the "Analyse target project codebase" task as in-progress.

Spawn a Task agent to read `references/sub-skills/codebase-analyzer.md` and explore the target project.

**Agent prompt pattern:**
```
Read references/sub-skills/codebase-analyzer.md, then analyse the project at <TARGET_PATH>.
Write output to <OUTPUT_DIR>/00-codebase-analysis.md
```

The agent produces `00-codebase-analysis.md` covering:
- Technology stack (languages, frameworks, package managers)
- Docker/container setup (existing compose files, services, databases)
- Build and dependency commands
- Test infrastructure (frameworks, commands, config locations)
- Port usage patterns
- Environment variables and secrets
- Existing automation (CI/CD, scripts, Makefiles)
- Bootstrap steps a developer currently follows
- Git workflow conventions

Mark the "Analyse target project codebase" task as complete.

**Run `/compact` after Phase 1** — the codebase analysis captures everything.

## Phase 2 — Interactive Requirements Interview

Mark the "Interview user for requirements" task as in-progress.

Read the codebase analysis at `00-codebase-analysis.md`. Then conduct a structured interview with the user, organised into these areas:

### Area 1: Validate Stack Discovery

Present the discovered technology stack and ask the user to confirm or correct:
- "The analysis found [X]. Is this accurate?"
- "Are there any services or dependencies the analysis might have missed?"
- "Are there any planned stack changes coming soon that we should account for?"

### Area 2: Docker & Container Isolation

Understand how containers should be isolated per worktree:

- **Existing Docker setup**: Are there `docker-compose.yml` files? What services do they define?
- **Database provisioning**: How should each worktree get its own database? (separate container, shared server with unique DB name, SQLite per-worktree, etc.)
- **Service dependencies**: Which external services (Redis, Elasticsearch, S3, mail, queue workers) need per-worktree instances vs. shared instances?
- **Volume strategy**: Which volumes need per-worktree isolation? Which can be shared (e.g., package caches)?
- **Network isolation**: Do worktrees need isolated Docker networks, or is port-based isolation sufficient?

### Area 3: Port Allocation

- **Current port usage**: What ports does the application stack use? (web server, database, Redis, frontend dev server, etc.)
- **Port ranges**: What range should be reserved for worktree port allocation? (e.g., 10000-19999)
- **Port mapping strategy**: How should ports be assigned? (base offset per worktree, sequential gap-filling, etc.)
- **Fixed ports**: Are there any ports that must remain fixed across all worktrees?

### Area 4: Bootstrap Process

Walk through what a complete environment setup requires:

- **Dependency installation**: What package managers and commands? (`composer install`, `npm install`, `pip install`, etc.)
- **Database migrations**: What commands run migrations? Are there seeders?
- **Asset compilation**: Does the frontend need building? Hot-reload in dev?
- **Environment files**: What `.env` files need generating per worktree? What values change per worktree vs. stay constant?
- **Pre-requisites**: What must exist before bootstrap? (Docker running, specific CLI tools installed, auth tokens, etc.)
- **Order of operations**: What's the dependency chain? (e.g., Docker up → wait for DB → migrate → seed → build frontend)
- **Health checks**: How do you verify the environment is working? (curl endpoint, run a smoke test, check DB connection, etc.)

### Area 5: Teardown Process

- **What needs cleanup?** Docker containers, volumes, networks, database, generated files, node_modules, vendor dirs?
- **Protection**: Should teardown refuse if there are uncommitted changes? Require `--force` to override?
- **Port release**: How should allocated ports be freed?
- **Shared resources**: Anything that should survive teardown? (package caches, Docker images, base volumes)

### Area 6: Failure Handling

- **Partial bootstrap**: If step 3 of 7 fails, what gets cleaned up? Everything? Just what was created?
- **Trap behaviour**: Should failures in non-critical steps (e.g., seeder fails) halt the entire setup or warn and continue?
- **Recovery**: Can a failed bootstrap be re-run, or does it need a teardown first?
- **Logging**: Where should bootstrap/teardown logs go?

### Area 7: Parallel Execution

- **Concurrency**: How many worktrees should be able to run simultaneously?
- **Resource limits**: Are there memory/CPU constraints per worktree?
- **Shared services**: Are there services (like a shared Docker registry cache or package mirror) that should be set up once and shared?
- **Conflicts**: Beyond ports, what else could conflict between parallel worktrees? (temp files, lock files, shared state)

### Area 8: Pipeline Integration

- **Design-to-deploy**: Will this be used with the design-to-deploy pipeline? If so:
  - How should session history directories relate to worktrees?
  - Should the pipeline auto-create and auto-teardown worktrees?
  - What commit conventions should worktree branches follow?
- **CI/CD**: Should worktree setup be usable in CI? What changes for CI vs. local?
- **Orchestration**: When multiple agents pick up tasks simultaneously, how should worktree names avoid collision? (timestamp + topic, random suffix, agent ID, etc.)

### Area 9: Platform & Environment

- **Target OS**: Linux only, or macOS support too? WSL?
- **Shell**: Bash? Zsh compatibility needed?
- **Docker version**: Any minimum Docker/Docker Compose version requirements?
- **Git version**: Any minimum git version for worktree features?

### Interview Guidelines

- **Batch questions**: Group 3-5 related questions per message. Don't ask one question at a time.
- **Show your work**: Present what the codebase analysis found before asking for confirmation.
- **Offer defaults**: When a question has an obvious answer from the analysis, suggest it. "Based on the analysis, [X] seems right — should we go with that?"
- **Track decisions**: Keep a running list of confirmed decisions. Summarise periodically.
- **Don't over-ask**: If the codebase analysis clearly answers a question, state it as a finding and ask only for confirmation.

Mark the "Interview user for requirements" task as complete when the user has confirmed all areas are covered.

## Produce Requirements Document

Mark the "Produce Yggdrasil requirements document" task as in-progress.

Read `references/sub-skills/requirements-template.md` for the output format. Compile all findings and decisions into the Yggdrasil requirements document.

Write the document to:
- `docs/yggdrasil-requirements.md` (in the target project, if writable)
- Print a summary to the user

The requirements document is the handoff artifact. It must be detailed enough that someone (human or agent) can build `setup-worktree.sh`, `teardown-worktree.sh`, and the port allocation system from it without asking any further questions.

Mark the "Produce Yggdrasil requirements document" task as complete.

## Cost Management

| Stage | Model | Why |
|-------|-------|-----|
| Codebase analysis | Inherited from caller | Systematic exploration, structured output |
| User interview | User's current model | Interactive, benefits from strong reasoning |
| Requirements doc | User's current model | Synthesis of all findings — runs in main context |

### Compaction Checkpoints

1. **After Phase 1** — codebase analysis is on disk, raw exploration no longer needed in context
2. **After each interview area** — if context grows large, compact between areas (the running decision list preserves state)

## Sub-Skill Reference

| Sub-Skill | Runs In | Input | Output |
|-----------|---------|-------|--------|
| `codebase-analyzer` | Task agent | Target project path | codebase-analysis.md |

## Output Artifact

```
docs/
  yggdrasil-requirements.md     ← The complete requirements document
```

### Requirements Document Sections

1. **Project Overview** — Stack summary, architecture, existing infrastructure
2. **Worktree Isolation Model** — How each worktree achieves full isolation
3. **Port Allocation Scheme** — Range, strategy, conflict avoidance
4. **Bootstrap Sequence** — Ordered steps from `git worktree add` to health check
5. **Teardown Sequence** — Ordered steps from safety check to removal
6. **Failure Handling** — Trap behaviour, partial cleanup, recovery
7. **Environment Configuration** — Per-worktree env vars, templates, secrets handling
8. **Docker Compose Template** — Per-worktree compose override structure
9. **Parallel Execution Constraints** — Concurrency limits, shared resources
10. **Pipeline Integration** — How worktrees connect with design-to-deploy
11. **Platform Requirements** — OS, shell, Docker, git version constraints
12. **Implementation Checklist** — Ordered list of scripts and systems to build
