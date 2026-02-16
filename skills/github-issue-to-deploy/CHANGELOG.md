# Changelog

All notable changes to the `github-issue-to-deploy` skill will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2026-02-16

### Changed

- FINALISE step replaced direct merge with `git push` + `gh pr create` with `closes #issue` in PR body
- Worktree preserved until PR is merged instead of auto-removed on success

## [0.8.0] - 2026-02-16

### Added

- "Interfaces & Contracts" required section in design-doc-writer output spec — ensures autonomous design docs identify infrastructure boundaries for DIP, matching the brainstormer's updated output format

## [0.7.0] - 2026-02-11

### Added

- `createTask` lifecycle markers for evaluate and design-doc stages — creates 2 tasks (evaluate and design doc); Phase 2 tasks are handled by `design-to-deploy` (PR #4)

## [0.6.0] - 2026-02-10

### Added

- Initial skill — fully autonomous pipeline from GitHub issue to verified implementation (PR #3)
- Phase 0 (Evaluate): fetches issue metadata, body, comments, and labels; spawns issue-evaluator agent to classify and extract requirements
- Phase 1 (Design): autonomous design-doc-writer agent replaces interactive brainstorm, synthesising issue context into a design doc
- Reuses all 12 existing design-to-deploy sub-skills for Phase 2 (Build)
- Autonomy assessment in issue-evaluator to flag when human input may be needed
- Sonnet-to-Opus escalation for design-doc-writer on large scope or high-risk assumptions
- Two new sub-skills: `issue-evaluator.md` (Haiku) and `design-doc-writer.md` (Sonnet/Opus)
- Automatic PR linking with `refs #N` in commits and `closes #N` in final PR
