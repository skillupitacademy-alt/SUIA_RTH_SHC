/**
 * Verify whether uq_tutorial_v2_identity is a CONSTRAINT or INDEX
 */
import { db } from '../packages/db-tutorial/src/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Checking database object type for uq_tutorial_v2_identity...\n');

  // Check if it's a constraint
  const constraintCheck = await db.execute(sql`
    SELECT 
      conname AS name,
      contype AS type,
      pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = 'tutorial_sections'::regclass
      AND conname = 'uq_tutorial_v2_identity'
  `);

  // Check if it's an index
  const indexCheck = await db.execute(sql`
    SELECT 
      indexname AS name,
      indexdef AS definition
    FROM pg_indexes
    WHERE tablename = 'tutorial_sections'
      AND indexname = 'uq_tutorial_v2_identity'
  `);

  if (constraintCheck.rows.length > 0) {
    console.log('✅ FOUND AS CONSTRAINT:');
    console.log(`   Name: ${constraintCheck.rows[0]?.name}`);
    console.log(`   Type: ${constraintCheck.rows[0]?.type}`);
    console.log(`   Definition: ${constraintCheck.rows[0]?.definition}`);
    console.log('\n   Migration must use: ALTER TABLE ... DROP CONSTRAINT');
  } else {
    console.log('❌ NOT FOUND AS CONSTRAINT');
  }

  console.log();

  if (indexCheck.rows.length > 0) {
    console.log('✅ FOUND AS INDEX:');
    console.log(`   Name: ${indexCheck.rows[0]?.name}`);
    console.log(`   Definition: ${indexCheck.rows[0]?.definition}`);
    console.log('\n   Migration must use: DROP INDEX');
  } else {
    console.log('❌ NOT FOUND AS INDEX');
  }

  console.log();
  console.log('Recommendation:');
  if (constraintCheck.rows.length > 0 && indexCheck.rows.length === 0) {
    console.log('   Use: ALTER TABLE tutorial_sections DROP CONSTRAINT uq_tutorial_v2_identity;');
  } else if (indexCheck.rows.length > 0 && constraintCheck.rows.length === 0) {
    console.log('   Use: DROP INDEX uq_tutorial_v2_identity;');
  } else if (constraintCheck.rows.length > 0 && indexCheck.rows.length > 0) {
    console.log('   WARNING: Found both constraint AND index with same name!');
  } else {
    console.log('   Object not found in database.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
