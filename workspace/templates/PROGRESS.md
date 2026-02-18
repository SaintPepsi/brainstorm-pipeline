# Pipeline Progress

## Pipeline

- **Skill**: <!-- design-to-deploy | github-issue-to-deploy -->
- **Session ID**: <!-- YYYY-MM-DD-HH-MM-topic -->
- **Topic**: <!-- kebab-case topic -->
- **Worktree**: <!-- .worktrees/SESSION_ID -->
- **Issue**: <!-- #N (github-issue-to-deploy only, omit for design-to-deploy) -->

## Current State

- **Current Stage**: <!-- e.g. "7c — Implement Feature" -->
- **Status**: <!-- in-progress | blocked | completed | failed -->
- **Last Compaction**: <!-- stage name where /compact was last run -->

## Completed Stages

<!-- Update this list as each stage completes. Include key outputs. -->

| Stage | Output | Notes |
|-------|--------|-------|
| <!-- e.g. Phase 1 Brainstorm --> | <!-- e.g. 01-design-doc.md --> | <!-- key decisions --> |

## Key Decisions

<!-- Capture architectural and design decisions made during the pipeline. -->
<!-- These survive compaction and help post-compaction agents understand context. -->

1. <!-- Decision 1 -->

## Architecture Notes

<!-- High-level architecture, module boundaries, key interfaces. -->
<!-- Extracted from design doc for quick reference by later stages. -->

## Active Issues

<!-- Any blockers, failed attempts, or concerns. -->
<!-- Include iteration counts for retry loops. -->

## Next Steps

<!-- What the next stage should do. Updated before each compaction. -->

1. <!-- Next step 1 -->
