#!/usr/bin/env node
/**
 * TutorialDB Connection Diagnostic
 * 
 * READ-ONLY smoke test for TutorialDB connectivity
 * Tests the exact same database client configuration used by the web apps
 */

import { getTutorialDb } from '@quiz/db-tutorial';
import { tutorialDomains } from '@quiz/db-tutorial/schema';
import { isNull } from 'drizzle-orm';

const appName = process.argv[2] || 'diagnostic';

console.log(`\n=== TutorialDB Connection Diagnostic: ${appName} ===\n`);

// Display environment metadata (safe)
console.log('Environment Check:');
console.log(`  DATABASE_URL_TUTORIAL: ${process.env.DATABASE_URL_TUTORIAL ? 'SET' : 'NOT SET'}`);
if (process.env.DATABASE_URL_TUTORIAL) {
  const match = process.env.DATABASE_URL_TUTORIAL.match(/postgresql:\/\/[^@]+@([^/]+)\/([^\?]+)/);
  if (match) {
    console.log(`  Host: ${match[1]}`);
    console.log(`  Database: ${match[2]}`);
  }
}
console.log('');

try {
  console.log('Test 1: Get TutorialDB client instance');
  const db = getTutorialDb();
  console.log('  ✅ Client instance created\n');

  console.log('Test 2: SELECT 1 (basic connectivity)');
  const result1 = await db.execute('SELECT 1 as test');
  console.log(`  ✅ Result: ${JSON.stringify(result1.rows[0])}\n`);

  console.log('Test 3: SELECT current_database()');
  const result2 = await db.execute('SELECT current_database()');
  console.log(`  ✅ Database: ${result2.rows[0].current_database}\n`);

  console.log('Test 4: SELECT current_schema()');
  const result3 = await db.execute('SELECT current_schema()');
  console.log(`  ✅ Schema: ${result3.rows[0].current_schema}\n`);

  console.log('Test 5: SELECT COUNT(*) FROM tutorial_domains');
  const result4 = await db.execute('SELECT COUNT(*) FROM tutorial_domains');
  console.log(`  ✅ Count: ${result4.rows[0].count} domains\n`);

  console.log('Test 6: Application query (tutorial_domains WHERE deleted_at IS NULL)');
  const domainRows = await db
    .select()
    .from(tutorialDomains)
    .where(isNull(tutorialDomains.deletedAt));
  
  console.log(`  ✅ Result: ${domainRows.length} active domains`);
  
  if (domainRows.length > 0) {
    console.log('  Sample domains:');
    domainRows.slice(0, 3).forEach(d => {
      console.log(`    - ${d.slug} (${d.name})`);
    });
  }
  console.log('');

  console.log('🟢 ALL TESTS PASSED\n');
  process.exit(0);

} catch (error) {
  console.error('🔴 DATABASE FAILURE\n');
  console.error('Error Details:');
  console.error(`  Name: ${error.name}`);
  console.error(`  Message: ${error.message}`);
  
  if (error.code) {
    console.error(`  Code: ${error.code}`);
  }
  
  if (error.cause) {
    console.error(`  Cause: ${error.cause}`);
  }
  
  console.error('\nStack trace (first 5 lines):');
  const stackLines = error.stack?.split('\n').slice(0, 5) || [];
  stackLines.forEach(line => console.error(`  ${line}`));
  
  console.error('');
  process.exit(1);
}
