#!/bin/bash
# Test the pre-commit hook

echo "Testing pre-commit hook..."
echo ""
echo "Staged files:"
git diff --cached --name-only
echo ""

# Run the hook directly
.git/hooks/pre-commit

echo ""
echo "Hook test complete!"
