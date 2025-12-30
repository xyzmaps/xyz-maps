# Publishing @xyzmaps Packages to npm

## ✅ What Was Changed

The npm package scope has been renamed from `@here` to `@xyzmaps` across the entire codebase:

### Package Names Updated
- `@here/xyz-maps` → `@xyzmaps/xyz-maps` (root)
- `@here/xyz-maps-common` → `@xyzmaps/xyz-maps-common`
- `@here/xyz-maps-core` → `@xyzmaps/xyz-maps-core`
- `@here/xyz-maps-display` → `@xyzmaps/xyz-maps-display`
- `@here/xyz-maps-editor` → `@xyzmaps/xyz-maps-editor`
- `@here/xyz-maps-test` → `@xyzmaps/xyz-maps-test` (private)
- `@here/xyz-maps-utils` → `@xyzmaps/xyz-maps-utils` (private)
- `@here/xyz-maps-playground` → `@xyzmaps/xyz-maps-playground` (private)

### Files Modified
- **237 files changed** with 529 insertions and 470 deletions
- All `package.json` files (names and dependencies)
- All TypeScript imports throughout the codebase
- Root package.json workspace filter scripts
- tsconfig.json path mappings
- bun.lock (workspace references)

### Verification
✅ Build tested: `bun run build-dev` - all packages built successfully
✅ Tests verified: 43 unit tests passing
✅ No remaining `@here/xyz-maps` references found

---

## 📋 Publishing Checklist

### 1. Set Up npm Organization

First, ensure the `@xyzmaps` scope exists on npm:

```bash
# Check if you can access the scope
npm access ls-packages @xyzmaps

# If the scope doesn't exist, create it (requires npm account)
# Visit: https://www.npmjs.com/org/create
# Or use: npm org create @xyzmaps
```

### 2. Configure npm Access

Make sure you have the right permissions:

```bash
# Login to npm (if not already logged in)
npm login

# Verify your login
npm whoami

# Add collaborators to the @xyzmaps organization (if needed)
npm org set @xyzmaps <username> developer
```

### 3. Update Package Metadata (Optional)

Before publishing, you may want to update:

**In `package.json` files**:
- `author` field (currently "HERE Europe B.V.")
- `repository.url` (currently points to heremaps/xyz-maps)
- `homepage` field
- `bugs.url` field

Example:
```json
{
  "author": {
    "name": "Your Name or Organization",
    "url": "https://yoursite.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/xyz-maps.git"
  }
}
```

### 4. Build Release Versions

Build production-ready versions of all packages:

```bash
# Clean any previous builds
bun run cleanup:dist

# Build all packages for release (minified, production)
bun run build-release
```

This will:
- Build ESM-only bundles
- Minify for production
- Generate TypeScript declarations
- Create sourcemaps

### 5. Test the Packages Locally

Before publishing, test the packages:

```bash
# Run tests
bun test

# Test the playground
bun run playground

# Verify bundle sizes
du -sh packages/*/dist/*.js
```

### 6. Set Package Access

For the first publish, you need to set packages as public (scoped packages are private by default):

**Option A: Set in package.json** (recommended)
```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

**Option B: Use publish flag**
```bash
npm publish --access public
```

### 7. Publish to npm

Publish the packages to npm:

```bash
# Publish all packages from the root
npm publish --workspaces --access public

# Or publish individually (if above doesn't work)
cd packages/common && npm publish --access public
cd ../core && npm publish --access public
cd ../display && npm publish --access public
cd ../editor && npm publish --access public
```

**Note**: Private packages (`test`, `utils`, `playground`) won't be published due to `"private": true` in their package.json.

### 8. Verify Publication

Check that packages are published:

```bash
# Check each package on npm
npm view @xyzmaps/xyz-maps-common
npm view @xyzmaps/xyz-maps-core
npm view @xyzmaps/xyz-maps-display
npm view @xyzmaps/xyz-maps-editor

# Or visit npm directly
# https://www.npmjs.com/package/@xyzmaps/xyz-maps-common
```

---

## 📦 Package Structure

### Public Packages (will be published)
- `@xyzmaps/xyz-maps-common` - Core utilities and common functionality
- `@xyzmaps/xyz-maps-core` - Data layer, providers, and tile management
- `@xyzmaps/xyz-maps-display` - Map rendering (WebGL/Canvas)
- `@xyzmaps/xyz-maps-editor` - Interactive map editing features

### Private Packages (won't be published)
- `@xyzmaps/xyz-maps-test` - Test suite
- `@xyzmaps/xyz-maps-utils` - Internal build utilities
- `@xyzmaps/xyz-maps-playground` - Development playground

---

## 🔄 Updating Versions

When you need to publish updates:

```bash
# Bump version (updates all packages, runs build, updates changelog)
npm version patch  # 0.44.0 → 0.44.1
npm version minor  # 0.44.0 → 0.45.0
npm version major  # 0.44.0 → 1.0.0

# Or manually update version in package.json files
# Then build and publish as above
```

---

## 📖 Usage Examples

After publishing, users can install your packages:

```bash
# Install all packages
npm install @xyzmaps/xyz-maps-common @xyzmaps/xyz-maps-core @xyzmaps/xyz-maps-display

# Or install editor with all dependencies
npm install @xyzmaps/xyz-maps-editor
```

**Import in code:**
```typescript
// Old (before rename)
import { Map } from '@here/xyz-maps-display';

// New (after rename)
import { Map } from '@xyzmaps/xyz-maps-display';
```

---

## ⚠️ Important Notes

1. **First Publication**: When publishing for the first time, you MUST use `--access public` since scoped packages default to private.

2. **npm Organization**: Ensure you have created and have access to the `@xyzmaps` organization on npm.

3. **Version Conflicts**: If version `0.44.0` is already taken on npm, you'll need to bump the version first.

4. **Changelog**: Consider updating CHANGELOG.md files before publishing to document changes.

5. **Documentation**: Update any external documentation, READMEs, or websites that reference the old `@here/xyz-maps` packages.

6. **License**: Verify the Apache-2.0 license is appropriate for your fork.

---

## 🐛 Troubleshooting

### "402 Payment Required" error
Your npm account may need to be part of an organization. Create a free organization on npm.

### "403 Forbidden" error
You don't have permission to publish to the `@xyzmaps` scope. Ensure you own it or have been added as a collaborator.

### "Package already exists" error
The package name is already taken. Choose a different scope or package name.

### Build errors
Make sure all dependencies are installed:
```bash
bun install
bun run build-release
```

---

## 📚 Additional Resources

- [npm Organizations](https://docs.npmjs.com/organizations)
- [Publishing Scoped Packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages)
- [Semantic Versioning](https://semver.org/)
- [npm Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
