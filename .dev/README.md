# Development Patches (.dev)

This directory contains development-only patches that enhance the local development experience but should **never be committed** to the main codebase.

## Quick Start

```bash
# Apply/remove ALL dev patches at once
git dev-on                 # Apply all patches
git dev-off                # Remove all patches

# Or apply individual patches
git login-bypass-on        # Apply dev-login-bypass patch
git login-bypass-off       # Remove dev-login-bypass patch
git mock-storage-on        # Apply mock-storage patch
git mock-storage-off       # Remove mock-storage patch
```

## Directory Structure

```
.dev/
├── README.md              # This file
├── patches/               # Patch files
│   ├── dev-login-bypass.patch
│   └── mock-storage.patch
└── hooks/                 # Git hooks for safety
    └── pre-commit-patch-guard.sh
```

## Available Patches

### dev-login-bypass

Adds a floating dev menu for quick user switching and creation without Google OAuth.

**Features:**
- Floating bug icon (draggable to corners)
- Create test users with random emails
- Quick switch between users
- Toggle admin/premium status

**Files affected:**
- `src/components/dev-menu/*` (new)
- `src/fn/dev-auth.ts` (new)
- `src/routes/dev-login.tsx` (new)
- `src/routes/__root.tsx` (modified)
- `src/routes/api/login/google/index.ts` (modified)
- `src/utils/env.ts` (modified - adds DEV_BYPASS_AUTH)

**Requires:** `DEV_BYPASS_AUTH=true` in `.env`

### mock-storage

Bypasses R2/S3 storage to avoid SSL errors when R2 credentials aren't configured. Returns placeholder video (Big Buck Bunny) for all video requests.

**Features:**
- No R2/S3 connection required
- Placeholder video for all video requests
- Simulated uploads (stored in memory)
- Console logging for storage operations

**Files affected:**
- `src/utils/storage/mock-storage.ts` (new)
- `src/utils/storage/index.ts` (modified)
- `src/utils/env.ts` (modified - adds DEV_MOCK_STORAGE)

**Requires:** `DEV_MOCK_STORAGE=true` in `.env`

## Setting Up Git Aliases

Run these commands once to set up cross-platform aliases:

```bash
# Quick toggle for dev-login-bypass
git config alias.login-bypass-on '!f() { git apply "$(git rev-parse --show-toplevel)/.dev/patches/dev-login-bypass.patch"; }; f'
git config alias.login-bypass-off '!f() { git apply -R "$(git rev-parse --show-toplevel)/.dev/patches/dev-login-bypass.patch"; }; f'

# Quick toggle for mock-storage
git config alias.mock-storage-on '!f() { git apply "$(git rev-parse --show-toplevel)/.dev/patches/mock-storage.patch"; }; f'
git config alias.mock-storage-off '!f() { git apply -R "$(git rev-parse --show-toplevel)/.dev/patches/mock-storage.patch"; }; f'

# Apply/remove ALL patches at once
git config alias.dev-on '!f() { for p in $(git rev-parse --show-toplevel)/.dev/patches/*.patch; do git apply "$p" 2>/dev/null && echo "Applied $(basename $p)" || echo "Skipped $(basename $p)"; done; }; f'
git config alias.dev-off '!f() { for p in $(git rev-parse --show-toplevel)/.dev/patches/*.patch; do git apply -R "$p" 2>/dev/null && echo "Removed $(basename $p)" || echo "Skipped $(basename $p)"; done; }; f'

# Generic patch commands (for future patches)
git config alias.dev-patch '!f() {
  action=$1; patch=$2;
  patchfile="$(git rev-parse --show-toplevel)/.dev/patches/${patch}.patch";
  case $action in
    apply) git apply "$patchfile" ;;
    remove) git apply -R "$patchfile" ;;
    status) git apply --check "$patchfile" 2>/dev/null && echo "Not applied" || echo "Applied or conflicts" ;;
    *) echo "Usage: git dev-patch [apply|remove|status] <patch-name>" ;;
  esac
}; f'
```

## Pre-commit Hook Setup

The hook prevents accidentally committing dev patch content.

### Manual Setup

```bash
# Copy hook to git hooks directory
cp .dev/hooks/pre-commit-patch-guard.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### With Husky

Add to `.husky/pre-commit`:
```bash
.dev/hooks/pre-commit-patch-guard.sh
```

### With Lefthook

Add to `lefthook.yml`:
```yaml
pre-commit:
  commands:
    patch-guard:
      run: .dev/hooks/pre-commit-patch-guard.sh
```

## Creating New Patches

### 1. Create your dev changes on a clean branch

```bash
git checkout main
git checkout -b temp-patch-branch
# Make your dev-only changes
git add -A
git commit -m "temp: dev changes for <patch-name>"
```

### 2. Generate the patch

```bash
git format-patch -1 --stdout > .dev/patches/<patch-name>.patch
```

### 3. Clean up

```bash
git checkout main
git branch -D temp-patch-branch
```

### 4. Add git aliases for the new patch

```bash
git config alias.<patch>-on '!git apply "$(git rev-parse --show-toplevel)/.dev/patches/<patch-name>.patch"'
git config alias.<patch>-off '!git apply -R "$(git rev-parse --show-toplevel)/.dev/patches/<patch-name>.patch"'
```

### 5. Update the pre-commit hook (if needed)

The hook automatically checks all `.patch` files in `.dev/patches/`, so typically no changes needed. If your patch requires specific detection logic, update `pre-commit-patch-guard.sh`.

## Troubleshooting

### Patch won't apply

```bash
# Check what's blocking
git apply --check .dev/patches/<patch-name>.patch

# If conflicts, you may need to update the patch
# or reset conflicting files first
git checkout -- <conflicting-file>
```

### Patch partially applied

```bash
# Force remove (may leave artifacts)
git apply -R --reject .dev/patches/<patch-name>.patch

# Or reset to clean state
git checkout -- .
```

### Creating patch from existing changes

```bash
# If you already have uncommitted dev changes
git diff > .dev/patches/<patch-name>.patch

# Or for staged changes
git diff --cached > .dev/patches/<patch-name>.patch
```
