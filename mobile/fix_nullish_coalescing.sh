#!/bin/bash

# Fix nullish coalescing operators across the codebase
# Replace || with ?? where appropriate for safer operations

echo "Starting nullish coalescing fixes..."

# Find all TypeScript/TSX files and fix common patterns
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | while read -r file; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Common patterns that should use nullish coalescing
    # Profile/data fields with fallback values
    sed -i 's/profile\.\([a-zA-Z_][a-zA-Z0-9_]*\) || \('\''[^'\'']*'\''\|"[^"]*"\|null\|undefined\|{}\|\[\]\)/profile.\1 ?? \2/g' "$file"
    sed -i 's/data\.\([a-zA-Z_][a-zA-Z0-9_]*\) || \('\''[^'\'']*'\''\|"[^"]*"\|null\|undefined\|{}\|\[\]\)/data.\1 ?? \2/g' "$file"
    sed -i 's/config\.\([a-zA-Z_][a-zA-Z0-9_]*\) || \('\''[^'\'']*'\''\|"[^"]*"\|null\|undefined\|{}\|\[\]\)/config.\1 ?? \2/g' "$file"
    sed -i 's/props\.\([a-zA-Z_][a-zA-Z0-9_]*\) || \('\''[^'\'']*'\''\|"[^"]*"\|null\|undefined\|{}\|\[\]\)/props.\1 ?? \2/g' "$file"
    sed -i 's/state\.\([a-zA-Z_][a-zA-Z0-9_]*\) || \('\''[^'\'']*'\''\|"[^"]*"\|null\|undefined\|{}\|\[\]\)/state.\1 ?? \2/g' "$file"
    sed -i 's/user\.\([a-zA-Z_][a-zA-Z0-9_]*\) || \('\''[^'\'']*'\''\|"[^"]*"\|null\|undefined\|{}\|\[\]\)/user.\1 ?? \2/g' "$file"
    sed -i 's/pet\.\([a-zA-Z_][a-zA-Z0-9_]*\) || \('\''[^'\'']*'\''\|"[^"]*"\|null\|undefined\|{}\|\[\]\)/pet.\1 ?? \2/g' "$file"
    
    # Simple variable fallbacks
    sed -i 's/\([a-zA-Z_][a-zA-Z0-9_]*\) || \('\''[^'\'']*'\''\|"[^"]*"\|null\|undefined\)/\1 ?? \2/g' "$file"
    
    # Array access with fallback
    sed -i 's/\[\([^]]*\)\] || \(null\|undefined\|\[\]\)/[\1] ?? \2/g' "$file"
  fi
done

echo "Nullish coalescing fixes completed!"