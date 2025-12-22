#!/bin/bash
# Dev Patch Manager
# Usage: .dev/dev-patch.sh <command> [patch-name]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATCHES_DIR="$SCRIPT_DIR/patches"
STATE_FILE="$SCRIPT_DIR/patches.yaml"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

get_all_patches() {
    grep -E "^  [a-z-]+:" "$STATE_FILE" | sed 's/:.*//' | tr -d ' '
}

get_state() {
    local patch="$1"
    grep -E "^  $patch:" "$STATE_FILE" | sed 's/.*: //' | tr -d ' '
}

set_state() {
    local patch="$1"
    local state="$2"
    sed -i "s/^  $patch: .*/  $patch: $state/" "$STATE_FILE"
}

get_patch_files() {
    local patch_file="$1"
    grep -E "^diff --git" "$patch_file" | sed 's|diff --git a/\([^ ]*\) b/.*|\1|'
}

reset_patch_files() {
    for patch in $(get_all_patches); do
        local patch_file="$PATCHES_DIR/$patch.patch"
        if [ -f "$patch_file" ]; then
            # Use git apply --reverse to cleanly remove patch (handles both modified and new files)
            git apply --reverse --ignore-whitespace "$patch_file" 2>/dev/null || true
        fi
    done
}

apply_patch_raw() {
    local patch="$1"
    local patch_file="$PATCHES_DIR/$patch.patch"

    [ ! -f "$patch_file" ] && echo -e "${RED}Patch not found: $patch_file${NC}" && return 1

    git apply --ignore-whitespace "$patch_file" 2>/dev/null || \
    git apply --ignore-whitespace --3way "$patch_file" 2>/dev/null || {
        echo -e "${RED}Failed to apply patch: $patch${NC}"
        return 1
    }
}

rebuild_patches() {
    reset_patch_files

    for patch in $(get_all_patches); do
        if [ "$(get_state "$patch")" = "on" ]; then
            echo -e "${GREEN}Applying patch: $patch${NC}"
            apply_patch_raw "$patch" || return 1
        fi
    done
}

apply_patch() {
    local patch="$1"
    [ "$(get_state "$patch")" = "on" ] && echo -e "${YELLOW}Patch '$patch' is already on${NC}" && return 0
    set_state "$patch" "on"
    rebuild_patches
}

remove_patch() {
    local patch="$1"
    [ "$(get_state "$patch")" = "off" ] && echo -e "${YELLOW}Patch '$patch' is already off${NC}" && return 0
    set_state "$patch" "off"
    rebuild_patches
}

status() {
    echo "Dev Patches Status:"
    echo "-------------------"
    for patch in $(get_all_patches); do
        local state=$(get_state "$patch")
        [ "$state" = "on" ] && echo -e "  ${GREEN}$patch: $state${NC}" || echo -e "  $patch: $state"
    done
}

check_any_on() {
    grep -q ": on" "$STATE_FILE"
}

case "${1:-}" in
    on)      apply_patch "$2" ;;
    off)     remove_patch "$2" ;;
    toggle)  [ "$(get_state "$2")" = "on" ] && remove_patch "$2" || apply_patch "$2" ;;
    status)  status ;;
    check)
        if check_any_on; then
            echo -e "${RED}ERROR: Dev patches are active. Run 'git dev-off' before committing.${NC}"
            status
            exit 1
        fi
        ;;
    all-on)
        for patch in $(get_all_patches); do set_state "$patch" "on"; done
        rebuild_patches
        echo ""
        echo -e "${GREEN}All dev patches applied successfully!${NC}"
        status
        ;;
    all-off)
        for patch in $(get_all_patches); do set_state "$patch" "off"; done
        rebuild_patches
        echo ""
        echo -e "${GREEN}All dev patches removed successfully!${NC}"
        status
        ;;
    rebuild) rebuild_patches ;;
    *)
        echo "Usage: dev-patch.sh <command> [patch-name]"
        echo ""
        echo "Commands:"
        echo "  on <patch>      Apply a patch"
        echo "  off <patch>     Remove a patch"
        echo "  toggle <patch>  Toggle a patch on/off"
        echo "  status          Show all patches status"
        echo "  check           Check if any patches are on (for pre-commit)"
        echo "  all-on          Apply all patches"
        echo "  all-off         Remove all patches"
        echo "  rebuild         Rebuild patches from current state"
        ;;
esac
