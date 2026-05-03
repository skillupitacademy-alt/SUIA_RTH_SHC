import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_DIRECT_URL_TUTORIAL,
  });

  try {
    console.log('🔍 Checking for hardening tables...\n');

    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('layman_audit_logs', 'layman_prompt_history', 'layman_content_revisions')
      ORDER BY table_name;
    `);

    console.log(`Found ${result.rows.length} hardening tables:\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ No hardening tables found!');
      console.log('\nTables should be:');
      console.log('  - layman_audit_logs');
      console.log('  - layman_prompt_history');
      console.log('  - layman_content_revisions');
      process.exit(1);
    }

    result.rows.forEach((row) => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // Check enum type
    const enumResult = await pool.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typname = 'layman_audit_action';
    `);

    if (enumResult.rows.length > 0) {
      console.log(`  ✅ layman_audit_action (enum type)`);
    } else {
      console.log(`  ❌ layman_audit_action enum type not found`);
    }

    console.log('\n✅ All hardening tables verified!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying tables:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyTables();
