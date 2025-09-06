#!/usr/bin/env node

/**
 * TailTracker Migration Runner
 * This script runs database migrations using direct SQL execution
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

console.log('🗄️  TailTracker Database Migration Runner');
console.log('=' .repeat(50));

// Create Supabase client - note: we need a service_role key for migrations
console.log('⚠️  Note: Migrations require service_role key, not anon key');
console.log('   Please run migrations through Supabase Dashboard SQL Editor');
console.log('   or provide SUPABASE_SERVICE_ROLE_KEY environment variable');

// const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found');
    return false;
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  console.log('\n📋 Found migrations:');
  migrationFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  
  console.log('\n📝 Migration contents (for manual execution):');
  console.log('=' .repeat(60));
  
  migrationFiles.forEach((file, index) => {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\n-- Migration ${index + 1}: ${file}`);
    console.log('-- ' + '=' .repeat(50));
    console.log(content);
    console.log('\n-- End of ' + file);
    console.log('-- ' + '=' .repeat(50));
  });
  
  return true;
}

async function showInstructions() {
  console.log('\n🔧 MANUAL MIGRATION INSTRUCTIONS');
  console.log('=' .repeat(50));
  console.log('1. Go to your Supabase project dashboard:');
  console.log(`   ${supabaseUrl.replace('/rest/v1', '')}`);
  console.log('');
  console.log('2. Navigate to SQL Editor');
  console.log('');
  console.log('3. Copy and execute each migration above in order:');
  console.log('   a. 20250903000001_create_tailtracker_schema.sql');
  console.log('   b. 20250903000002_setup_rls_policies.sql');
  console.log('   c. 20250903000003_setup_auth_triggers.sql');
  console.log('');
  console.log('4. After running all migrations, test with:');
  console.log('   node scripts/test-backend.js');
  console.log('');
  console.log('⚠️  IMPORTANT: Make sure to execute migrations in the exact order shown!');
}

async function createMigrationScript() {
  console.log('\n📝 Creating combined migration script...');
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const outputFile = path.join(__dirname, '..', 'combined-migrations.sql');
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  let combinedContent = `-- TailTracker Complete Database Setup
-- Generated: ${new Date().toISOString()}
-- Execute this entire script in Supabase SQL Editor

-- IMPORTANT: This script should be run with superuser privileges
-- Go to Supabase Dashboard > SQL Editor > New Query
-- Paste this entire content and click RUN

`;
  
  migrationFiles.forEach((file, index) => {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    combinedContent += `
-- ============================================================
-- MIGRATION ${index + 1}: ${file}
-- ============================================================

${content}

-- END OF ${file}
-- ============================================================

`;
  });
  
  combinedContent += `
-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

-- Verify installation
SELECT 'TailTracker database setup complete!' as message;

-- Check table counts
SELECT 
  'user_profiles' as table_name,
  count(*) as record_count
FROM user_profiles
UNION ALL
SELECT 
  'pets' as table_name,
  count(*) as record_count  
FROM pets
UNION ALL
SELECT
  'medical_records' as table_name,
  count(*) as record_count
FROM medical_records;
`;
  
  fs.writeFileSync(outputFile, combinedContent);
  console.log(`✅ Combined migration script created: combined-migrations.sql`);
  console.log('   Copy this file content to Supabase SQL Editor');
  
  return outputFile;
}

// Run the migration process
async function main() {
  try {
    await runMigrations();
    const scriptFile = await createMigrationScript();
    await showInstructions();
    
    console.log('\n🎯 QUICK START:');
    console.log(`   1. Open: ${scriptFile}`);
    console.log('   2. Copy all content');
    console.log('   3. Paste in Supabase SQL Editor');
    console.log('   4. Click RUN');
    console.log('   5. Run: node scripts/test-backend.js');
    
  } catch (err) {
    console.error('💥 Migration runner failed:', err);
    process.exit(1);
  }
}

main();