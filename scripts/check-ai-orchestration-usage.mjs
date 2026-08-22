#!/usr/bin/env node
/**
 * Check if ai_generation_orchestration table has any data
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';

config({ path: resolve(process.cwd(), '.env.local') });

const tutorialSql = neon(process.env.DATABASE_URL_TUTORIAL);

try {
  const count = await tutorialSql`
    SELECT COUNT(*) as count FROM ai_generation_orchestration
  `;
  
  console.log(`ai_generation_orchestration row count: ${count[0].count}`);
  
  if (count[0].count > 0) {
    const samples = await tutorialSql`
      SELECT id, subtopic_id, status, created_at 
      FROM ai_generation_orchestration 
      LIMIT 5
    `;
    console.log('\nSample rows:', samples);
  } else {
    console.log('\n✅ Table is EMPTY - likely legacy/unused');
  }
} catch (error) {
  console.error('Error:', error.message);
}
