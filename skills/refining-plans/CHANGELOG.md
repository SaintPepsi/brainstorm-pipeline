# Changelog

All notable changes to the `refining-plans` skill will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-15

### Added

- Initial `refining-plans` skill — reviews existing implementation plans by building a connection map (produces/consumes per task), tracing gaps in those connections, annotating with inline cross-references (Receives from / Passes to), and rewriting the plan with fixes
- Four-phase process: Connection Map → Trace Gaps → Cross-References → Rewrite
- Anchoring trap section to counter "plan is approved" / "quick check" pressure
- Rationalization table built from TDD baseline testing (6 common excuses with counters)
- Common gap pattern table (disconnected consumer, late dependency, broadcast without targeting, missing infrastructure, orphaned producer, implicit handoff, vague integration)
- TDD-validated: baseline agents found 25-38% of planted gaps; with skill loaded, agents found 100%
