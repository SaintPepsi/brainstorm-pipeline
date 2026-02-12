# Changelog

All notable changes to the `design-to-deploy` skill will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2026-02-11

### Added

- `createTask` lifecycle markers for all 12 pipeline stages (brainstorm through final review) with per-stage instructions on when to create, progress, and complete tasks (PR #4)

## [0.5.0] - 2026-02-10

### Added

- DRY, SOLID, and YAGNI as a concise top-level code quality principle in SKILL.md
- One-liner DRY/SOLID/YAGNI guideline added to each relevant sub-skill (brainstormer, feature-planner, feature-implementer, unit-test-planner, e2e-test-planner, test-implementer, plan-reviewer, design-compliance-checker)

## [0.4.0] - 2026-02-09

### Added

- Cost management section with model selection guidance, compaction checkpoints, and turn budgets
- Model recommendations per pipeline stage (Haiku for checklist stages, Sonnet for most work, Opus for systematic debugging)
- Explicit `/compact` checkpoints after Phase 1, after parallel planning, and after implementation
- Turn budget guidance: 15–30 for brainstorm, 20–30 for orchestration, flag at 60 turns or 80K context

### Changed

- All Phase 2 stage descriptions now include recommended model tier
- Retry logic specifies Sonnet for initial attempts, Opus for systematic debugger escalation
- Phase 2 instructions now start with a `/compact` to clear brainstorm conversation from context

## [0.3.1] - 2026-02-06

Added a usages folder to include version usage and success/fail conversations for reflection

## [0.3.0] - 2026-02-06

### Changed

- Split pipeline into Phase 1 (interactive brainstorm in main context) and Phase 2 (autonomous sub-agents)
- Brainstormer now runs in the agent's own context so the user can answer questions and make decisions
- Added explicit context isolation rules: agent must NOT read sub-skill docs in main context (except brainstormer.md)
- Sub-skill reference table now shows which context each stage runs in

### Fixed

- Brainstorm stage no longer spawns as a Task agent (which locked the user out of interaction)
- Removed stale `.design-to-deploy.yml` config reference from brainstormer.md

## [0.2.0] - 2026-02-06

### Removed

- Orchestrator script (`scripts/orchestrator.ts`) — reimplemented what Claude Code does natively
- Type definitions (`scripts/types.ts`) — bulk was config types
- Prompt templates (`references/prompts/*.md`) — redundant with sub-skill docs
- Config file (`assets/design-to-deploy.yml.example`) — agent discovers everything from package.json

### Changed

- SKILL.md is now the single source of truth for the entire pipeline
- All pipeline instructions moved from orchestrator into SKILL.md

## [0.1.0] - 2026-02-06

### Added

- Initial skill structure with SKILL.md and 12 sub-skill reference docs
- Pipeline stages: brainstorm, scope validation, parallel planning, cross-check, TDD implementation, design compliance, review
- Test verification retry logic with systematic debugger escalation
- Scope validation heuristics
- Session history structure
- Git worktree isolation
- Conventional commit messages per stage
