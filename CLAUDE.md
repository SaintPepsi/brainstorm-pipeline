# CLAUDE.md

## Changelogs

Every change must be logged. This repo uses [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### Where to write

- **Global**: `CHANGELOG.md` at repo root — all notable changes across the plugin.
- **Per-skill**: `skills/<name>/CHANGELOG.md` — changes scoped to that skill. Only update the skills that were actually modified.

### When to bump

- **patch** (0.0.x): bug fixes, typo corrections, minor wording changes
- **minor** (0.x.0): new features, new sub-skills, new pattern references, behavioral changes to existing sub-skills
- **major** (x.0.0): breaking changes to skill contracts (design doc format, sub-skill input/output specs, pipeline stage ordering)

### What to include

- Use `Added`, `Changed`, `Removed`, `Fixed` sections.
- Be specific: name the files, sub-skills, or sections that changed.
- One changelog entry per PR/commit group — don't log each file individually.

## Pipeline Skill Authoring

Rules for writing or modifying skills that use TodoWrite to track multi-stage pipelines.

### One task per stage

Every distinct pipeline stage gets its own task. Never combine two stages (e.g. "Implement unit + E2E tests") into a single task — when the first part finishes, the combined task gets marked complete and the second part is skipped.

### Task name consistency

Task names must be **character-for-character identical** everywhere they appear: the upfront task list, each stage's mark-in-progress/mark-complete instructions, and any completion gate checklist. Mismatched casing or punctuation breaks the link between stage and task.

### Commit every artifact

Every stage that produces an output artifact must include a `Commit:` instruction. Task discipline rules require artifacts to be "written and committed" before marking a task complete — a stage with no commit instruction contradicts that rule.
