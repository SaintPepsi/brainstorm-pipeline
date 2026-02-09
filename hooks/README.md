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

Automatically detects when you're committing plugin files (skills, commands, or .claude-plugin metadata) and prompts you to bump the version.

**Features:**
- Only triggers when plugin-related files are staged
- Interactive prompt with options:
  - `1` - Patch version bump (bug fixes, minor changes)
  - `2` - Minor version bump (new features, backwards compatible)
  - `3` - Major version bump (breaking changes)
  - `4` - Custom version number
  - `s` - Skip version bump
- Automatically stages the updated version files
- Shows current and new version

**Example:**
```
Plugin files detected in commit:
  commands/design-to-deploy.md

Current version: 1.0.3
Bump version?
  1) patch (bug fixes, minor changes)
  2) minor (new features, backwards compatible)
  3) major (breaking changes)
  4) custom version
  s) skip (no version bump)

Select [1/2/3/4/s]: 1
Bumping version (patch)...
✓ Version bumped to 1.0.4 and staged
```

## Bypassing Hooks

To skip hooks for a single commit:
```bash
git commit --no-verify
```
