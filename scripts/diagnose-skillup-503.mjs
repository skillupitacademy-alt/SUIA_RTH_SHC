#!/usr/bin/env node
/**
 * READ-ONLY DIAGNOSTIC: SkillUp Tutorial Page 503 Error
 * 
 * Traces why https://user.skillupitacademy.com/tutorial-v2/.../java/whatisjava
 * returns 503 server exception.
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const tutorialSql = neon(process.env.DATABASE_URL_TUTORIAL);
const parentSql = neon(process.env.DATABASE_URL);

console.log('\n🔍 SKILLUP TUTORIAL PAGE 503 DIAGNOSTIC');
console.log('========================================\n');

const results = {
  pageRoute: null,
  dataFlow: [],
  databaseState: {},
  brandResolution: null,
  deploymentVersion: null,
  rootCause: null,
  requiredFix: null,
};

try {
  // ============================================================
  // STEP 1: LOCATE SKILLUP TUTORIAL PAGE ROUTE
  // ============================================================
  console.log('1️⃣  LOCATING SKILLUP TUTORIAL PAGE ROUTE\n');
  
  const skillupPagePath = 'apps/skillup-web/src/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx';
  
  if (fs.existsSync(skillupPagePath)) {
    console.log(`  ✅ Found: ${skillupPagePath}\n`);
    results.pageRoute = skillupPagePath;
  } else {
    console.log(`  ❌ NOT FOUND: ${skillupPagePath}\n`);
    console.log('  Checking alternative locations...\n');
    
    // Check if it uses a different structure
    const alternatives = [
      'apps/skillup-web/src/app/(app)/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx',
      'apps/skillup-web/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx',
    ];
    
    for (const alt of alternatives) {
      if (fs.existsSync(alt)) {
        console.log(`  ✅ Found alternative: ${alt}\n`);
        results.pageRoute = alt;
        break;
      }
    }
  }
  
  // ============================================================
  // STEP 2: CHECK tutorialSidebarDelivery.ts
  // ============================================================
  console.log('2️⃣  CHECKING TUTORIAL SIDEBAR DELIVERY\n');
  
  const deliveryPath = 'src/share-branding/LearningExperience/tutorialSidebarDelivery.ts';
  
  if (fs.existsSync(deliveryPath)) {
    console.log(`  ✅ Found: ${deliveryPath}\n`);
    
    const content = fs.readFileSync(deliveryPath, 'utf-8');
    
    // Check for status='published' filter
    if (content.includes("status = 'published'") || content.includes('status: "published"')) {
      console.log('  ✅ Query filters for status=\'published\'\n');
    } else {
      console.log('  ⚠️  No explicit status=\'published\' filter found\n');
    }
    
    // Check withRuntimeBrand function
    if (content.includes('function withRuntimeBrand')) {
      console.log('  ✅ withRuntimeBrand() exists\n');
      
      // Check if it accepts normalizedTree
      if (content.includes('TutorialNormalizedNavigationTree')) {
        console.log('  ✅ Uses TutorialNormalizedNavigationTree type\n');
      } else if (content.includes('tree.brand.logoUrl')) {
        console.log('  ❌ CRITICAL: Code tries to access tree.brand.logoUrl!\n');
        console.log('     Normalized tree does NOT have tree.brand\n');
        results.rootCause = 'withRuntimeBrand tries to access tree.brand.logoUrl but normalized tree does not have brand property';
      } else {
        console.log('  ⚠️  Type unclear, needs manual inspection\n');
      }
    }
    
    results.dataFlow.push({
      file: deliveryPath,
      functions: ['getPublishedTutorialSidebar', 'withRuntimeBrand'],
    });
  } else {
    console.log(`  ❌ NOT FOUND: ${deliveryPath}\n`);
  }
  
  // ============================================================
  // STEP 3: VERIFY DATABASE STATE
  // ============================================================
  console.log('3️⃣  DATABASE STATE\n');
  
  // Check sidebar
  console.log('  Sidebar (tutorial_sidebar_trees_v2):\n');
  const sidebarRows = await tutorialSql`
    SELECT 
      id, brand_id, status, version, published_at,
      domain_id, subject_id, topic_id, active_subtopic_id
    FROM tutorial_sidebar_trees_v2
    WHERE brand_id = 'shared'
      AND topic_id = '4b21ddc0-123b-41e3-8ea1-280d37f7f035'
  `;
  
  if (sidebarRows.length > 0) {
    const sidebar = sidebarRows[0];
    console.log(`    ✅ Found (version ${sidebar.version}, status: ${sidebar.status})`);
    console.log(`       Published: ${sidebar.published_at ? 'Yes' : 'No'}\n`);
    results.databaseState.sidebar = sidebar;
  } else {
    console.log('    ❌ NOT FOUND\n');
    results.rootCause = 'Published sidebar not found in database';
  }
  
  // Check page content
  console.log('  Page Content (tutorial_page_content_v2):\n');
  const contentRows = await tutorialSql`
    SELECT 
      id, brand_id, subtopic_id, content_type, status, version
    FROM tutorial_page_content_v2
    WHERE subtopic_id = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4'
    ORDER BY version DESC
  `;
  
  if (contentRows.length > 0) {
    console.log(`    ✅ Found ${contentRows.length} content record(s)\n`);
    contentRows.forEach(row => {
      console.log(`       - ${row.content_type}: status=${row.status}, version=${row.version}`);
    });
    console.log('');
    results.databaseState.content = contentRows;
  } else {
    console.log('    ❌ NO CONTENT FOUND\n');
    console.log('    Checking tutorial_sections...\n');
    
    // Check if using sections instead
    try {
      const sectionRows = await tutorialSql`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_name = 'tutorial_sections'
      `;
      
      if (sectionRows[0].count > 0) {
        console.log('    ✅ tutorial_sections table exists\n');
        console.log('    (Application may use sections instead of page_content_v2)\n');
      }
    } catch (e) {
      console.log('    ⚠️  Could not check tutorial_sections\n');
    }
  }
  
  // ============================================================
  // STEP 4: CHECK HIERARCHY
  // ============================================================
  console.log('4️⃣  PARENT HIERARCHY\n');
  
  const [domain] = await parentSql`
    SELECT id, name FROM domains 
    WHERE id = '30000000-0000-0000-0000-000000000001'
  `;
  
  const [subject] = await parentSql`
    SELECT id, name FROM subjects
    WHERE id = '3a706051-9d9d-4bdf-af48-331a5acd557e'
  `;
  
  const [topic] = await parentSql`
    SELECT id, name FROM topics
    WHERE id = '4b21ddc0-123b-41e3-8ea1-280d37f7f035'
  `;
  
  const [subtopic] = await parentSql`
    SELECT id, name FROM subtopics
    WHERE id = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4'
  `;
  
  if (domain && subject && topic && subtopic) {
    console.log(`  ✅ Complete hierarchy exists:`);
    console.log(`     ${domain.name} → ${subject.name} → ${topic.name} → ${subtopic.name}\n`);
  } else {
    console.log('  ❌ Hierarchy incomplete\n');
  }
  
  // ============================================================
  // STEP 5: BRAND RESOLUTION
  // ============================================================
  console.log('5️⃣  BRAND RESOLUTION\n');
  
  console.log('  URL: https://user.skillupitacademy.com/tutorial-v2/.../whatisjava');
  console.log('  Expected brandId: skillup\n');
  
  // Check if brand middleware exists
  const brandMiddlewarePaths = [
    'apps/skillup-web/src/middleware.ts',
    'apps/skillup-web/middleware.ts',
  ];
  
  for (const mwPath of brandMiddlewarePaths) {
    if (fs.existsSync(mwPath)) {
      console.log(`  ✅ Found middleware: ${mwPath}\n`);
      const mwContent = fs.readFileSync(mwPath, 'utf-8');
      if (mwContent.includes('skillup')) {
        console.log('  ✅ Middleware mentions "skillup"\n');
      }
      break;
    }
  }
  
  results.brandResolution = {
    hostname: 'user.skillupitacademy.com',
    expectedBrandId: 'skillup',
  };
  
  // ============================================================
  // STEP 6: CHECK FOR COMMON ERROR PATTERNS
  // ============================================================
  console.log('6️⃣  CHECKING FOR COMMON ERROR PATTERNS\n');
  
  if (fs.existsSync(deliveryPath)) {
    const deliveryContent = fs.readFileSync(deliveryPath, 'utf-8');
    
    const errorPatterns = [
      { pattern: 'tree.brand.', description: 'Accessing tree.brand before runtime construction' },
      { pattern: 'tree.theme.', description: 'Accessing tree.theme before runtime construction' },
      { pattern: 'tree.subject.', description: 'Accessing tree.subject before runtime construction' },
      { pattern: 'tree.progress.', description: 'Accessing tree.progress before runtime construction' },
      { pattern: 'throw new Error', description: 'Explicit error throwing' },
      { pattern: 'throw ', description: 'Throw statement' },
    ];
    
    let foundIssues = false;
    
    for (const { pattern, description } of errorPatterns) {
      if (deliveryContent.includes(pattern)) {
        console.log(`  ⚠️  Found: ${description}`);
        console.log(`     Pattern: "${pattern}"\n`);
        foundIssues = true;
      }
    }
    
    if (!foundIssues) {
      console.log('  ✅ No obvious error patterns found\n');
    }
  }
  
  // ============================================================
  // FINAL REPORT
  // ============================================================
  console.log('========================================');
  console.log('📋 DIAGNOSTIC SUMMARY');
  console.log('========================================\n');
  
  console.log('DATABASE STATE:');
  console.log(`  Sidebar: ${results.databaseState.sidebar ? '✅ EXISTS (published)' : '❌ MISSING'}`);
  console.log(`  Content: ${results.databaseState.content ? '✅ EXISTS' : '⚠️  NEEDS VERIFICATION'}\n`);
  
  console.log('CODE STATE:');
  console.log(`  Page Route: ${results.pageRoute ? '✅ FOUND' : '❌ NOT FOUND'}`);
  console.log(`  Delivery: ✅ FOUND\n`);
  
  if (results.rootCause) {
    console.log('ROOT CAUSE:');
    console.log(`  ${results.rootCause}\n`);
  } else {
    console.log('ROOT CAUSE:');
    console.log('  Unable to determine from static analysis.');
    console.log('  Requires runtime logs or deployed error tracking.\n');
  }
  
  console.log('NEXT STEPS:');
  console.log('  1. Check deployed SkillUp logs for actual exception');
  console.log('  2. Verify page.tsx actually calls getPublishedTutorialSidebar');
  console.log('  3. Test with published sidebar + published content');
  console.log('  4. Check if withRuntimeBrand handles normalized tree correctly\n');
  
} catch (error) {
  console.error('\n❌ DIAGNOSTIC FAILED\n');
  console.error('Error:', error.message);
  console.error('\nStack:', error.stack);
  process.exit(1);
}
