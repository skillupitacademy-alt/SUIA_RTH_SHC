#!/usr/bin/env node
/**
 * PEOPLE DATABASE INVESTIGATION
 * 
 * Verify DATABASE_URL_PEOPLE connection and schema
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const TEST_USER_IDS = [
  'b438fb19-fa32-4df4-93b4-91837a5a15ef',
  'afc355ca-6bae-4165-89dd-198494a62f85',
  '54726a2e-fca5-4d93-abc6-e7cee97a86f8'
];

async function main() {
  console.log('================================================================');
  console.log('PEOPLE DATABASE INVESTIGATION');
  console.log('================================================================\n');

  // Check environment variable
  const dbUrl = process.env.DATABASE_URL_PEOPLE;
  
  console.log('1. ENVIRONMENT VARIABLE');
  console.log('----------------------------------------------------------------\n');
  
  if (!dbUrl) {
    console.log('❌ DATABASE_URL_PEOPLE not found in environment');
    console.log('   Set in .env.local or environment\n');
    process.exit(1);
  }
  
  // Parse connection string to show database name (hide password)
  const urlParts = dbUrl.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
  if (urlParts) {
    const [, user, , host, database] = urlParts;
    console.log('✅ DATABASE_URL_PEOPLE configured');
    console.log(`   User: ${user}`);
    console.log(`   Host: ${host}`);
    console.log(`   Database: ${database.split('?')[0]}`);
  } else {
    console.log('⚠️  DATABASE_URL_PEOPLE format unclear');
    console.log(`   Value length: ${dbUrl.length} chars`);
  }
  console.log('');

  const pool = new Pool({ connectionString: dbUrl });

  try {
    // Test connection
    console.log('2. CONNECTION TEST');
    console.log('----------------------------------------------------------------\n');
    
    await pool.query('SELECT 1 as test');
    console.log('✅ Connection successful\n');

    // List all tables
    console.log('3. DATABASE TABLES');
    console.log('----------------------------------------------------------------\n');
    
    const tablesResult = await pool.query(`
      SELECT table_name, table_schema
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);

    console.log(`Found ${tablesResult.rows.length} table(s):\n`);
    
    const schemas = {};
    tablesResult.rows.forEach(row => {
      if (!schemas[row.table_schema]) {
        schemas[row.table_schema] = [];
      }
      schemas[row.table_schema].push(row.table_name);
    });

    Object.keys(schemas).forEach(schema => {
      console.log(`Schema: ${schema}`);
      schemas[schema].forEach(table => {
        console.log(`  - ${table}`);
      });
      console.log('');
    });

    // Check for 'users' table
    console.log('4. USERS TABLE VERIFICATION');
    console.log('----------------------------------------------------------------\n');

    const usersTables = tablesResult.rows.filter(r => 
      r.table_name.toLowerCase().includes('user')
    );

    if (usersTables.length === 0) {
      console.log('❌ No tables with "user" in name found');
      console.log('   Available tables listed above\n');
    } else {
      console.log(`Found ${usersTables.length} user-related table(s):\n`);
      
      for (const table of usersTables) {
        const fullTableName = table.table_schema === 'public' 
          ? table.table_name 
          : `${table.table_schema}.${table.table_name}`;
          
        console.log(`Table: ${fullTableName}`);

        // Get columns
        const columnsResult = await pool.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = $1
            AND table_name = $2
          ORDER BY ordinal_position
        `, [table.table_schema, table.table_name]);

        console.log(`  Columns (${columnsResult.rows.length}):`);
        columnsResult.rows.slice(0, 10).forEach(col => {
          console.log(`    ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        });
        
        if (columnsResult.rows.length > 10) {
          console.log(`    ... and ${columnsResult.rows.length - 10} more`);
        }

        // Check if 'id' column exists
        const hasIdColumn = columnsResult.rows.some(c => c.column_name === 'id');
        
        if (hasIdColumn) {
          // Try to query with test UUIDs
          console.log(`\n  Testing with known user IDs...`);
          
          try {
            const testResult = await pool.query(
              `SELECT id FROM ${fullTableName} WHERE id = ANY($1::uuid[])`,
              [TEST_USER_IDS]
            );

            if (testResult.rows.length > 0) {
              console.log(`  ✅ Found ${testResult.rows.length} matching user(s)`);
              testResult.rows.forEach(row => {
                console.log(`     ${row.id}`);
              });
            } else {
              console.log(`  ⚠️  None of the test user IDs found in this table`);
            }
          } catch (err) {
            console.log(`  ⚠️  Error querying: ${err.message}`);
          }
        } else {
          console.log(`  ⚠️  No 'id' column found`);
        }
        
        console.log('');
      }
    }

    // Try direct query on 'users' table if it exists
    console.log('5. DIRECT USERS TABLE QUERY');
    console.log('----------------------------------------------------------------\n');

    const hasPublicUsers = tablesResult.rows.some(r => 
      r.table_schema === 'public' && r.table_name === 'users'
    );

    if (hasPublicUsers) {
      console.log('Testing query: SELECT id, email, name FROM users WHERE id = $1\n');

      for (const userId of TEST_USER_IDS) {
        try {
          const result = await pool.query(
            'SELECT id, email, name FROM users WHERE id = $1',
            [userId]
          );

          if (result.rows.length > 0) {
            console.log(`✅ User ${userId.substring(0, 8)}... FOUND`);
            console.log(`   Email: ${result.rows[0].email}`);
            console.log(`   Name: ${result.rows[0].name}`);
          } else {
            console.log(`❌ User ${userId.substring(0, 8)}... NOT FOUND`);
          }
        } catch (err) {
          console.log(`⚠️  User ${userId.substring(0, 8)}... ERROR: ${err.message}`);
        }
        console.log('');
      }
    } else {
      console.log('⚠️  No public.users table found');
      console.log('   Check table list above for correct table name\n');
    }

    // Check row counts
    console.log('6. ROW COUNTS');
    console.log('----------------------------------------------------------------\n');

    for (const table of usersTables) {
      const fullTableName = table.table_schema === 'public' 
        ? table.table_name 
        : `${table.table_schema}.${table.table_name}`;

      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${fullTableName}`);
        console.log(`${fullTableName}: ${countResult.rows[0].count} row(s)`);
      } catch (err) {
        console.log(`${fullTableName}: ERROR - ${err.message}`);
      }
    }
    console.log('');

  } catch (err) {
    console.error('❌ Database error:', err.message);
    console.error('   Stack:', err.stack);
  } finally {
    await pool.end();
  }

  console.log('================================================================');
  console.log('INVESTIGATION COMPLETE');
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('INVESTIGATION ERROR:', err);
  process.exit(1);
});
