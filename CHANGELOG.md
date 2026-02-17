# Changelog

All notable changes to the brainstorm-pipeline plugin will be documented in this file.
For skill-specific changes, see the CHANGELOG.md in each skill directory.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-02-17

### Added

- New `changelog` skill — generates concise changelogs from git commits on the current branch, with automatic base branch detection, ticket ID extraction, and scope-proportional formatting (bug fix paragraph vs. feature bullets)

## [1.1.0] - 2026-02-16

### Changed

- Pipeline FINALISE step no longer merges directly to base branch — now pushes feature branch and creates a PR via `gh pr create`
- Worktree is preserved until PR is merged instead of being auto-removed
- Updated across all pipeline docs, skills, and examples (`design-to-deploy`, `github-issue-to-deploy`)

## [1.0.0] - 2026-02-16

### Added

- Dependency Inversion Principle (DIP) as a first-class pattern across `design-to-deploy` and `github-issue-to-deploy` pipelines
- New shared pattern reference: `skills/design-to-deploy/references/patterns/dependency-inversion.md`
- "Interfaces & Contracts" required section in design doc output (brainstormer + design-doc-writer)
- DIP violation checking in plan-reviewer cross-check step
- DIP-aware implementation sequencing in feature-planner and feature-implementer
- DIP-aware test planning in unit-test-planner, e2e-test-planner, and test-implementer

## [0.9.0] - 2026-02-15

### Added

- New `refining-plans` skill — reviews existing implementation plans by building connection maps, tracing structural gaps, annotating tasks with inline cross-references, and rewriting plans with fixes applied. TDD-validated against baseline agent behavior.

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
