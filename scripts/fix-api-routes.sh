#!/bin/bash
# Add `export const dynamic = 'force-dynamic'` to all API routes

echo "🔧 Fixing API routes to prevent static generation..."

count=0
for file in $(find app/api -name "route.ts" -type f); do
  # Check if file already has the export
  if ! grep -q "export const dynamic = 'force-dynamic'" "$file"; then
    # Find the first import line
    first_import_line=$(grep -n "^import" "$file" | head -1 | cut -d: -f1)

    if [ -n "$first_import_line" ]; then
      # Add the export after imports
      last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
      insert_line=$((last_import_line + 1))

      # Insert the dynamic export
      sed -i "${insert_line}i\\\\n// Force dynamic rendering (prevent static generation at build time)\\nexport const dynamic = 'force-dynamic'" "$file"

      count=$((count + 1))
      echo "✅ Fixed: $file"
    fi
  fi
done

echo ""
echo "✅ Fixed $count API route files"
echo "All API routes now use dynamic rendering"
