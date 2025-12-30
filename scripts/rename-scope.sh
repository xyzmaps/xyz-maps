#!/usr/bin/env bash
# Script to rename npm package scope from @here to @xyzmaps

set -e

echo "🔄 Renaming npm package scope from @here to @xyzmaps..."
echo ""

# Step 1: Update all package.json files
echo "📦 Step 1/4: Updating package.json files..."

find . -name "package.json" -not -path "*/node_modules/*" | while read file; do
  echo "  ✓ $file"
  sed -i 's/@here\/xyz-maps/@xyzmaps\/xyz-maps/g' "$file"
done

echo ""

# Step 2: Update all TypeScript and JavaScript files
echo "📝 Step 2/4: Updating TypeScript/JavaScript imports..."

find . \( -name "*.ts" -o -name "*.js" \) -not -path "*/node_modules/*" -not -path "*/dist/*" | while read file; do
  if grep -q "@here/xyz-maps" "$file" 2>/dev/null; then
    sed -i 's/@here\/xyz-maps/@xyzmaps\/xyz-maps/g' "$file"
    echo "  ✓ $file"
  fi
done

echo ""

# Step 3: Update any JSON config files
echo "⚙️  Step 3/4: Updating config files..."

if [ -f "tsconfig.json" ]; then
  sed -i 's/@here\/xyz-maps/@xyzmaps\/xyz-maps/g' "tsconfig.json"
  echo "  ✓ tsconfig.json"
fi

echo ""

# Step 4: Run bun install to update lockfile
echo "🔒 Step 4/4: Updating bun.lock..."
bun install

echo ""
echo "✅ Done! Package scope renamed from @here to @xyzmaps"
echo ""
echo "📋 Summary of changes:"
echo "  - @here/xyz-maps        → @xyzmaps/xyz-maps"
echo "  - @here/xyz-maps-common → @xyzmaps/xyz-maps-common"
echo "  - @here/xyz-maps-core   → @xyzmaps/xyz-maps-core"
echo "  - @here/xyz-maps-display → @xyzmaps/xyz-maps-display"
echo "  - @here/xyz-maps-editor → @xyzmaps/xyz-maps-editor"
echo ""
echo "⚠️  Before publishing, remember to:"
echo "  1. Update your npm registry settings"
echo "  2. Ensure you have publish rights to @xyzmaps scope"
echo "  3. Run 'bun run build-release' to test the build"
echo "  4. Update any external documentation"
