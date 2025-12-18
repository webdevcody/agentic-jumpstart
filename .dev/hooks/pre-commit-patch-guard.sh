#!/bin/bash
# Pre-commit hook to prevent dev-only patches from being committed
# Add to .git/hooks/pre-commit or use with husky/lefthook

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)/.dev"
PATCHES_DIR="$DEV_DIR/patches"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_patch_files() {
    local patch_file="$1"
    local patch_name="$(basename "$patch_file" .patch)"

    # Extract files that would be created (new files)
    local new_files=$(grep -E "^\+\+\+ b/" "$patch_file" | grep -v "/dev/null" | sed 's|+++ b/||' || true)

    # Check if any new files from the patch are staged
    for file in $new_files; do
        if git diff --cached --name-only | grep -qx "$file"; then
            echo -e "${RED}ERROR: Attempting to commit file from dev patch '$patch_name':${NC}"
            echo -e "${RED}  $file${NC}"
            echo -e "${YELLOW}Run 'git bypass-off' or 'git dev-patch remove $patch_name' before committing.${NC}"
            return 1
        fi
    done

    # Extract files that would be modified
    local modified_files=$(grep -E "^--- a/" "$patch_file" | grep -v "/dev/null" | sed 's|--- a/||' || true)

    # For modified files, check if the staged changes contain patch-specific content
    for file in $modified_files; do
        if git diff --cached --name-only | grep -qx "$file"; then
            # Get unique additions from the patch (lines starting with +, excluding +++ header)
            local patch_additions=$(grep -E "^\+" "$patch_file" | grep -v "^+++" | head -20 | sed 's/^+//' || true)

            # Check if any of these additions appear in staged changes
            local staged_diff=$(git diff --cached -- "$file" 2>/dev/null || true)

            # Look for telltale signs of dev patches
            if echo "$staged_diff" | grep -q "DEV_BYPASS_AUTH\|DevFloatingMenu\|dev-login\|devLoginFn"; then
                echo -e "${RED}ERROR: Staged changes in '$file' appear to contain dev patch content.${NC}"
                echo -e "${YELLOW}Run 'git bypass-off' or reset dev-specific changes before committing.${NC}"
                return 1
            fi
        fi
    done

    return 0
}

# Check all patches in the patches directory
if [ -d "$PATCHES_DIR" ]; then
    for patch in "$PATCHES_DIR"/*.patch; do
        [ -f "$patch" ] || continue
        if ! check_patch_files "$patch"; then
            exit 1
        fi
    done
fi

exit 0
