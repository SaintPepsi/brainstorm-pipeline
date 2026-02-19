# Changelog

All notable changes to the `design-to-deploy` skill will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.14.0] - 2026-02-19

### Added

- `references/patterns/svelte-conventions.md` — centralised Svelte-specific rules for test file architecture (page vs component boundary) and third-party component selector guidance, replacing inline repetitions across 4 sub-skills
- `references/templates/` directory with 7 report templates extracted from sub-skills: review-notes, compliance-report, debugging-report, feature-implementation-report, test-implementation-report, test-verification-report, cross-check-report
- Implementation Sequence section in `references/patterns/dependency-inversion.md` — the 4-step interfaces-first build order, replacing inline copies in feature-planner and feature-implementer

### Changed

- All 10 sub-skills trimmed to reference shared patterns and templates instead of inlining content (1,429 → 940 lines, -34%)
- `feature-planner.md` and `feature-implementer.md`: replaced inline DIP 4-step sequence with reference to `dependency-inversion.md`
- `unit-test-planner.md`, `plan-reviewer.md`, `e2e-test-planner.md`, `test-implementer.md`: replaced inline Svelte rules with reference to `svelte-conventions.md`
- `review-compiler.md`, `design-compliance-checker.md`, `systematic-debugger.md`, `feature-implementer.md`, `test-implementer.md`, `test-verifier.md`, `plan-reviewer.md`: replaced inline report templates with references to `references/templates/`

## [0.13.0] - 2026-02-19

### Added

- Mandatory mockup gate in `brainstormer.md` (step 3) — UI features require a visual mockup shared with and approved by the user before the design doc is written
- "Middleware & Cross-Cutting Impact Analysis" section in `brainstormer.md` design doc output — enumerates affected routes, at-risk test suites, behavioural changes, and rollback strategy when middleware or cross-cutting logic is introduced
- Middleware impact planning step in `feature-planner.md` (step 4) — sequences middleware before dependent features, adds explicit E2E run after middleware wiring, and plans updates to affected test suites
- Early E2E run rule in `feature-implementer.md` (step 5) — run existing E2E tests immediately after wiring cross-cutting middleware, before implementing the rest of the feature
- Third-party component source reading rule in `e2e-test-planner.md` and `test-implementer.md` — read actual rendered DOM structure from library source before planning or writing selectors for bits-ui, Radix, shadcn, etc.
- "Fix test infrastructure, not production defaults" rule in `test-verifier.md` — when tests break due to new middleware or environment changes, fix test setup, never weaken production code
- User-provided test results acceptance rule in `SKILL.md` and `test-verifier.md` — accept user-shared test output as ground truth without re-running via sub-agent

## [0.12.0] - 2026-02-19

### Added

- Scope Check step in `unit-test-planner.md` and `e2e-test-planner.md` — planners now evaluate whether their test type is applicable before planning tests, and can output "Not applicable" with rationale when the feature has no testable units or no user-visible behaviour
- Test File Architecture validation in `plan-reviewer.md` (step 5) — cross-check now flags `.svelte.test.ts` files planned for page-level route components (`src/routes/`), validates "not applicable" rationale, and verifies coverage handoff between unit and E2E plans
- "Test File Architecture" section in cross-check report format with checklist items for page/component boundary, scope, rationale, and coverage handoff
- Test file architecture guideline in `unit-test-planner.md` — component unit tests scoped to `$lib/components/` only, never for page-level routes

### Changed

- SKILL.md stages 3-5: planners may now produce "Not applicable" outputs; corresponding implementation (7a/7b) and verification (7d/7e) stages are skipped when a plan is not applicable
- SKILL.md stages 7a, 7b, 7d, 7e: each stage checks whether its plan said "Not applicable" before spawning agents, marks task complete immediately and records skip in PROGRESS.md if so

## [0.11.0] - 2026-02-18

### Added

- PROGRESS.md integration: worktree setup copies template, compaction checkpoints require PROGRESS.md update, post-compaction agents read PROGRESS.md for state recovery
- Iteration Limits subsection with hard caps for all retry loops (test verification: 2, systematic debugger: 1, build/lint: 5, self-correction: 3, exploration: 10 calls)
- Agent Persistence for Coupled Stages subsection: resume 7a→7b (test impl) and 7d→7e (test verification), spawn fresh across phase boundaries and after compaction
- "Best" example in Context Isolation Rules showing PROGRESS.md-based agent prompts after compaction
- Explicit prompt wording in Test Verification Retry Logic per attempt level
- Failure report path (`08-test-results/failure-report.md`) and PROGRESS.md update on pipeline stop
- 100K token context red flag for verification agents

### Changed

- Stage 7a: saves agent ID for reuse in 7b
- Stage 7b: resumes 7a agent instead of spawning fresh, updates PROGRESS.md
- Stage 7d: reads PROGRESS.md, includes iteration limit in prompt, saves agent ID for reuse in 7e
- Stage 7e: resumes 7d agent instead of spawning fresh, includes iteration limit, updates PROGRESS.md with verification results

## [0.10.0] - 2026-02-18

### Changed

- Split "Implement tests (failing)" into two separate tasks: "Implement unit tests (failing)" and "Implement E2E tests (failing)" — each stage now has its own task with independent in-progress/complete tracking
- Added "Finalise — push and create PR" as task 14, bringing total pipeline tasks from 12 to 14
- Stage 7b now has explicit mark-in-progress and mark-complete instructions (previously had neither)

### Added

- Pipeline Completion Gate (section 5) — requires all 13 stage tasks to be marked complete before finalise begins, with full expected-state checklist
- Task discipline rules block: mark-in-progress before starting, mark-complete only after artifact committed, never skip, check remaining tasks after each stage
- "Common failure mode" warning about skipping verification stages (10-13) after feature implementation

## [0.9.0] - 2026-02-16

### Changed

- FINALISE step replaced direct merge with `git push` + `gh pr create` — pipeline never merges to base branch
- Worktree preserved until PR is merged instead of auto-removed on success
- Updated example conversation to reflect PR-based flow

## [0.8.0] - 2026-02-16

### Added

- Dependency Inversion Principle (DIP) as a first-class pattern across all pipeline stages
- New `references/patterns/dependency-inversion.md` — concise pattern reference covering the principle, rules, and violation checklist
- "Interfaces & Contracts" required section in brainstormer design doc output — identifies every boundary where business logic meets infrastructure
- DIP section in SKILL.md code quality block, alongside DRY and YAGNI

### Changed

- Feature planner now sequences implementation in DIP order: interfaces first, business logic, infrastructure adapters, composition root last
- Feature implementer follows the same interfaces-first build order and must never construct dependencies internally
- Plan reviewer has a new step 6 checking for DIP violations before implementation begins
- Unit test planner plans tests against abstractions using test doubles instead of concrete infrastructure
- E2E test planner leverages DIP to wire test-specific implementations at the composition root
- Test implementer creates test doubles that implement the same interfaces as production code

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
