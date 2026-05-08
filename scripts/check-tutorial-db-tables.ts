import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_DIRECT_URL_TUTORIAL || '');

async function checkDatabaseTables() {
  console.log('🔍 Checking Tutorial Database Tables...\n');
  
  try {
    // Get all tables in the public schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log(`✅ Found ${tables.length} tables in tutorial database:\n`);
    
    // Group tables by category
    const sectionTables: string[] = [];
    const progressTables: string[] = [];
    const contentTables: string[] = [];
    const aiTables: string[] = [];
    const analyticsTables: string[] = [];
    const otherTables: string[] = [];
    
    tables.forEach((row: any) => {
      const tableName = row.table_name;
      
      if (tableName.includes('section') || tableName.includes('subsection')) {
        sectionTables.push(tableName);
      } else if (tableName.includes('progress') || tableName.includes('submission')) {
        progressTables.push(tableName);
      } else if (tableName.includes('content') || tableName.includes('tutorial_')) {
        contentTables.push(tableName);
      } else if (tableName.includes('ai_') || tableName.includes('generation') || tableName.includes('prompt')) {
        aiTables.push(tableName);
      } else if (tableName.includes('analytics')) {
        analyticsTables.push(tableName);
      } else {
        otherTables.push(tableName);
      }
    });
    
    console.log('📦 SECTION & CONTENT TABLES:');
    sectionTables.forEach(t => console.log(`   - ${t}`));
    
    console.log('\n📊 PROGRESS & TRACKING TABLES:');
    progressTables.forEach(t => console.log(`   - ${t}`));
    
    console.log('\n📝 CONTENT TABLES:');
    contentTables.forEach(t => console.log(`   - ${t}`));
    
    console.log('\n🤖 AI & GENERATION TABLES:');
    aiTables.forEach(t => console.log(`   - ${t}`));
    
    console.log('\n📈 ANALYTICS TABLES:');
    analyticsTables.forEach(t => console.log(`   - ${t}`));
    
    console.log('\n🔧 OTHER TABLES:');
    otherTables.forEach(t => console.log(`   - ${t}`));
    
    // Check if tutorial_sections table exists and has data
    console.log('\n\n🔍 Checking tutorial_sections table...');
    const sectionsCheck = await sql`
      SELECT COUNT(*) as count FROM tutorial_sections;
    `;
    console.log(`   Total sections in database: ${sectionsCheck[0].count}`);
    
    // Check section types distribution
    const sectionTypes = await sql`
      SELECT section_type, COUNT(*) as count 
      FROM tutorial_sections 
      GROUP BY section_type 
      ORDER BY section_type;
    `;
    
    if (sectionTypes.length > 0) {
      console.log('\n   Section types distribution:');
      sectionTypes.forEach((row: any) => {
        console.log(`   - ${row.section_type}: ${row.count} sections`);
      });
    }
    
    // Check if there are any user interaction tracking tables
    console.log('\n\n🔍 Checking for user interaction tracking tables...');
    const interactionTables = tables.filter((row: any) => 
      row.table_name.includes('answer') || 
      row.table_name.includes('interaction') ||
      row.table_name.includes('quiz') ||
      row.table_name.includes('practice')
    );
    
    if (interactionTables.length > 0) {
      console.log('   Found interaction tracking tables:');
      interactionTables.forEach((row: any) => console.log(`   - ${row.table_name}`));
    } else {
      console.log('   ❌ No user interaction tracking tables found');
    }
    
  } catch (error) {
    console.error('❌ Error querying database:', error);
  }
}

checkDatabaseTables();
