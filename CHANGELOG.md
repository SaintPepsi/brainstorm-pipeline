# Changelog

All notable changes to the brainstorm-pipeline plugin will be documented in this file.
For skill-specific changes, see the CHANGELOG.md in each skill directory.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-02-15

### Added

- New `dissect-plan` skill — breaks large plan documents into small, self-contained plan files (max 50 lines) that agents can execute independently, with dependency tracking and validation

## [0.7.0] - 2026-02-11

### Added

- Explicit `createTask` instructions embedded in each pipeline stage across `design-to-deploy` and `github-issue-to-deploy` (PR #4)
- Each stage now specifies when to create tasks, mark them in-progress, and mark them complete for terminal checkbox tracking

### Removed

- `CLAUDE.md` with generic `createTask` guidance — replaced by specific per-stage instructions in each skill

## [0.6.0] - 2026-02-10

### Added

- New `github-issue-to-deploy` skill — fully autonomous pipeline from GitHub issue to verified implementation (PR #3)

## [0.5.0] - 2026-02-10

### Added

- DRY, SOLID, and YAGNI as code quality principles across pipeline sub-skills

## [0.4.0] - 2026-02-09

### Added

- Cost management section with model selection guidance, compaction checkpoints, and turn budgets

## [0.3.0] - 2026-02-06

### Changed

- Split pipeline into Phase 1 (interactive brainstorm) and Phase 2 (autonomous sub-agents)

## [0.2.0] - 2026-02-06

### Changed

- SKILL.md is now the single source of truth for each skill's pipeline

## [0.1.0] - 2026-02-06

### Added

- Initial plugin with `design-to-deploy` and `session-token-analysis` skills
