const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
}

async function verify() {
    console.log('📡 Attempting to connect to Neon via HTTP...');
    const sql = neon(DATABASE_URL);

    try {
        console.log('[INFO] Starting Migration Verification (HTTP Mode)...');

        // 1. Table existence
        const tableResArray = await sql`select to_regclass('public.idempotency_keys') as idempotency_keys_table;`;
        const tableRes = tableResArray[0];
        console.log('1. Table "idempotency_keys":', tableRes.idempotency_keys_table ? '[OK] EXISTS' : '[FAIL] MISSING');

        // 2. Column existence
        const columnRes = await sql`
      select column_name
      from information_schema.columns
      where table_name='exams' and column_name='duration_seconds';
    `;
        console.log('2. Column "exams.duration_seconds":', columnRes.length > 0 ? '[OK] EXISTS' : '[FAIL] MISSING');

        // 3. Indexes existence
        const indexRes = await sql`
      select indexname
      from pg_indexes
      where tablename in ('exam_questions','idempotency_keys')
        and indexname in ('unq_exam_question','unq_exam_order','unq_user_key');
    `;

        const foundIndexes = indexRes.map(r => r.indexname);
        const expectedIndexes = ['unq_exam_question', 'unq_exam_order', 'unq_user_key'];

        console.log('3. Unique Indexes:');
        expectedIndexes.forEach(idx => {
            console.log(`   - ${idx}: ${foundIndexes.includes(idx) ? '[OK] EXISTS' : '[FAIL] MISSING'}`);
        });

        // 4. Drizzle Journal check (Corrected)
        console.log('\n4. Drizzle Registry Check:');
        try {
            // Check if table exists first preventing crash if missing
            const tableCheck = await sql`SELECT to_regclass('drizzle.__drizzle_migrations') as reg;`;
            if (!tableCheck[0].reg) {
                console.log('   - Table "drizzle.__drizzle_migrations": [FAIL] MISSING');
            } else {
                const countRes = await sql`SELECT COUNT(*) AS count FROM drizzle.__drizzle_migrations`;
                console.log('   - Row Count:', countRes[0].count);

                const rowsRes = await sql`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5`;
                if (rowsRes.length > 0) {
                    console.log('   - Latest rows:');
                    rowsRes.forEach(r => console.log(`     [${r.id}] ${r.created_at} | ${r.hash}`));
                } else {
                    console.log('   - No migrations recorded.');
                }
            }
        } catch (e) {
            console.log('   - Error querying registry:', e.message);
        }

    } catch (error) {
        console.error('[ERROR] VERIFICATION FAILED:');
        console.error(error);
    } finally {
        process.exit(0);
    }
}

verify();
