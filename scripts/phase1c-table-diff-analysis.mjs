import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('\nTABLE DIFFERENCE ANALYSIS\n');

try {
  // Get database tables
  const dbTables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  const databaseSet = new Set(dbTables.rows.map(r => r.table_name));
  
  // Parse Drizzle schema files
  const schemaDir = 'packages/db-tutorial/src/schema';
  const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.ts') && !f.includes('.test.'));
  
  const drizzleSet = new Set();
  const drizzleTableFiles = {};
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(schemaDir, file), 'utf-8');
    const matches = content.matchAll(/export const (\w+) = pgTable\('([^']+)'/g);
    
    for (const match of matches) {
      const tableName = match[2];
      drizzleSet.add(tableName);
      drizzleTableFiles[tableName] = file;
    }
  }
  
  // Calculate differences
  const drizzleOnly = [...drizzleSet].filter(t => !databaseSet.has(t)).sort();
  const databaseOnly = [...databaseSet].filter(t => !drizzleSet.has(t)).sort();
  const common = [...drizzleSet].filter(t => databaseSet.has(t)).sort();
  
  console.log(`Drizzle source tables: ${drizzleSet.size}`);
  console.log(`Database tables: ${databaseSet.size}`);
  console.log(`Common tables: ${common.length}`);
  console.log(`Drizzle-only tables: ${drizzleOnly.length}`);
  console.log(`Database-only tables: ${databaseOnly.length}`);
  
  if (drizzleOnly.length > 0) {
    console.log(`\n📋 DRIZZLE-ONLY TABLES (${drizzleOnly.length}):\n`);
    drizzleOnly.forEach((table, i) => {
      console.log(`${String(i + 1).padStart(2)}. ${table}`);
      console.log(`    Source: ${drizzleTableFiles[table]}`);
    });
  }
  
  if (databaseOnly.length > 0) {
    console.log(`\n📋 DATABASE-ONLY TABLES (${databaseOnly.length}):\n`);
    databaseOnly.forEach((table, i) => {
      console.log(`${String(i + 1).padStart(2)}. ${table}`);
    });
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await pool.end();
}
