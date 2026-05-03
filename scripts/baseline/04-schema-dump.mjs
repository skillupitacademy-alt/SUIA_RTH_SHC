import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const execAsync = promisify(exec);

async function dumpSchema(dbName, connectionString) {
  const pool = new Pool({ connectionString });
  
  try {
    console.log(`\n📦 Dumping ${dbName} schema...`);
    
    // Get all CREATE statements
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    let schemaDump = `-- =====================================================\n`;
    schemaDump += `-- ${dbName.toUpperCase()} PRODUCTION SCHEMA BASELINE\n`;
    schemaDump += `-- Generated: ${new Date().toISOString()}\n`;
    schemaDump += `-- =====================================================\n\n`;
    
    // Enums
    const enums = await pool.query(`
      SELECT 
        t.typname as enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typtype = 'e'
      GROUP BY t.typname
      ORDER BY t.typname
    `);
    
    schemaDump += `-- ENUMS (${enums.rows.length})\n`;
    schemaDump += `-- =====================================================\n\n`;
    
    for (const enumRow of enums.rows) {
      schemaDump += `CREATE TYPE ${enumRow.enum_name} AS ENUM (\n`;
      schemaDump += enumRow.values.map(v => `  '${v}'`).join(',\n');
      schemaDump += `\n);\n\n`;
    }
    
    // Tables
    schemaDump += `\n-- TABLES (${tables.rows.length})\n`;
    schemaDump += `-- =====================================================\n\n`;
    
    for (const table of tables.rows) {
      const columns = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      schemaDump += `CREATE TABLE ${table.table_name} (\n`;
      schemaDump += columns.rows.map(col => {
        let line = `  ${col.column_name} ${col.data_type}`;
        if (col.is_nullable === 'NO') line += ' NOT NULL';
        if (col.column_default) line += ` DEFAULT ${col.column_default}`;
        return line;
      }).join(',\n');
      schemaDump += `\n);\n\n`;
    }
    
    // Indexes
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    schemaDump += `\n-- INDEXES (${indexes.rows.length})\n`;
    schemaDump += `-- =====================================================\n\n`;
    
    for (const idx of indexes.rows) {
      schemaDump += `${idx.indexdef};\n`;
    }
    
    // Save
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpPath = `scripts/baseline/schema-dumps/${dbName}-schema-${timestamp}.sql`;
    fs.mkdirSync('scripts/baseline/schema-dumps', { recursive: true });
    fs.writeFileSync(dumpPath, schemaDump);
    
    console.log(`   ✅ Schema dumped: ${dumpPath}`);
    
    return dumpPath;
    
  } finally {
    await pool.end();
  }
}

async function generateAllDumps() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  PRODUCTION SCHEMA DUMPS                                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const dumps = {};
  
  dumps.tutorial = await dumpSchema('tutorial_prod', process.env.DATABASE_URL_TUTORIAL);
  dumps.people = await dumpSchema('people_prod', process.env.DATABASE_URL_PEOPLE);
  dumps.rth = await dumpSchema('rth_prod', process.env.DATABASE_URL_RTH);
  dumps.skillup = await dumpSchema('skillup_prod', process.env.DATABASE_URL_SKILLUP);
  dumps.payment = await dumpSchema('payment_prod', process.env.DATABASE_URL_PAYMENT);
  dumps.placement = await dumpSchema('placement_prod', process.env.DATABASE_URL_PLACEMENT);
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  ALL SCHEMA DUMPS COMPLETE                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  return dumps;
}

generateAllDumps().catch(console.error);
