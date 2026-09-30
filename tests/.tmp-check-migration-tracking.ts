import { Client } from 'pg';

const client = new Client({ 
  connectionString: process.env.DATABASE_URL_TUTORIAL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();

// Check if tracking table exists
const trackingCheck = await client.query(`
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = '__drizzle_migrations'
  ) as exists
`);

if (trackingCheck.rows[0].exists) {
  console.log('✅ Migration tracking table EXISTS\n');
  
  const migrations = await client.query(`
    SELECT id, hash, created_at 
    FROM __drizzle_migrations 
    ORDER BY created_at DESC 
    LIMIT 5
  `);
  
  console.log('Recent migrations:');
  migrations.rows.forEach(m => {
    console.log(`  ${m.id} - ${m.hash.substring(0, 16)}...`);
  });
  
  const migration22 = migrations.rows.find(m => m.hash.includes('0022') || m.id >= 22);
  if (migration22) {
    console.log(`\n✅ Migration 0022 recorded as executed`);
  } else {
    console.log(`\n⚠️  Could not definitively identify 0022 in tracking`);
  }
} else {
  console.log('⚠️  __drizzle_migrations table not found');
  console.log('Migration tracking may use different mechanism');
}

await client.end();
