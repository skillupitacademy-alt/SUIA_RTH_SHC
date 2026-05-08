#!/usr/bin/env tsx

/**
 * Check Multiple Subtopics Database Records
 * 
 * Compares tutorial_sections vs tutorial_content for multiple subtopics
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { 
  tutorialSubtopics, 
  tutorialSections, 
  tutorialContent 
} from '../packages/db-tutorial/src/index';

const DATABASE_URL = process.env.DATABASE_URL_TUTORIAL || process.env.DATABASE_URL || '';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL_TUTORIAL not configured');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

const SUBTOPICS_TO_CHECK = [
  'component-architecture',
  'whatisjavascript',
  'variable'
];

function section(title: string) {
  console.log('\n' + '='.repeat(100));
  console.log(`🔍 ${title}`);
  console.log('='.repeat(100));
}

function success(msg: string) {
  console.log(`✅ ${msg}`);
}

function fail(msg: string) {
  console.log(`❌ ${msg}`);
}

function info(msg: string) {
  console.log(`ℹ️  ${msg}`);
}

async function checkSubtopic(slug: string) {
  console.log(`\n${'─'.repeat(100)}`);
  console.log(`📍 CHECKING: ${slug}`);
  console.log('─'.repeat(100));
  
  try {
    // Check if subtopic exists
    const subtopicRecords = await db
      .select()
      .from(tutorialSubtopics)
      .where(eq(tutorialSubtopics.slug, slug));
    
    if (subtopicRecords.length === 0) {
      fail(`Subtopic "${slug}" NOT FOUND in database`);
      return {
        slug,
        exists: false,
        sectionsCount: 0,
        contentCount: 0,
      };
    }
    
    const subtopic = subtopicRecords[0];
    success(`Found: ${subtopic.name} (ID: ${subtopic.id})`);
    
    // Check tutorial_sections
    const sections = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.subtopicId, subtopic.id));
    
    const sectionsCount = sections.length;
    const sectionsDeployed = sections.filter(s => s.status === 'deployed' || s.status === 'approved').length;
    
    if (sectionsCount > 0) {
      success(`tutorial_sections: ${sectionsCount} records (${sectionsDeployed} deployed/approved)`);
      const types = sections.map(s => s.sectionType).join(', ');
      info(`  Types: ${types}`);
    } else {
      fail(`tutorial_sections: 0 records`);
    }
    
    // Check tutorial_content
    const content = await db
      .select()
      .from(tutorialContent)
      .where(
        and(
          eq(tutorialContent.subtopicId, subtopic.id),
          isNull(tutorialContent.deletedAt)
        )
      );
    
    const contentCount = content.length;
    const contentPublished = content.filter(c => c.isPublished === true).length;
    
    if (contentCount > 0) {
      success(`tutorial_content: ${contentCount} records (${contentPublished} published)`);
      const types = [...new Set(content.map(c => c.contentType))].join(', ');
      info(`  Types: ${types}`);
    } else {
      fail(`tutorial_content: 0 records`);
    }
    
    return {
      slug,
      name: subtopic.name,
      exists: true,
      sectionsCount,
      sectionsDeployed,
      contentCount,
      contentPublished,
    };
    
  } catch (error) {
    fail(`Error checking ${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      slug,
      exists: false,
      sectionsCount: 0,
      contentCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function main() {
  console.clear();
  
  section('DATABASE COMPARISON: SECTIONS vs CONTENT');
  info(`Database: ${DATABASE_URL.split('@')[1]?.split('/')[1] || 'tutorial_prod'}`);
  info(`Checking ${SUBTOPICS_TO_CHECK.length} subtopics`);
  
  try {
    // Test connection
    await sql`SELECT 1`;
    success('Database connection successful');
  } catch (error) {
    fail(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
  
  const results = [];
  
  for (const slug of SUBTOPICS_TO_CHECK) {
    const result = await checkSubtopic(slug);
    results.push(result);
  }
  
  // Summary table
  section('SUMMARY TABLE');
  
  console.log('\n┌─────────────────────────────┬──────────┬────────────────────┬────────────────────┐');
  console.log('│ Subtopic                    │ Exists   │ tutorial_sections  │ tutorial_content   │');
  console.log('├─────────────────────────────┼──────────┼────────────────────┼────────────────────┤');
  
  results.forEach(r => {
    const slugPadded = r.slug.padEnd(27);
    const existsIcon = r.exists ? '✅' : '❌';
    const sectionsInfo = r.sectionsCount > 0 
      ? `✅ ${r.sectionsCount} records`.padEnd(18)
      : '❌ 0 records'.padEnd(18);
    const contentInfo = r.contentCount > 0 
      ? `✅ ${r.contentCount} records`.padEnd(18)
      : '❌ 0 records'.padEnd(18);
    
    console.log(`│ ${slugPadded} │ ${existsIcon}      │ ${sectionsInfo} │ ${contentInfo} │`);
  });
  
  console.log('└─────────────────────────────┴──────────┴────────────────────┴────────────────────┘');
  
  // Analysis
  section('ANALYSIS');
  
  const withSections = results.filter(r => r.sectionsCount && r.sectionsCount > 0);
  const withContent = results.filter(r => r.contentCount && r.contentCount > 0);
  const withBoth = results.filter(r => r.sectionsCount && r.sectionsCount > 0 && r.contentCount && r.contentCount > 0);
  const withNeither = results.filter(r => (!r.sectionsCount || r.sectionsCount === 0) && (!r.contentCount || r.contentCount === 0));
  
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║ CONTENT SYSTEM COMPARISON                                                                    ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

Total Subtopics Checked: ${results.length}

MODULAR SYSTEM (tutorial_sections):
  - Subtopics with data: ${withSections.length}
  - Subtopics: ${withSections.map(r => r.slug).join(', ') || 'None'}

LEGACY SYSTEM (tutorial_content):
  - Subtopics with data: ${withContent.length}
  - Subtopics: ${withContent.map(r => r.slug).join(', ') || 'None'}

BOTH SYSTEMS:
  - Subtopics with data in both: ${withBoth.length}
  - Subtopics: ${withBoth.map(r => r.slug).join(', ') || 'None'}

NO DATA:
  - Subtopics with no data: ${withNeither.length}
  - Subtopics: ${withNeither.map(r => r.slug).join(', ') || 'None'}

CONCLUSION:
${withSections.length > 0 && withContent.length === 0 ? `
✅ Your platform uses the MODULAR SYSTEM (tutorial_sections) exclusively.
   The legacy tutorial_content system is EMPTY and unused.
   
   RECOMMENDATION:
   - Deprecate /api/tutorial/content/* endpoints
   - Use /api/tutorial/sections/* exclusively
   - Remove legacy content system from codebase
` : withContent.length > 0 && withSections.length === 0 ? `
✅ Your platform uses the LEGACY SYSTEM (tutorial_content) exclusively.
   The modular tutorial_sections system is EMPTY and unused.
   
   RECOMMENDATION:
   - Continue using /api/tutorial/content/* endpoints
   - Consider migrating to modular sections system
` : withBoth.length > 0 ? `
⚠️  Your platform uses BOTH SYSTEMS with mixed data.
   This creates architectural complexity and maintenance burden.
   
   RECOMMENDATION:
   - Standardize on ONE system
   - Migrate all content to chosen system
   - Deprecate the other system
` : `
❌ NO DATA FOUND in either system.
   Content generation pipeline may not be running.
   
   RECOMMENDATION:
   - Run content generation pipeline
   - Verify database connections
   - Check content ingestion process
`}
  `);
  
  section('ENDPOINT RECOMMENDATIONS');
  
  console.log(`
Based on database analysis:

/api/tutorial/sections/* endpoint should work for:
${withSections.map(r => `  ✅ ${r.slug}`).join('\n') || '  ❌ None'}

/api/tutorial/content/* endpoint should work for:
${withContent.map(r => `  ✅ ${r.slug}`).join('\n') || '  ❌ None'}

FAILING ENDPOINTS:
${results.filter(r => (!r.sectionsCount || r.sectionsCount === 0) && (!r.contentCount || r.contentCount === 0))
  .map(r => `  ❌ Both endpoints will fail for: ${r.slug}`).join('\n') || '  ✅ All subtopics have data in at least one system'}
  `);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
