# Git Hooks

This directory contains git hooks for the brainstorm-pipeline repository.

## Installation

```bash
# Install pre-commit hook
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## Available Hooks

### pre-commit

Automatically detects when you're committing plugin files (skills, commands, or .claude-plugin metadata) and automatically bumps the patch version.

**Features:**
- Only triggers when plugin-related files are staged
- Automatically bumps patch version by default
- Automatically stages the updated version files
- Shows current and new version
- Can override bump type with `VERSION_BUMP` environment variable

**Example:**
```
Plugin files detected in commit:
  commands/design-to-deploy.md

Current version: 1.0.3
Auto-bumping version (patch)...
Tip: Set VERSION_BUMP=minor or VERSION_BUMP=major to override

✓ Version bumped to 1.0.4 and staged
```

**Override version bump type:**
```bash
# Bump minor version
VERSION_BUMP=minor git commit -m "feat: add new feature"

# Bump major version
VERSION_BUMP=major git commit -m "feat!: breaking change"

# Set specific version
VERSION_BUMP=2.0.0 git commit -m "chore: release 2.0.0"
```

## Bypassing Hooks

To skip hooks for a single commit:
```bash
git commit --no-verify
```
