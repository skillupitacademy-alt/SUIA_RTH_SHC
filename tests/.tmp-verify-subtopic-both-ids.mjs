#!/usr/bin/env node
import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('\n=== SUBTOPIC ID CONTRACT VERIFICATION ===\n');

try {
  // Verify both IDs work
  console.log('Testing lookup by INTERNAL ID (414f63eb...):\n');
  const byInternalId = await pool.query(
    "SELECT id, external_id, slug FROM tutorial_subtopics WHERE id = $1",
    ['414f63eb-cccf-4bd1-bcc0-b52df69ce499']
  );
  
  if (byInternalId.rows.length > 0) {
    console.log('✓ FOUND by internal ID:');
    console.log('  id:', byInternalId.rows[0].id);
    console.log('  external_id:', byInternalId.rows[0].external_id);
    console.log('  slug:', byInternalId.rows[0].slug);
  } else {
    console.log('✗ NOT FOUND by internal ID');
  }
  
  console.log('\nTesting lookup by EXTERNAL ID (12efacf1...):\n');
  const byExternalId = await pool.query(
    "SELECT id, external_id, slug FROM tutorial_subtopics WHERE external_id = $1",
    ['12efacf1-b5ad-4b43-9fe4-17ba1cf249e4']
  );
  
  if (byExternalId.rows.length > 0) {
    console.log('✓ FOUND by external ID:');
    console.log('  id:', byExternalId.rows[0].id);
    console.log('  external_id:', byExternalId.rows[0].external_id);
    console.log('  slug:', byExternalId.rows[0].slug);
  } else {
    console.log('✗ NOT FOUND by external ID');
  }
  
  console.log('\n=== DATABASE CONNECTION INFO ===\n');
  const dbInfo = await pool.query('SELECT current_database(), current_schema()');
  console.log('Current Database:', dbInfo.rows[0].current_database);
  console.log('Current Schema:', dbInfo.rows[0].current_schema);
  
} catch (error) {
  console.error('ERROR:', error.message);
} finally {
  await pool.end();
}
