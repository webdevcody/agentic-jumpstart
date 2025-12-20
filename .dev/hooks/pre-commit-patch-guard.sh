#!/bin/bash
# Pre-commit hook to prevent committing with dev patches active
# Add to .git/hooks/pre-commit or use with husky/lefthook

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_PATCH="$SCRIPT_DIR/../dev-patch.sh"

# Use the dev-patch check command
if [ -f "$DEV_PATCH" ]; then
    bash "$DEV_PATCH" check
fi
