# Changelog

All notable changes to this skill will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
