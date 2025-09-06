#!/bin/bash

# Fix import order errors for Logger imports
# Logger should come before other utils but after service imports

echo "Fixing import order errors..."

files_with_import_errors=(
  "src/accessibility/InnovativeAccessibility.tsx"
  "src/accessibility/EmergencyAccessibility.tsx" 
  "src/navigation/AppNavigator.tsx"
)

for file in "${files_with_import_errors[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Create temporary file
    tmp_file="${file}.tmp"
    
    # Extract all imports and sort Logger correctly
    grep "^import" "$file" > imports.tmp
    grep -v "^import" "$file" > code.tmp
    
    # Sort imports: React first, then libraries, then utils (with Logger first), then local
    (
      grep "import React" imports.tmp || true
      grep "import.*from 'react'" imports.tmp || true  
      grep "import.*from '@" imports.tmp || true
      grep "import.*from 'expo" imports.tmp || true
      grep "import.*from 'react-native" imports.tmp || true
      grep "import { log }" imports.tmp || true
      grep "import.*utils" imports.tmp | grep -v "Logger" || true
      grep "import.*from '\\.\\./.*" imports.tmp | grep -v "utils.*Logger" || true
      grep "import.*from '\\./.*" imports.tmp || true
    ) > sorted_imports.tmp
    
    # Combine sorted imports with code
    cat sorted_imports.tmp code.tmp > "$tmp_file"
    
    # Replace original file if different
    if ! cmp -s "$file" "$tmp_file"; then
      mv "$tmp_file" "$file"
      echo "✅ Fixed import order in $file"
    else
      rm "$tmp_file"
      echo "⚪ No changes needed in $file"
    fi
    
    # Cleanup
    rm -f imports.tmp code.tmp sorted_imports.tmp
  fi
done

echo "Import order fixes completed!"