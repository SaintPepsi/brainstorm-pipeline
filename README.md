# Brainstorm Pipeline

A Claude Code plugin marketplace with multi-agent pipeline skills for automated development workflows.

## Installation

```bash
# Register the marketplace
/plugin marketplace add SaintPepsi/brainstorm-pipeline

# Install the plugin
/plugin install brainstorm-pipeline@brainstorm-pipeline-marketplace
```

Or install directly:

```bash
/plugin install SaintPepsi/brainstorm-pipeline
```

## Skills

### design-to-deploy

A recursive, multi-agent workflow that automates the journey from idea to validated design to implementation to verified tests. Each pipeline stage spawns a fresh-context agent with specific inputs/outputs, passing artifacts via filesystem.

```bash
/design-to-deploy "Add user authentication with magic links"
```

**Pipeline:**

```
Phase 1 (interactive, main context):
  BRAINSTORM with user -> design doc

Phase 2 (autonomous, Task agents):
  VALIDATE SCOPE -> [PLAN UNIT | PLAN E2E | PLAN FEATURE] -> CROSS-CHECK
    -> IMPL TESTS (failing) -> IMPL FEATURE -> VERIFY TESTS -> VERIFY DESIGN -> REVIEW
```

See [skills/design-to-deploy/SKILL.md](skills/design-to-deploy/SKILL.md) for full documentation.

### session-token-analysis

Analyses Claude Code session logs for token usage efficiency, cache performance, and context growth patterns.

```bash
/session-token-analysis
```

**Reports:**
- Per-session token breakdown (input, output, cache creation, cache read)
- Cache hit rates and effective input calculation
- Turn-by-turn context growth curves
- Tool usage frequency and efficiency
- Cross-session comparison table
- Actionable efficiency recommendations

See [skills/session-token-analysis/SKILL.md](skills/session-token-analysis/SKILL.md) for full documentation.

## Plugin Structure

```
brainstorm-pipeline/
├── .claude-plugin/
│   ├── plugin.json              # Plugin identity and metadata
│   └── marketplace.json         # Marketplace registry
├── skills/
│   ├── design-to-deploy/        # Multi-agent pipeline skill
│   │   ├── SKILL.md             # Skill definition
│   │   ├── CHANGELOG.md         # Version history
│   │   ├── references/
│   │   │   └── sub-skills/      # 12 sub-skill instruction docs
│   │   └── examples/            # Real execution logs
│   └── session-token-analysis/  # Token analysis skill
│       ├── SKILL.md             # Skill definition
│       └── scripts/
│           └── analyze_sessions.py
├── docs/                        # Specifications and test plans
│   ├── design-to-deploy-spec.md
│   └── design-to-deploy-test-plan.md
└── README.md
```

This follows the [Obra Superpowers](https://github.com/obra/superpowers) plugin convention: skills live in `skills/<name>/SKILL.md` with YAML frontmatter, and plugin metadata lives in `.claude-plugin/`.

## Sub-Skills (design-to-deploy)

| Sub-Skill | Runs In | Input | Output |
|-----------|---------|-------|--------|
| `brainstormer` | Main context | User idea + project | design-doc.md |
| `scope-validator` | Task agent | design-doc.md | validated/split docs |
| `unit-test-planner` | Task agent | design-doc.md | unit-test-plan.md |
| `e2e-test-planner` | Task agent | design-doc.md | e2e-test-plan.md |
| `feature-planner` | Task agent | design-doc.md | feature-plan.md |
| `plan-reviewer` | Task agent | All plans + design | patched plans |
| `test-implementer` | Task agent | test-plan.md | test files (failing) |
| `feature-implementer` | Task agent | feature-plan.md | feature code |
| `test-verifier` | Task agent | test files + code | pass/fail + fixes |
| `systematic-debugger` | Task agent | failing tests | debugging-report.md |
| `design-compliance-checker` | Task agent | design + code | compliance-report.md |
| `review-compiler` | Task agent | all artifacts | review-notes.md |

## License

MIT
