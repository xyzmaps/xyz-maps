#!/usr/bin/env bash
# Script to update package metadata for @xyzmaps fork

set -e

echo "🔄 Updating package metadata for @xyzmaps packages..."
echo ""

# Step 1: Update all package.json files
echo "📦 Step 1/3: Updating author, repository, and version..."

find . -name "package.json" -not -path "*/node_modules/*" | while read file; do
  echo "  ✓ $file"

  # Update author
  sed -i 's/"name": "HERE Europe B.V."/"name": "XYZmaps contributors"/g' "$file"
  sed -i 's/"url": "https:\/\/here.com"/"url": "https:\/\/github.com\/xyzmaps\/xyz-maps"/g' "$file"

  # Update repository URL
  sed -i 's/"url": "https:\/\/github.com\/heremaps\/xyz-maps.git"/"url": "https:\/\/github.com\/xyzmaps\/xyz-maps.git"/g' "$file"

  # Update version to 0.1.0
  sed -i 's/"version": "0.44.0"/"version": "0.1.0"/g' "$file"

  # Update dependency versions to 0.1.0
  sed -i 's/"@xyzmaps\/xyz-maps-common": "\^0.44.0"/"@xyzmaps\/xyz-maps-common": "^0.1.0"/g' "$file"
  sed -i 's/"@xyzmaps\/xyz-maps-core": "\^0.44.0"/"@xyzmaps\/xyz-maps-core": "^0.1.0"/g' "$file"
  sed -i 's/"@xyzmaps\/xyz-maps-display": "\^0.44.0"/"@xyzmaps\/xyz-maps-display": "^0.1.0"/g' "$file"
  sed -i 's/"@xyzmaps\/xyz-maps-editor": "\^0.44.0"/"@xyzmaps\/xyz-maps-editor": "^0.1.0"/g' "$file"
done

echo ""

# Step 2: Run bun install to update lockfile
echo "🔒 Step 2/3: Updating bun.lock..."
bun install

echo ""

# Step 3: Update MIGRATION-STATUS.md references
echo "📝 Step 3/3: Updating documentation..."
if [ -f "MIGRATION-STATUS.md" ]; then
  sed -i 's/version 0.44.0/version 0.1.0/g' "MIGRATION-STATUS.md"
  echo "  ✓ MIGRATION-STATUS.md"
fi

echo ""
echo "✅ Done! Package metadata updated"
echo ""
echo "📋 Summary of changes:"
echo "  Author:     HERE Europe B.V. → XYZmaps contributors"
echo "  Repository: heremaps/xyz-maps → xyzmaps/xyz-maps"
echo "  Version:    0.44.0 → 0.1.0"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Test build: bun run build-dev"
echo "  3. Commit: git add -A && git commit"
