const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  console.log('=== SEARCHING FOR MIGRATION TRACKING ===\n');

  // Check for common migration tracking patterns
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.log(`Total public tables: ${tables.rows.length}\n`);

  const migrationTables = tables.rows.filter(r => 
    r.table_name.includes('migration') || 
    r.table_name.includes('drizzle') ||
    r.table_name.includes('schema') ||
    r.table_name.includes('_meta')
  );

  if (migrationTables.length > 0) {
    console.log('Migration-related tables found:');
    migrationTables.forEach(t => console.log(`  - ${t.table_name}`));
  } else {
    console.log('⚠️  No obvious migration tracking tables found');
    console.log('\nShowing all tables for reference:');
    tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
  }

  await client.end();
})().catch(e => {
  console.error('\n❌ Error:', e.message);
  process.exit(1);
});
