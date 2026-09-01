import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = postgres(process.env.DATABASE_URL_TUTORIAL);

try {
  // Find ALL tables with 'sidebar' in name
  const tables = await client`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%sidebar%'
    ORDER BY table_name
  `;
  
  console.log('=== SIDEBAR TABLES ===');
  console.log(JSON.stringify(tables, null, 2));
  
  // Also check for 'navigation' or 'tree' tables
  const navTables = await client`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (table_name LIKE '%navigation%' OR table_name LIKE '%tree%')
    ORDER BY table_name
  `;
  
  console.log('\n=== NAVIGATION/TREE TABLES ===');
  console.log(JSON.stringify(navTables, null, 2));
  
  // Check tutorial_sections structure (user hint: "block based")
  const sectionColumns = await client`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'tutorial_sections'
    ORDER BY ordinal_position
  `;
  
  console.log('\n=== tutorial_sections COLUMNS ===');
  console.log(JSON.stringify(sectionColumns, null, 2));
  
  // Check if there's sidebar data in tutorial_sections for Java tutorial
  const javaSections = await client`
    SELECT id, title, slug, content_type, metadata
    FROM tutorial_sections
    WHERE tutorial_subtopic_id = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'
    ORDER BY display_order
    LIMIT 5
  `;
  
  console.log('\n=== Java Tutorial Sections (first 5) ===');
  console.log(JSON.stringify(javaSections, null, 2));
  
  await client.end();
} catch (err) {
  console.error('Error:', err.message);
  await client.end();
  process.exit(1);
}
