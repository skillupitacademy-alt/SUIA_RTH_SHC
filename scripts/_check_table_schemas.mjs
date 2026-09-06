#!/usr/bin/env node
/**
 * CHECK TABLE SCHEMAS
 * 
 * Get actual column definitions before writing queries
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

async function main() {
  const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });
  const peoplePool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('================================================================');
  console.log('TABLE SCHEMAS VERIFICATION');
  console.log('================================================================\n');

  // Check tutorial_navigation_progress schema
  console.log('TABLE: tutorial_navigation_progress');
  console.log('─'.repeat(80));
  
  const progressSchema = await tutorialPool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'tutorial_navigation_progress'
    ORDER BY ordinal_position
  `);

  progressSchema.rows.forEach(col => {
    console.log(`  ${col.column_name.padEnd(30, ' ')} ${col.data_type.padEnd(20, ' ')} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
  });

  console.log('\n');

  // Check schemas in people database
  console.log('SCHEMAS in People Database:');
  console.log('─'.repeat(80));
  
  const schemas = await peoplePool.query(`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    ORDER BY schema_name
  `);

  schemas.rows.forEach(s => {
    console.log(`  ${s.schema_name}`);
  });

  console.log('\n');

  // Check users table (find correct schema)
  console.log('FINDING users TABLE:');
  console.log('─'.repeat(80));
  
  const usersTables = await peoplePool.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_name = 'users'
    ORDER BY table_schema
  `);

  usersTables.rows.forEach(t => {
    console.log(`  ${t.table_schema}.${t.table_name}`);
  });

  console.log('\n');

  if (usersTables.rows.length > 0) {
    const schema = usersTables.rows[0].table_schema;
    console.log(`TABLE: ${schema}.users`);
    console.log('─'.repeat(80));
    
    const usersSchema = await peoplePool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = $1
        AND table_name = 'users'
      ORDER BY ordinal_position
      LIMIT 10
    `, [schema]);

    usersSchema.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(30, ' ')} ${col.data_type.padEnd(20, ' ')} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
  }

  console.log('\n');

  await tutorialPool.end();
  await peoplePool.end();
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
