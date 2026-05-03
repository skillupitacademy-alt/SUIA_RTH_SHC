#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL_TUTORIAL);

const sections = await sql`SELECT COUNT(*) as count FROM tutorial_sections`;
console.log(`Found ${sections[0].count} existing sections`);

if (sections[0].count > 0) {
  await sql`DELETE FROM tutorial_sections`;
  console.log('✅ Deleted all sections for fresh pilot');
} else {
  console.log('✅ No sections to clean up');
}
