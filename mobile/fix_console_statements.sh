#!/bin/bash

# Batch fix console statements across the codebase
# This script replaces console statements with logger calls

files_to_fix=(
  "src/services/ImageOptimizationService.ts"
  "src/utils/dataTransformers.ts"
  "src/utils/StartupOptimizer.ts"
  "app/(tabs)/dashboard.tsx"
  "app/onboarding/basic-info.tsx"
  "app/onboarding/review-complete.tsx"
  "app/sharing/pet-detail/[id].tsx"
  "app/sharing/shared-pets.tsx"
  "src/accessibility/EmergencyAccessibility.tsx"
  "src/accessibility/InnovativeAccessibility.tsx"
  "src/components/Auth/AuthGuard.tsx"
  "src/components/ErrorBoundary/AdvancedErrorBoundary.tsx"
)

for file in "${files_to_fix[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Add logger import if not present
    if ! grep -q "import.*log.*from.*Logger" "$file"; then
      # Find the last import statement and add logger import
      if grep -q "^import" "$file"; then
        # Get the line number of the last import
        last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        sed -i "${last_import_line}a\\import { log } from '../utils/Logger';" "$file" 2>/dev/null || \
        sed -i "${last_import_line}a\\import { log } from '../../utils/Logger';" "$file" 2>/dev/null || \
        sed -i "${last_import_line}a\\import { log } from '../../../utils/Logger';" "$file" 2>/dev/null
      fi
    fi
    
    # Replace console statements
    sed -i 's/console\.log(/log.debug(/g' "$file"
    sed -i 's/console\.error(/log.error(/g' "$file"
    sed -i 's/console\.warn(/log.warn(/g' "$file"
    sed -i 's/console\.info(/log.info(/g' "$file"
    
  fi
done

echo "Console statement replacement completed!"