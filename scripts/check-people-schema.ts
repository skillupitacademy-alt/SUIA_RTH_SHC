#!/usr/bin/env tsx
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const DATABASE_URL = process.env.DATABASE_DIRECT_URL_PEOPLE || process.env.DATABASE_URL_PEOPLE || '';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL_PEOPLE not found');
  process.exit(1);
}

async function checkSchema() {
  const sql = neon(DATABASE_URL);
  
  console.log('\n🔍 Checking users table schema in people_db\n');
  
  try {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('Users table columns:\n');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      if (col.column_default) {
        console.log(`    Default: ${col.column_default}`);
      }
    });
    
    // Check for role enum
    console.log('\n🔍 Checking for role-related enums:\n');
    const enums = await sql`
      SELECT t.typname as enum_name, e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname LIKE '%role%'
      ORDER BY t.typname, e.enumsortorder;
    `;
    
    if (enums.length > 0) {
      const grouped = enums.reduce((acc: any, row: any) => {
        if (!acc[row.enum_name]) {
          acc[row.enum_name] = [];
        }
        acc[row.enum_name].push(row.enum_value);
        return acc;
      }, {});
      
      Object.entries(grouped).forEach(([name, values]) => {
        console.log(`  ${name}: ${(values as string[]).join(', ')}`);
      });
    } else {
      console.log('  No role-related enums found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSchema();
