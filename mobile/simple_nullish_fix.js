const fs = require('fs');

// Simple and safe patterns to convert || to ??
const simplePatterns = [
  // Most common safe patterns
  { from: /(\w+\.\w+) \|\| ''/g, to: "$1 ?? ''" },
  { from: /(\w+\.\w+) \|\| null/g, to: "$1 ?? null" },
  { from: /(\w+\.\w+) \|\| undefined/g, to: "$1 ?? undefined" },
  { from: /(\w+\.\w+) \|\| 'Unknown'/g, to: "$1 ?? 'Unknown'" },
  { from: /(\w+\.\w+) \|\| 'Unnamed Pet'/g, to: "$1 ?? 'Unnamed Pet'" },
  { from: /(\w+\.\w+) \|\| 'Unknown species'/g, to: "$1 ?? 'Unknown species'" },
  { from: /(\w+\.\w+) \|\| 'Pet Details'/g, to: "$1 ?? 'Pet Details'" },
  { from: /(\w+\.\w+) \|\| 'dog'/g, to: "$1 ?? 'dog'" },
  { from: /(\w+\.\w+) \|\| 'lbs'/g, to: "$1 ?? 'lbs'" },
  { from: /(\w+\.\w+) \|\| 'inches'/g, to: "$1 ?? 'inches'" },
];

const files = [
  'app/onboarding/health-profile.tsx',
  'app/onboarding/official-records.tsx', 
  'app/onboarding/personality-care.tsx',
  'app/onboarding/physical-details.tsx',
  'app/sharing/pet-detail/[id].tsx',
  'app/sharing/shared-pets.tsx',
  'app/onboarding/review-complete.tsx',
];

let totalChanges = 0;

for (const filePath of files) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileChanges = 0;
    
    for (const { from, to } of simplePatterns) {
      const before = content;
      content = content.replace(from, to);
      if (content !== before) {
        fileChanges++;
      }
    }
    
    if (fileChanges > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filePath}: ${fileChanges} changes`);
      totalChanges += fileChanges;
    }
  }
}

console.log(`✨ Total changes: ${totalChanges}`);