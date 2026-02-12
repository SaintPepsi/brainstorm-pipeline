# Requirements Template — Output Format Reference

## Purpose

This document defines the format for the Yggdrasil Requirements Document — the final output of the `/yggdrasil-requirements` skill. The requirements doc must be detailed enough that someone (human or agent) can build `setup-worktree.sh`, `teardown-worktree.sh`, and the port allocation system without asking further questions.

## Template

```markdown
# Yggdrasil Requirements: <project-name>

**Generated:** <YYYY-MM-DD>
**Project:** <project-name>
**Stack:** <primary language/framework>
**Repository:** <git remote URL>

---

## 1. Project Overview

### Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | <e.g., PHP 8.3> | <version> |
| Framework | <e.g., Laravel 11> | <version> |
| Frontend | <e.g., SvelteKit> | <version> |
| Database | <e.g., PostgreSQL 16> | <version> |
| Cache | <e.g., Redis 7> | <version> |
| Search | <e.g., Meilisearch> | <version> |

### Architecture

<Brief description of the application architecture — monolith, microservices, monorepo, etc.
How frontend and backend relate. Key service boundaries.>

### Existing Infrastructure

<Summary of current Docker setup, CI/CD, automation scripts.
What already exists that Yggdrasil can build on vs. what needs creating.>

---

## 2. Worktree Isolation Model

### Isolation Strategy

<Describe how each worktree achieves full isolation.
What gets its own instance vs. what's shared.>

### Per-Worktree Resources

| Resource | Isolation Method | Naming Pattern |
|----------|-----------------|----------------|
| Docker containers | Unique COMPOSE_PROJECT_NAME | `<project>-wt-<id>` |
| Database | <separate container / unique DB name / etc.> | `<db>_wt_<id>` |
| Volumes | Per-worktree named volumes | `<project>-wt-<id>-<volume>` |
| Networks | <per-worktree / shared with port isolation> | `<project>-wt-<id>-net` |
| Env file | Generated from template | `.env.worktree` |

### Shared Resources (Not Isolated)

| Resource | Why Shared | Safety Notes |
|----------|-----------|--------------|
| <e.g., Docker images> | <read-only, no conflict> | <any caveats> |
| <e.g., package cache> | <performance, no mutation> | <any caveats> |

---

## 3. Port Allocation Scheme

### Base Port Map

| Service | Default Port | Env Variable | Container Port |
|---------|-------------|-------------|----------------|
| <web server> | <8080> | <APP_PORT> | <80> |
| <database> | <5432> | <DB_PORT> | <5432> |
| <frontend dev> | <5173> | <VITE_PORT> | <5173> |
| ... | ... | ... | ... |

### Allocation Strategy

- **Port range:** <e.g., 10000-19999>
- **Allocation method:** <e.g., base offset — worktree 1 gets 10000+, worktree 2 gets 10100+, etc.>
- **Slot size:** <e.g., 100 ports per worktree>
- **State file:** <e.g., `.worktree-ports.json` in project root>
- **Conflict detection:** <how to check if a port is already in use>
- **Gap filling:** <whether freed slots get reused>

### Port Mapping Formula

```
For worktree slot N (0-indexed):
  <service_1>: <base> + (N * <slot_size>) + <offset_1>
  <service_2>: <base> + (N * <slot_size>) + <offset_2>
  ...
```

### Fixed Ports

| Service | Port | Why Fixed |
|---------|------|-----------|
| <any services that can't be dynamically allocated> | <port> | <reason> |

---

## 4. Bootstrap Sequence

### Prerequisites

- [ ] Docker and Docker Compose installed (minimum version: <version>)
- [ ] Git installed (minimum version: <version>)
- [ ] <package manager> installed
- [ ] <any other tools>
- [ ] <any auth tokens or credentials>

### setup-worktree.sh Interface

```bash
# Usage
./setup-worktree.sh <branch-name> [options]

# Options
--no-bootstrap    # Create worktree but skip environment setup
--no-seed         # Skip database seeding
--base <branch>   # Base branch (default: main)
```

### Bootstrap Steps (in order)

| Step | Command/Action | Depends On | Failure Behaviour |
|------|---------------|------------|-------------------|
| 1. Create worktree | `git worktree add .worktrees/<id> -b <branch>` | — | Fatal: abort |
| 2. Allocate ports | Read/update port state file | Step 1 | Fatal: cleanup worktree |
| 3. Generate env | Template `.env` with worktree-specific values | Step 2 | Fatal: cleanup worktree + free ports |
| 4. Install deps | `<install command>` | Step 3 | Fatal: full cleanup |
| 5. Start containers | `docker compose up -d` | Step 4 | Fatal: full cleanup |
| 6. Wait for services | Health check loop | Step 5 | Fatal: full cleanup |
| 7. Run migrations | `<migration command>` | Step 6 | Fatal: full cleanup |
| 8. Seed database | `<seed command>` | Step 7 | Warn and continue (with --no-seed skip) |
| 9. Build frontend | `<build command>` | Step 4 | Fatal: full cleanup |
| 10. Health check | `<verification command>` | All above | Warn (env is up but may have issues) |

<Adjust this table to the actual project requirements. Add or remove steps as needed.>

### Environment Template

```env
# Generated per-worktree — DO NOT EDIT MANUALLY
# Template source: .env.example

# === Per-worktree values ===
COMPOSE_PROJECT_NAME=<project>-wt-<id>
APP_PORT=<allocated>
DB_PORT=<allocated>
DB_DATABASE=<project>_wt_<id>
# ... other per-worktree vars

# === Shared values (copied from .env.example) ===
APP_KEY=<from-example>
# ... other shared vars
```

---

## 5. Teardown Sequence

### teardown-worktree.sh Interface

```bash
# Usage
./teardown-worktree.sh <branch-name-or-worktree-path> [options]

# Options
--force           # Skip uncommitted changes check
--keep-branch     # Don't delete the git branch
```

### Teardown Steps (in order)

| Step | Command/Action | Failure Behaviour |
|------|---------------|-------------------|
| 1. Check uncommitted changes | `git status` in worktree | Abort unless --force |
| 2. Stop containers | `docker compose down -v` | Warn and continue |
| 3. Remove volumes | Remove per-worktree named volumes | Warn and continue |
| 4. Remove network | Remove per-worktree network (if applicable) | Warn and continue |
| 5. Drop database | `<drop command>` (if separate DB, not container) | Warn and continue |
| 6. Free ports | Update port state file | Warn and continue |
| 7. Remove worktree | `git worktree remove <path>` | Fatal if fails |
| 8. Delete branch | `git branch -D <branch>` (unless --keep-branch) | Warn and continue |

<Adjust this table to the actual project requirements.>

---

## 6. Failure Handling

### Trap-Based Cleanup

```
On any failure during bootstrap:
  1. Stop any containers that were started
  2. Remove any volumes that were created
  3. Free allocated ports
  4. Remove the worktree directory
  5. Log the failure with the step that failed
  6. Exit with non-zero status
```

### Failure Scenarios

| Scenario | Behaviour |
|----------|----------|
| Docker not running | Fail immediately with clear message |
| Port conflict (allocated port in use) | Re-allocate from next available slot |
| Migration failure | Full cleanup — corrupted DB isn't useful |
| Seeder failure | Warn and continue — env is usable without seed data |
| Frontend build failure | <depends on project — fatal or warn?> |
| Worktree already exists | Fail with message suggesting teardown first |
| Network error during dep install | Full cleanup — partial deps aren't safe |

### Recovery

- **Can re-run after failure?** <yes — teardown runs automatically on failure / no — must manually teardown first>
- **Idempotency:** <which steps are safe to re-run?>
- **Log location:** `.worktrees/<id>/bootstrap.log`

---

## 7. Environment Configuration

### Variable Categories

#### Per-Worktree (generated by setup script)
| Variable | Source/Formula | Example |
|----------|---------------|---------|
| `COMPOSE_PROJECT_NAME` | `<project>-wt-<slot>` | `myapp-wt-3` |
| `APP_PORT` | Port allocation | `10200` |
| `DB_PORT` | Port allocation | `10201` |
| `DB_DATABASE` | `<project>_wt_<slot>` | `myapp_wt_3` |
| ... | ... | ... |

#### Shared (copied from template)
| Variable | Source |
|----------|--------|
| `APP_KEY` | `.env.example` or generated |
| ... | ... |

#### Secrets (require special handling)
| Variable | Handling |
|----------|---------|
| <API keys, tokens> | <copy from main .env / generate / prompt user> |

---

## 8. Docker Compose Template

### Override Strategy

<Describe how per-worktree Docker Compose configuration works.
Options:
- Generate a complete docker-compose.worktree.yml per worktree
- Use a shared base with env var substitution (COMPOSE_PROJECT_NAME + .env)
- Use docker-compose.override.yml per worktree>

### Compose Template

```yaml
# Describe the per-worktree compose structure
# Either the full template or the override pattern
```

---

## 9. Parallel Execution Constraints

- **Maximum concurrent worktrees:** <number, based on resource limits>
- **Memory per worktree:** ~<estimate> (sum of all containers)
- **Disk per worktree:** ~<estimate> (deps + volumes + build artifacts)

### Resource Contention Points

| Resource | Risk | Mitigation |
|----------|------|-----------|
| Docker memory | <n> containers × <m> worktrees | Set memory limits per container |
| Disk space | Large node_modules/vendor dirs | Shared package cache volume |
| CPU during builds | Parallel frontend builds | Limit concurrent builds |
| Database connections | Each worktree's DB server | Connection pooling or limits |

---

## 10. Pipeline Integration

### Design-to-Deploy Integration

- **Auto-create worktree?** <yes/no — should the pipeline create its own worktree?>
- **Session ID format:** `<YYYY-MM-DD-HH-MM>-<topic>`
- **Branch naming:** `feature/<topic>`
- **Worktree path:** `.worktrees/<session-id>`
- **Auto-teardown on success?** <yes/no>
- **Preserve on failure?** <yes — for debugging>

### CI/CD Compatibility

- **Usable in CI?** <yes/no>
- **CI-specific changes:** <what differs in CI — e.g., no port persistence, ephemeral everything>
- **CI Docker requirements:** <docker-in-docker, specific runners, etc.>

### Orchestration

- **Worktree naming collision avoidance:** <timestamp + topic / random suffix / sequential>
- **Concurrency coordination:** <port state file with locking / advisory locks / etc.>

---

## 11. Platform Requirements

| Requirement | Minimum Version | Notes |
|-------------|----------------|-------|
| OS | <Linux / macOS / both> | <WSL notes if applicable> |
| Bash | <version> | <zsh compatibility?> |
| Git | <version> | Worktree support requires git 2.5+ |
| Docker | <version> | <compose v2 required?> |
| Docker Compose | <v2.x> | <plugin vs. standalone?> |
| <package manager> | <version> | |

---

## 12. Implementation Checklist

Ordered list of what to build, with dependencies:

- [ ] **Port allocation system** — State file, allocate/free functions, conflict detection
- [ ] **Environment template generator** — Read `.env.example`, substitute per-worktree values
- [ ] **setup-worktree.sh** — Full bootstrap with trap-based cleanup
- [ ] **teardown-worktree.sh** — Safe removal with uncommitted changes protection
- [ ] **Docker Compose template/override** — Per-worktree container isolation
- [ ] **Health check script** — Verify all services are running and reachable
- [ ] **Integration with design-to-deploy** — Wire worktree lifecycle into pipeline stages
- [ ] **Documentation** — Usage guide, troubleshooting, architecture decisions

### Implementation Notes

<Any specific implementation guidance, gotchas, or recommendations that emerged from the requirements gathering.>
```

## Guidelines

- **Be specific, not generic.** Every section should reference the actual project's services, ports, commands, and conventions. Don't write "your database command here" — write the actual command.
- **Include exact commands.** The implementation checklist items should link to specific technical decisions made during the interview.
- **No ambiguity.** If a decision wasn't made during the interview, flag it as "TBD — needs decision" rather than guessing.
- **Port map must be complete.** Every service that uses a port must appear. Missing ports cause conflicts.
- **Bootstrap order matters.** The sequence must respect dependencies — containers before migrations, migrations before seeds, etc.
- **Failure handling must be explicit.** For each bootstrap step, state what happens on failure.
- **Test the teardown mentally.** Walk through the teardown sequence and verify it reverses everything the bootstrap creates.
