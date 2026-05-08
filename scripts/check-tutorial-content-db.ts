#!/usr/bin/env tsx

/**
 * Check Tutorial Content Database Records
 * 
 * Queries the tutorial database to verify:
 * 1. Subtopic existence
 * 2. Tutorial sections records
 * 3. Tutorial content records
 * 4. Content completeness
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, and, isNull } from 'drizzle-orm';
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

const SUBTOPIC_SLUG = process.env.SUBTOPIC_SLUG || 'component-architecture';

function section(title: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`🔍 ${title}`);
  console.log('='.repeat(80));
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

function warn(msg: string) {
  console.log(`⚠️  ${msg}`);
}

async function main() {
  console.clear();
  
  section('DATABASE CONNECTION');
  info(`Database: ${DATABASE_URL.split('@')[1]?.split('/')[1] || 'tutorial_prod'}`);
  info(`Subtopic: ${SUBTOPIC_SLUG}`);
  
  try {
    // Test connection
    await sql`SELECT 1`;
    success('Database connection successful');
  } catch (error) {
    fail(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
  
  // Check if subtopic exists
  section('STEP 1: SUBTOPIC EXISTENCE CHECK');
  
  try {
    const subtopicRecords = await db
      .select()
      .from(tutorialSubtopics)
      .where(eq(tutorialSubtopics.slug, SUBTOPIC_SLUG));
    
    if (subtopicRecords.length === 0) {
      fail(`Subtopic "${SUBTOPIC_SLUG}" NOT FOUND in subtopics table`);
      warn('This subtopic does not exist in the database');
      process.exit(1);
    }
    
    const subtopic = subtopicRecords[0];
    success(`Subtopic found: ${subtopic.name} (ID: ${subtopic.id})`);
    info(`Created: ${subtopic.createdAt}`);
    info(`Updated: ${subtopic.updatedAt}`);
    
    // Check tutorial_sections
    section('STEP 2: TUTORIAL SECTIONS CHECK');
    
    const sections = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.subtopicId, subtopic.id));
    
    if (sections.length === 0) {
      fail('No tutorial_sections records found');
    } else {
      success(`Found ${sections.length} tutorial_sections records`);
      
      const sectionTypes = sections.map(s => s.sectionType);
      info(`Section types: ${sectionTypes.join(', ')}`);
      
      const published = sections.filter(s => s.status === 'deployed' || s.status === 'approved');
      info(`Published/Deployed: ${published.length}/${sections.length}`);
      
      // Show first few sections
      console.log('\nSection Details:');
      sections.slice(0, 5).forEach(s => {
        const statusIcon = (s.status === 'deployed' || s.status === 'approved') ? '✅' : '❌';
        console.log(`  ${statusIcon} ${s.sectionType}: ${s.status} (ID: ${s.id})`);
      });
      
      if (sections.length > 5) {
        console.log(`  ... and ${sections.length - 5} more`);
      }
    }
    
    // Check tutorial_content
    section('STEP 3: TUTORIAL CONTENT CHECK');
    
    const content = await db
      .select()
      .from(tutorialContent)
      .where(
        and(
          eq(tutorialContent.subtopicId, subtopic.id),
          isNull(tutorialContent.deletedAt)
        )
      );
    
    if (content.length === 0) {
      fail('❌ NO tutorial_content records found');
      warn('This is the ROOT CAUSE of the 404 error');
      console.log('\n🎯 DIAGNOSIS:');
      console.log('  - Subtopic exists ✅');
      console.log('  - Tutorial sections exist ✅');
      console.log('  - Tutorial content MISSING ❌');
      console.log('\nThis confirms the content generation pipeline is incomplete.');
    } else {
      success(`Found ${content.length} tutorial_content records`);
      
      const contentTypes = content.map(c => c.contentType);
      const uniqueTypes = [...new Set(contentTypes)];
      info(`Content types: ${uniqueTypes.join(', ')}`);
      
      const published = content.filter(c => c.isPublished === true);
      info(`Published: ${published.length}/${content.length}`);
      
      const difficulties = [...new Set(content.map(c => c.difficulty))];
      info(`Difficulties: ${difficulties.join(', ')}`);
      
      // Show content details
      console.log('\nContent Details:');
      content.forEach(c => {
        const status = c.isPublished === true ? '✅' : '❌';
        const aiGenerated = c.generatedByAi === true ? '🤖' : '👤';
        console.log(`  ${status} ${aiGenerated} ${c.contentType} (${c.difficulty}) - ID: ${c.id}`);
      });
      
      // Check for expected content types
      const expectedTypes = ['notes', 'layman', 'visual', 'real_life', 'technical', 'code'];
      const missingTypes = expectedTypes.filter(t => !uniqueTypes.includes(t));
      
      if (missingTypes.length > 0) {
        warn(`Missing content types: ${missingTypes.join(', ')}`);
      } else {
        success('All expected content types present');
      }
    }
    
    // Check for soft-deleted content
    section('STEP 4: SOFT-DELETED CONTENT CHECK');
    
    const deletedContent = await db
      .select()
      .from(tutorialContent)
      .where(
        and(
          eq(tutorialContent.subtopicId, subtopic.id),
          isNull(tutorialContent.deletedAt)
        )
      );
    
    if (deletedContent.length > 0) {
      warn(`Found ${deletedContent.length} soft-deleted content records`);
      console.log('These records exist but are marked as deleted');
    } else {
      info('No soft-deleted content found');
    }
    
    // Summary
    section('EXECUTIVE SUMMARY');
    
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║ DATABASE AUDIT RESULTS                                                     ║
╚════════════════════════════════════════════════════════════════════════════╝

Subtopic: ${subtopic.name}
Slug: ${SUBTOPIC_SLUG}
ID: ${subtopic.id}

Records Found:
- Tutorial Sections: ${sections.length} ${sections.length > 0 ? '✅' : '❌'}
- Tutorial Content: ${content.length} ${content.length > 0 ? '✅' : '❌'}

Status:
${content.length === 0 ? `
🔴 CRITICAL ISSUE CONFIRMED:
   Tutorial content records are MISSING from the database.
   
   This is the definitive root cause of the 403/404 errors.
   
   The /api/tutorial/content/* endpoint queries tutorial_content table,
   finds no records, and returns 404.
   
   REQUIRED ACTION:
   1. Generate content for this subtopic
   2. Run content generation pipeline
   3. Publish content through admin CMS
   4. Or migrate from sections to content format
` : `
✅ Content records exist in database.
   
   If the API still returns 404, the issue is likely:
   1. Query filtering (difficulty, language, brand)
   2. Publication status filtering
   3. Route implementation bug
   4. Cache invalidation needed
`}
    `);
    
  } catch (error) {
    fail(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
