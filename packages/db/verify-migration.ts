import { Pool } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function verify() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('🔍 Starting Migration Verification (Minimal Dependencies)...\n');

    // 1. Table existence
    const tableRes = await pool.query(`select to_regclass('public.idempotency_keys') as idempotency_keys_table;`);
    console.log('1. Table "idempotency_keys":', tableRes.rows[0].idempotency_keys_table ? '✅ EXISTS' : '❌ MISSING');

    // 2. Column existence
    const columnRes = await pool.query(`
      select column_name
      from information_schema.columns
      where table_name='exams' and column_name='duration_seconds';
    `);
    console.log('2. Column "exams.duration_seconds":', columnRes.rows.length > 0 ? '✅ EXISTS' : '❌ MISSING');

    // 3. Indexes existence
    const indexRes = await pool.query(`
      select indexname
      from pg_indexes
      where tablename in ('exam_questions','idempotency_keys')
        and indexname in ('unq_exam_question','unq_exam_order','unq_user_key');
    `);
    
    const foundIndexes = indexRes.rows.map(r => r.indexname);
    const expectedIndexes = ['unq_exam_question', 'unq_exam_order', 'unq_user_key'];
    
    console.log('3. Unique Indexes:');
    expectedIndexes.forEach(idx => {
      console.log(`   - ${idx}: ${foundIndexes.includes(idx) ? '✅ EXISTS' : '❌ MISSING'}`);
    });

    // 4. Drizzle Journal check
    try {
      const drizzleRes = await pool.query(`
        SELECT tag FROM "__drizzle_migrations" ORDER BY created_at DESC LIMIT 1;
      `);
      console.log('\n4. Latest Drizzle Migration:', drizzleRes.rows[0]?.tag || 'None');
    } catch (e) {
      console.log('\n4. Latest Drizzle Migration: [Unable to query __drizzle_migrations table]');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await pool.end();
  }
}

verify();
