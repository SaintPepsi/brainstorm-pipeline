# Codebase Analyzer — Autonomous Agent Instructions

## Execution Model

**This stage runs as a Task agent.** It receives a target project path and produces a structured analysis of everything relevant to implementing Yggdrasil worktree infrastructure.

## Purpose

Explore a target project's codebase to discover its technology stack, infrastructure, build processes, testing setup, and existing automation. The output feeds the interactive requirements interview — the human will validate findings and fill gaps.

## Input

- Target project path (provided in the agent prompt)

## Process

### 1. Project Identity

Read the project root to establish basics:
- `package.json`, `composer.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `Gemfile`, or equivalent
- `README.md` or `CONTRIBUTING.md` for developer setup instructions
- `.gitignore` for clues about generated artifacts

Record:
- Project name
- Primary language(s) and framework(s)
- Package manager(s) and lockfile(s)

### 2. Docker & Container Infrastructure

Search for container configuration:
- `docker-compose.yml`, `docker-compose.*.yml`, `compose.yml`, `compose.*.yml`
- `Dockerfile`, `*.dockerfile`, `.dockerignore`
- `.env`, `.env.example`, `.env.docker` (env var templates)

For each compose file, extract:
- Service names and images
- Port mappings (host:container)
- Volume mounts (named volumes, bind mounts)
- Environment variables (especially database connection strings, service URLs)
- Network definitions
- Dependencies (`depends_on`)
- Health checks

Record:
- Full list of services with their ports, volumes, and dependencies
- Which services are stateful (databases, queues, caches) vs. stateless (web, worker)
- How environment variables configure service connections

### 3. Database Setup

Identify database usage:
- Connection strings in env files or config
- Migration framework and commands (e.g., `php artisan migrate`, `npx prisma migrate`, `alembic upgrade`, `diesel migration run`)
- Seed/fixture commands
- Database type (PostgreSQL, MySQL, SQLite, MongoDB, etc.)
- Whether the project supports multiple database connections

Record:
- Database type and version (if specified)
- Migration command(s)
- Seeder command(s)
- Connection configuration approach (env vars, config files, both)

### 4. Dependency Management

For each package manager found:
- Install command (`composer install`, `npm ci`, `pip install -r requirements.txt`, etc.)
- Cache directories (`.vendor`, `node_modules`, `.venv`, `target/`, etc.)
- Whether lockfiles are committed
- Post-install hooks or scripts

Record:
- Ordered list of dependency install commands
- Cache/artifact directories that could be shared across worktrees

### 5. Build Process

Search for build configuration:
- `vite.config.*`, `webpack.config.*`, `rollup.config.*`, `tsconfig.json`
- `Makefile`, `Taskfile.yml`, `justfile`
- Build scripts in `package.json` (`build`, `dev`, `start`)
- Asset compilation (CSS, JS bundling, image optimization)

Record:
- Build command(s) for production
- Dev server command(s) with hot reload
- Output directories
- Whether the frontend and backend are co-located or separate

### 6. Test Infrastructure

Search for test configuration:
- `vitest.config.*`, `jest.config.*`, `phpunit.xml`, `pytest.ini`, `cargo test`, `.rspec`
- `playwright.config.*`, `cypress.config.*`, `wdio.conf.*`
- Test directories (`tests/`, `__tests__/`, `spec/`, `e2e/`, `test/`)
- Test runner scripts in package.json

Record:
- Unit test framework and run command
- E2E/integration test framework and run command
- Test configuration file locations
- Whether tests require running services (database, API server)

### 7. Port Usage

Grep for port configurations across the project:
- Port numbers in compose files, env files, config files, and scripts
- Default ports for known services (3000, 5173, 8080, 5432, 3306, 6379, etc.)
- Port configuration via env vars

Record:
- Complete port map: service → port number → configurable via what
- Which ports are hardcoded vs. configurable

### 8. Environment Configuration

Analyse environment variable patterns:
- `.env.example` or `.env.template` contents
- Environment-specific configs (`.env.local`, `.env.test`, `.env.production`)
- Which variables are secrets (API keys, passwords) vs. configuration (ports, hostnames)
- Which variables would need to change per worktree (ports, database names, compose project name)

Record:
- Full list of environment variables from templates
- Classification: secret | config | per-worktree
- Template or example file locations

### 9. Existing Automation

Search for existing development automation:
- Shell scripts in `scripts/`, `bin/`, project root
- `Makefile` or `Taskfile` targets
- CI/CD configuration (`.github/workflows/`, `.gitlab-ci.yml`, `bitbucket-pipelines.yml`, `Jenkinsfile`)
- Git hooks (`.husky/`, `.git/hooks/`, `lefthook.yml`)
- Existing setup/install scripts

Record:
- What automation already exists
- What CI/CD does (build, test, deploy steps)
- Whether there are existing worktree-related scripts

### 10. Git Workflow

Check git conventions:
- Branch naming patterns (from recent branches)
- Commit message patterns (from recent commits)
- Whether worktrees are already in use
- `.gitignore` patterns relevant to worktree isolation

Record:
- Branch naming convention
- Commit message convention
- Existing `.gitignore` entries for generated artifacts

## Output

Write a structured analysis to the path provided in your prompt.

### Required Sections

```markdown
# Codebase Analysis: <project-name>

**Path:** <project-path>
**Primary Stack:** <language(s)> / <framework(s)>
**Package Manager(s):** <list>

## Technology Stack

### Languages & Frameworks
- <language> <version> — <framework>
...

### Package Managers
| Manager | Lockfile | Install Command | Cache Directory |
|---------|----------|-----------------|-----------------|
| <name>  | <file>   | <command>       | <directory>     |

## Docker Infrastructure

### Services
| Service | Image | Ports | Volumes | Stateful |
|---------|-------|-------|---------|----------|
| <name>  | <img> | <ports> | <vols> | yes/no  |

### Compose Files
- <path> — <purpose>

### Networks
- <network definitions>

## Database

- **Type:** <database type and version>
- **Connection config:** <how it's configured>
- **Migration command:** <command>
- **Seed command:** <command or "none found">
- **Multi-DB support:** yes/no

## Build Process

- **Frontend build:** <command>
- **Dev server:** <command>
- **Output directory:** <path>
- **Co-located frontend/backend:** yes/no

## Test Infrastructure

### Unit Tests
- **Framework:** <name>
- **Config:** <path>
- **Command:** <command>
- **Requires running services:** yes/no — <which>

### E2E Tests
- **Framework:** <name>
- **Config:** <path>
- **Command:** <command>
- **Requires running services:** yes/no — <which>

## Port Map

| Service | Port | Configurable Via | Hardcoded |
|---------|------|-----------------|-----------|
| <name>  | <port> | <env var or config> | yes/no |

## Environment Variables

### Per-Worktree Variables (must change per worktree)
| Variable | Current Value/Pattern | Purpose |
|----------|----------------------|---------|
| <name>   | <value>              | <why>   |

### Shared Variables (same across worktrees)
| Variable | Purpose |
|----------|---------|
| <name>   | <why>   |

### Secrets (need secure handling)
| Variable | Purpose |
|----------|---------|
| <name>   | <why>   |

## Existing Automation

### Scripts
- <path> — <what it does>

### CI/CD
- <platform> — <what it runs>

### Git Hooks
- <hook> — <what it does>

## Git Workflow

- **Branch convention:** <pattern>
- **Commit convention:** <pattern>
- **Existing worktree usage:** yes/no

## Bootstrap Sequence (Current Manual Process)

Based on README/CONTRIBUTING docs and scripts found:

1. <step>
2. <step>
...

## Findings Summary

### Ready for Yggdrasil (low effort)
- <things already well-configured for isolation>

### Needs Work (medium effort)
- <things that need modification for per-worktree isolation>

### Challenges (high effort)
- <potential blockers or complex areas>

### Open Questions for User
- <things the analysis couldn't determine>
```

## Guidelines

- **Be exhaustive.** Check every common location for each category. Missing a service or port will create issues later.
- **Don't guess.** If you can't find something, say "not found" rather than assuming. The user interview will fill gaps.
- **Include file paths.** Always reference the actual files where you found information.
- **Note conflicts.** If different files disagree (e.g., different ports in compose vs. env), flag the inconsistency.
- **Classify ports carefully.** The port map is critical for the allocation system — get every port.
- **Check for worktree-hostile patterns.** Absolute paths in configs, hardcoded ports, shared state files, PID files — anything that would break with multiple worktrees running in parallel.
