# Changelog

All notable changes to the `changelog` skill will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-17

### Changed

- Base branch detection now iterates all remote branches by commit distance instead of only trying `main`/`master`/`develop`, with support for chained task branches
- Replaced hardcoded `main..HEAD` references with generic `BASE_BRANCH..HEAD` throughout Steps 2-3
- Merge-heavy branch handling now suggests re-running Step 1 to find a closer base before scoping by ticket
- Replaced project-specific examples (IODR-350, IODR-361) with generic examples (PROJ-42, 2FA feature)

## [0.1.0] - 2026-02-17

### Added

- Initial `changelog` skill — generates concise changelogs from git commits on the current branch
- Automatic base branch detection (main, master, develop) and ticket ID extraction from branch names
- Two output formats: bug fix (paragraph) and feature (sectioned bullets), selected by commit count
- Merge-heavy branch handling with ticket-scoped commit filtering
- Hard rules, scaling guide, and common mistakes reference sections
