/**
 * Fix PostgreSQL SSL Warnings
 * ============================
 * Generates updated DATABASE_URL strings with sslmode=verify-full
 * to prevent future pg library semantic changes
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function updateSslMode(connectionString: string | undefined): string | null {
  if (!connectionString) return null;
  
  // Replace sslmode=require with sslmode=verify-full
  if (connectionString.includes('sslmode=require')) {
    return connectionString.replace('sslmode=require', 'sslmode=verify-full');
  }
  
  // Add sslmode=verify-full if not present
  if (!connectionString.includes('sslmode=')) {
    const separator = connectionString.includes('?') ? '&' : '?';
    return `${connectionString}${separator}sslmode=verify-full`;
  }
  
  return connectionString;
}

function fixSslWarnings() {
  console.log('\n================================================================');
  console.log('     POSTGRESQL SSL MODE FIX');
  console.log('     Upgrade to sslmode=verify-full');
  console.log('================================================================\n');

  console.log('Current Issue:');
  console.log('  PostgreSQL warns that sslmode=require will have weaker');
  console.log('  security semantics in pg v9.0.0+');
  console.log('');
  console.log('Solution:');
  console.log('  Change sslmode=require to sslmode=verify-full');
  console.log('');
  console.log('================================================================');
  console.log('     UPDATED CONNECTION STRINGS');
  console.log('================================================================\n');

  const dbVars = [
    'DATABASE_URL',
    'DATABASE_DIRECT_URL',
    'DATABASE_URL_RTH',
    'DATABASE_DIRECT_URL_RTH',
    'DATABASE_URL_SKILLUP',
    'DATABASE_DIRECT_URL_SKILLUP',
    'DATABASE_URL_TUTORIAL',
    'DATABASE_URL_PEOPLE',
    'DATABASE_DIRECT_URL_PEOPLE',
    'DATABASE_URL_PAYMENT',
  ];

  let hasChanges = false;

  dbVars.forEach(varName => {
    const original = process.env[varName];
    if (original) {
      const updated = updateSslMode(original);
      if (updated && updated !== original) {
        console.log(`# ${varName}`);
        console.log(`${varName}="${updated}"`);
        console.log('');
        hasChanges = true;
      }
    }
  });

  if (!hasChanges) {
    console.log('[PASS] All database URLs already use sslmode=verify-full');
    console.log('       or have appropriate SSL configuration');
    console.log('');
  } else {
    console.log('================================================================');
    console.log('     INSTRUCTIONS');
    console.log('================================================================\n');
    console.log('1. Copy the updated connection strings above');
    console.log('2. Replace the corresponding lines in .env.local');
    console.log('3. Restart any running services');
    console.log('4. SSL warnings will be eliminated');
    console.log('');
  }

  console.log('================================================================\n');
}

fixSslWarnings();
