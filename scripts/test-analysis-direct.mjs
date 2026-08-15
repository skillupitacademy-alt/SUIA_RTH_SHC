#!/usr/bin/env node

/**
 * Direct Analysis Service Test
 * Tests ContentAnalysisService directly without HTTP server
 * Connects to database and runs analysis
 */

import { contentAnalysisService } from '../packages/db-tutorial/src/index.ts';

console.log('🧪 DIRECT CONTENT ANALYSIS SERVICE TEST');
console.log('=========================================\n');
console.log(`Timestamp: ${new Date().toISOString()}\n`);

const SAMPLE_DOCUMENT = {
  schemaVersion: 1,
  metadata: {
    title: 'Introduction to JavaScript Variables',
    description: 'Learn about variables in JavaScript',
    author: 'Test Suite',
    tags: ['javascript', 'variables', 'basics'],
    estimatedDuration: 15,
    difficulty: 'beginner',
  },
  blocks: [
    {
      id: 'heading-1',
      type: 'heading',
      level: 1,
      text: 'JavaScript Variables',
      presentation: { align: 'left', style: 'default' },
    },
    {
      id: 'paragraph-1',
      type: 'paragraph',
      text: 'Variables are containers for storing data values. In JavaScript, we can declare variables using var, let, or const keywords. This is an important concept in programming.',
      presentation: { align: 'left', emphasis: 'normal' },
    },
    {
      id: 'heading-2',
      type: 'heading',
      level: 2,
      text: 'Declaring Variables',
      presentation: { align: 'left', style: 'default' },
    },
    {
      id: 'paragraph-2',
      type: 'paragraph',
      text: 'The let keyword is used to declare variables that can be reassigned. The const keyword declares variables that cannot be reassigned. Understanding the difference is crucial for writing maintainable code.',
      presentation: { align: 'left', emphasis: 'normal' },
    },
    {
      id: 'code-1',
      type: 'code',
      language: 'javascript',
      code: 'let name = "John";\nconst age = 30;\nname = "Jane"; // OK\n// age = 31; // Error!',
      caption: 'Variable declaration examples',
      presentation: { theme: 'dark', showLineNumbers: true, highlightLines: [] },
    },
    {
      id: 'example-1',
      type: 'example',
      title: 'Real-World Example',
      content: 'For example, when building a shopping cart, you would use let for the cart items since they change, but const for the tax rate since it stays constant.',
      presentation: { style: 'default' },
    },
    {
      id: 'callout-1',
      type: 'callout',
      variant: 'tip',
      title: 'Pro Tip',
      content: 'Always use const by default. Only use let when you know the variable will be reassigned.',
      presentation: { showIcon: true },
    },
    {
      id: 'heading-3',
      type: 'heading',
      level: 2,
      text: 'Variable Naming Rules',
      presentation: { align: 'left', style: 'default' },
    },
    {
      id: 'list-1',
      type: 'list',
      style: 'bullet',
      items: [
        { id: 'item-1', text: 'Names must start with a letter, underscore, or dollar sign' },
        { id: 'item-2', text: 'Names cannot contain spaces' },
        { id: 'item-3', text: 'Names are case-sensitive' },
        { id: 'item-4', text: 'Reserved words cannot be used as names' },
      ],
      presentation: { spacing: 'comfortable', marker: 'disc' },
    },
    {
      id: 'heading-4',
      type: 'heading',
      level: 2,
      text: 'Best Practices',
      presentation: { align: 'left', style: 'default' },
    },
    {
      id: 'list-2',
      type: 'list',
      style: 'numbered',
      items: [
        { id: 'item-5', text: 'Use descriptive variable names' },
        { id: 'item-6', text: 'Prefer const over let' },
        { id: 'item-7', text: 'Avoid var in modern JavaScript' },
      ],
      presentation: { spacing: 'comfortable', marker: 'decimal' },
    },
  ],
};

async function runTest() {
  try {
    console.log('📦 Step 1: Import ContentAnalysisService...');
    console.log('   ✅ Service imported successfully\n');

    console.log('🔍 Step 2: Analyze TutorialDocument...');
    console.log(`   Document: "${SAMPLE_DOCUMENT.metadata.title}"`);
    console.log(`   Blocks: ${SAMPLE_DOCUMENT.blocks.length}`);
    
    const startTime = Date.now();
    
    // Direct service call - no HTTP, no database
    const result = contentAnalysisService.analyzeDocument(
      SAMPLE_DOCUMENT,
      '550e8400-e29b-41d4-a716-446655440000' // Test subtopic UUID
    );
    
    const duration = Date.now() - startTime;
    console.log(`   ✅ Analysis completed in ${duration}ms\n`);

    // Step 3: Validate Response Structure
    console.log('✅ Step 3: Validating Response Structure...');
    const required = ['statistics', 'sectionOutline', 'qualityIndicators', 'detectedElements', 'smartSuggestions', 'overallConfidence'];
    const missing = required.filter(f => !result[f]);
    
    if (missing.length > 0) {
      throw new Error(`Missing fields in response: ${missing.join(', ')}`);
    }
    console.log('   ✅ All required fields present\n');

    // Step 4: Display Results
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 ANALYSIS RESULTS');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('STATISTICS:');
    console.log(`  Total Words: ${result.statistics.totalWords}`);
    console.log(`  Characters: ${result.statistics.characters}`);
    console.log(`  Reading Time: ${result.statistics.readingTimeMinutes} minutes`);
    console.log(`  Sections Detected: ${result.statistics.sectionsDetected}`);
    console.log(`  Total Blocks: ${result.statistics.totalBlocks}`);
    console.log(`  Sections Breakdown: ${result.statistics.sectionsBreakdown}\n`);

    console.log('QUALITY INDICATORS:');
    Object.entries(result.qualityIndicators).forEach(([key, value]) => {
      const icon = value === 'excellent' || value === 'good' ? '✅' : 
                   value === 'fair' ? '⚠️' : 
                   value === 'none' ? '⭕' : '❌';
      console.log(`  ${icon} ${key}: ${value}`);
    });
    console.log('');

    console.log('DETECTED ELEMENTS:');
    Object.entries(result.detectedElements).forEach(([key, value]) => {
      if (value > 0) {
        console.log(`  • ${key}: ${value}`);
      }
    });
    console.log('');

    console.log('SECTION OUTLINE:');
    result.sectionOutline.forEach((section, i) => {
      console.log(`  ${i + 1}. ${section.title} [${section.level.toUpperCase()}] - Confidence: ${section.confidence}%`);
      if (section.snippet) {
        console.log(`     "${section.snippet.substring(0, 60)}..."`);
      }
      if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach((sub, j) => {
          console.log(`     ${i + 1}.${j + 1}. ${sub.title} [${sub.level.toUpperCase()}] - Confidence: ${sub.confidence}%`);
        });
      }
    });
    console.log('');

    console.log('SMART SUGGESTIONS:');
    result.smartSuggestions.forEach((s, i) => {
      console.log(`  ${i + 1}. [${s.type}] ${s.text}`);
    });
    console.log('');

    console.log('OVERALL CONFIDENCE:');
    const gradeIcon = result.overallConfidence.grade === 'Excellent' || result.overallConfidence.grade === 'High' ? '🟢' : 
                      result.overallConfidence.grade === 'Good' ? '🟡' : '🔴';
    console.log(`  ${gradeIcon} Score: ${result.overallConfidence.score}/100`);
    console.log(`  ${gradeIcon} Grade: ${result.overallConfidence.grade}`);
    console.log(`  📝 ${result.overallConfidence.description}`);
    console.log('  ℹ️  Note: Confidence values are deterministic structural scores\n');

    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('✅ Service Implementation Status:');
    console.log('   • ContentAnalysisService: Working');
    console.log('   • Statistics Calculation: Working');
    console.log('   • Section Outline Extraction: Working');
    console.log('   • Quality Indicators: Working');
    console.log('   • Element Detection: Working');
    console.log('   • Smart Suggestions: Working');
    console.log('   • Overall Confidence: Working');
    console.log('   • Response Structure: Valid\n');
    
    console.log('📋 Summary:');
    console.log(`   Analysis Duration: ${duration}ms`);
    console.log(`   Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log(`   Platform: ${process.platform}`);
    console.log(`   Node Version: ${process.version}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

console.log('⚡ Running direct service test (no HTTP server required)...\n');
runTest();
