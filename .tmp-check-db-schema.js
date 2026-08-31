const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: 'ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech',
    database: 'tutorial_prod',
    user: 'realtutorialhub_owner',
    password: 'YKvqQBUWEWHB',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Get columns
    const columns = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        ordinal_position
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'tutorial_sections' 
      ORDER BY ordinal_position
    `);

    console.log('=== COLUMNS ===');
    console.log(JSON.stringify(columns.rows, null, 2));

    // Get indexes
    const indexes = await client.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'tutorial_sections'
      ORDER BY indexname
    `);

    console.log('\n=== INDEXES ===');
    console.log(JSON.stringify(indexes.rows, null, 2));

    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
