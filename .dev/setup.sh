#!/bin/bash
# Dev Patches Setup Script
# Run once after cloning to set up git aliases

set -e

echo "Setting up dev patches git aliases..."

# Main commands
git config --local alias.dev-status '! bash .dev/dev-patch.sh status'
git config --local alias.dev-on '! bash .dev/dev-patch.sh all-on'
git config --local alias.dev-off '! bash .dev/dev-patch.sh all-off'
git config --local alias.dev-patch '! bash .dev/dev-patch.sh'

# Individual patch shortcuts
git config --local alias.login-bypass-on '! bash .dev/dev-patch.sh on dev-login-bypass'
git config --local alias.login-bypass-off '! bash .dev/dev-patch.sh off dev-login-bypass'
git config --local alias.mock-storage-on '! bash .dev/dev-patch.sh on mock-storage'
git config --local alias.mock-storage-off '! bash .dev/dev-patch.sh off mock-storage'

echo ""
echo "Done! Available commands:"
echo "  git dev-status    - Show patch status"
echo "  git dev-on        - Apply all patches"
echo "  git dev-off       - Remove all patches"
echo "  git dev-patch     - Full patch management"
echo ""
echo "Individual patches:"
echo "  git login-bypass-on/off"
echo "  git mock-storage-on/off"
