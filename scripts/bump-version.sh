#!/bin/bash
set -e

# Script to increment version in .claude-plugin files
# Usage: ./scripts/bump-version.sh [patch|minor|major|<version>]

PLUGIN_JSON=".claude-plugin/plugin.json"
MARKETPLACE_JSON=".claude-plugin/marketplace.json"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed."
    echo "Install with: brew install jq"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(jq -r '.version' "$PLUGIN_JSON")
echo "Current version: $CURRENT_VERSION"

# Parse version parts
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

# Determine new version
INCREMENT_TYPE="${1:-patch}"

case "$INCREMENT_TYPE" in
    patch)
        PATCH=$((PATCH + 1))
        NEW_VERSION="$MAJOR.$MINOR.$PATCH"
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        NEW_VERSION="$MAJOR.$MINOR.$PATCH"
        ;;
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        NEW_VERSION="$MAJOR.$MINOR.$PATCH"
        ;;
    *)
        # Assume it's a specific version number
        if [[ ! "$INCREMENT_TYPE" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "Error: Invalid version format. Use 'patch', 'minor', 'major', or a version like '1.2.3'"
            exit 1
        fi
        NEW_VERSION="$INCREMENT_TYPE"
        ;;
esac

echo "New version: $NEW_VERSION"

# Update plugin.json
echo "Updating $PLUGIN_JSON..."
jq --arg version "$NEW_VERSION" '.version = $version' "$PLUGIN_JSON" > "$PLUGIN_JSON.tmp"
mv "$PLUGIN_JSON.tmp" "$PLUGIN_JSON"

# Update marketplace.json
echo "Updating $MARKETPLACE_JSON..."
jq --arg version "$NEW_VERSION" '.plugins[0].version = $version' "$MARKETPLACE_JSON" > "$MARKETPLACE_JSON.tmp"
mv "$MARKETPLACE_JSON.tmp" "$MARKETPLACE_JSON"

echo "✓ Version bumped to $NEW_VERSION"
echo ""
echo "Next steps:"
echo "  1. git add .claude-plugin/"
echo "  2. git commit -m \"chore: bump version to $NEW_VERSION\""
echo "  3. git tag v$NEW_VERSION"
echo "  4. git push && git push --tags"
