# Development Patches (.dev)

This directory contains development-only patches that enhance the local development experience but should **never be committed** to the main codebase.

## Setup (run once after cloning)

```bash
bash .dev/setup.sh
```

This adds git aliases for convenient patch management.

## Quick Start

```bash
# Check patch status
bash .dev/dev-patch.sh status

# Apply/remove ALL dev patches at once
bash .dev/dev-patch.sh all-on
bash .dev/dev-patch.sh all-off

# Apply/remove individual patches
bash .dev/dev-patch.sh on dev-login-bypass
bash .dev/dev-patch.sh off dev-login-bypass
bash .dev/dev-patch.sh toggle mock-storage
```

## Directory Structure

```
.dev/
├── README.md              # This file
├── setup.sh               # Run once to add git aliases
├── dev-patch.sh           # Patch management script
├── patches.yaml           # Patch state tracking (on/off)
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
- Floating bug icon (draggable to any corner)
- Create test users with random emails/names
- Quick switch between dev users
- Toggle admin/premium status per user

**Files affected:**
- `src/components/dev-menu/dev-floating-menu.tsx` (new)
- `src/components/dev-menu/dev-user-card.tsx` (new)
- `src/components/dev-menu/random-email-generator.ts` (new)
- `src/fn/dev-auth.ts` (new)
- `src/routes/dev-login.tsx` (new)
- `src/routes/__root.tsx` (modified)
- `src/routes/api/login/google/index.ts` (modified)

**Requires:** `DEV_BYPASS_AUTH=true` in `.env`

### mock-storage

Bypasses R2/S3 storage when credentials aren't configured. Uses sample videos and images for development.

**Features:**
- No R2/S3 connection required
- Sample videos from Google Storage (~2MB each, fast loading)
- Thumbnails from Unsplash (tech/coding themed)
- Hash-based selection ensures consistent content per segment
- Console logging for storage operations

**Files affected:**
- `src/utils/storage/mock-storage.ts` (new)
- `src/utils/storage/index.ts` (modified)
- `src/fn/video-transcoding.ts` (modified)
- `src/routes/-components/hero.tsx` (modified)
- `src/utils/video-transcoding.ts` (modified)

**Requires:** `DEV_MOCK_STORAGE=true` in `.env`

## Patch Management Script

The `dev-patch.sh` script provides a unified interface for managing patches:

```bash
# Commands
bash .dev/dev-patch.sh status          # Show all patches status
bash .dev/dev-patch.sh on <patch>      # Apply a patch
bash .dev/dev-patch.sh off <patch>     # Remove a patch
bash .dev/dev-patch.sh toggle <patch>  # Toggle a patch on/off
bash .dev/dev-patch.sh all-on          # Apply all patches
bash .dev/dev-patch.sh all-off         # Remove all patches
bash .dev/dev-patch.sh rebuild         # Rebuild patches from yaml state
bash .dev/dev-patch.sh check           # Check if any patches are on (for pre-commit)
```

### How It Works

1. **State tracking**: `patches.yaml` tracks which patches are on/off
2. **Rebuild approach**: When changing patches, all files are reset to clean state, then all "on" patches are applied in order
3. **Patch ordering**: Patches are applied in the order listed in `patches.yaml` (dev-login-bypass first, then mock-storage)

## Git Aliases

After running `bash .dev/setup.sh`, these commands are available:

```bash
git dev-status          # Show patch status
git dev-on              # Apply all patches
git dev-off             # Remove all patches
git dev-patch <cmd>     # Full patch management

# Individual patches
git login-bypass-on     # Apply dev-login-bypass
git login-bypass-off    # Remove dev-login-bypass
git mock-storage-on     # Apply mock-storage
git mock-storage-off    # Remove mock-storage
```

## Pre-commit Hook Setup

The hook prevents accidentally committing when dev patches are active.

### Manual Setup

```bash
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

### 1. Start from clean state

```bash
bash .dev/dev-patch.sh all-off
```

### 2. Make your dev-only changes

Edit files as needed for your new dev feature.

### 3. Generate the patch

```bash
# For tracked file changes
git diff > .dev/patches/<patch-name>.patch

# For new files, add them first
git add -N <new-file>
git diff > .dev/patches/<patch-name>.patch
```

### 4. Add to patches.yaml

```yaml
patches:
  dev-login-bypass: off
  mock-storage: off
  your-new-patch: off    # Add this line
```

### 5. Reset and test

```bash
git checkout -- .
bash .dev/dev-patch.sh on your-new-patch
```

## Troubleshooting

### Patch won't apply

```bash
# Check what's blocking
git apply --check .dev/patches/<patch-name>.patch

# Try with whitespace ignore
git apply --ignore-whitespace .dev/patches/<patch-name>.patch

# If conflicts, rebuild from clean state
bash .dev/dev-patch.sh rebuild
```

### CRLF/LF issues (Windows)

The script uses `--ignore-whitespace` to handle line ending differences. If you still have issues:

```bash
# Convert file to LF
dos2unix .dev/patches/<patch-name>.patch
```

### Patches conflict with each other

Patches are applied in order. If adding a new patch that modifies files also modified by earlier patches, make sure your patch assumes earlier patches are already applied.

### State out of sync

If `patches.yaml` says patches are on but files don't reflect it:

```bash
bash .dev/dev-patch.sh rebuild
```

### Regenerating a patch after codebase changes

If the base code changes and a patch no longer applies:

1. Start from clean state: `bash .dev/dev-patch.sh all-off`
2. Apply other patches that should come before: `bash .dev/dev-patch.sh on <earlier-patch>`
3. Manually make the changes for the broken patch
4. Generate new patch: `git diff > .dev/patches/<patch-name>.patch`
5. For new files: include them with `git diff --no-index /dev/null <file> >> .dev/patches/<patch-name>.patch`
