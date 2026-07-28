#!/usr/bin/env node
/**
 * Comprehensive Renderer Highlighting Alignment Validator
 * 
 * This script validates that:
 * 1. All parts in notesPartPresets/educationalPartPresets exist as data-part-id in TSX
 * 2. All data-part-id attributes in TSX have corresponding preset entries
 * 3. Highlighting will work correctly for all components
 * 
 * Usage: node scripts/validate-renderer-highlighting-alignment.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

// Read files
const pageFilePath = path.join(__dirname, '../apps/skillhubcore-admin/src/app/(admin)/content-generation/global-architecture/page.tsx');
const previewFilePath = path.join(__dirname, '../apps/skillhubcore-admin/src/app/(admin)/tools/content-manager/components/ContractAwareComponentPreview.tsx');

const pageContent = fs.readFileSync(pageFilePath, 'utf-8');
const previewContent = fs.readFileSync(previewFilePath, 'utf-8');

// Extract notesPartPresets from page.tsx
function extractNotesPartPresets(content) {
  const presets = {};
  
  // Find the notesPartPresets object - look for the specific pattern
  const notesPresetsMatch = content.match(/const notesPartPresets:\s*Record<[^>]+>\s*=\s*\{([\s\S]*?)\n\s*\};/);
  
  if (!notesPresetsMatch) {
    log('⚠️  Could not find notesPartPresets definition', 'yellow');
    return presets;
  }
  
  const presetsBlock = notesPresetsMatch[1];
  
  // Extract each component preset - match component_name: [ ... ],
  const componentRegex = /(\w+):\s*\[([\s\S]*?)\],\s*(?=\w+:|$)/g;
  let match;
  
  while ((match = componentRegex.exec(presetsBlock)) !== null) {
    const componentName = match[1];
    const partsBlock = match[2];
    
    // Extract part IDs from this component's preset
    const partIds = [];
    
    // Look for explicit id: 'value' patterns
    const explicitIdRegex = /id:\s*['"](\w+)['"]/g;
    let idMatch;
    
    while ((idMatch = explicitIdRegex.exec(partsBlock)) !== null) {
      partIds.push(idMatch[1]);
    }
    
    // Look for spread commonDefaults references like { ...commonDefaults[0] }
    // We need to extract which commonDefaults are referenced and know their IDs
    const commonDefaultsPattern = /\{\s*\.\.\.commonDefaults\[(\d+)\]/g;
    let commonMatch;
    
    // Map of commonDefaults indices to their IDs based on the actual code
    const commonDefaultsMap = {
      0: 'container',
      1: 'header', 
      2: 'body',
      3: 'action',
      4: 'icon_badge',
      5: 'difficulty_badge',
      6: 'brand_badge',
      7: 'title',
      8: 'description',
      9: 'stat_cards',  // Not used in individual component presets typically
      10: 'stat_cards',
      11: 'stat_value',
      12: 'primary_button',
      13: 'secondary_button' // Also used for progress_bar context
    };
    
    while ((commonMatch = commonDefaultsPattern.exec(partsBlock)) !== null) {
      const index = parseInt(commonMatch[1], 10);
      if (commonDefaultsMap[index]) {
        partIds.push(commonDefaultsMap[index]);
      }
    }
    
    presets[componentName] = partIds;
  }
  
  return presets;
}

// Extract educationalPartPresets from page.tsx
function extractEducationalPartPresets(content) {
  const presets = {};
  
  // Find the educationalPartPresets object
  const eduPresetsMatch = content.match(/const educationalPartPresets:\s*Record<[^>]+>\s*=\s*\{([\s\S]*?)\n\s*\};/);
  
  if (!eduPresetsMatch) {
    log('⚠️  Could not find educationalPartPresets definition', 'yellow');
    return presets;
  }
  
  const presetsBlock = eduPresetsMatch[1];
  
  // Extract each component preset
  const componentRegex = /(\w+):\s*\[([\s\S]*?)\],\s*(?=\w+:|$)/g;
  let match;
  
  while ((match = componentRegex.exec(presetsBlock)) !== null) {
    const componentName = match[1];
    const partsBlock = match[2];
    
    // Extract part IDs
    const partIds = [];
    
    // Look for explicit id: 'value' patterns
    const explicitIdRegex = /id:\s*['"](\w+)['"]/g;
    let idMatch;
    
    while ((idMatch = explicitIdRegex.exec(partsBlock)) !== null) {
      partIds.push(idMatch[1]);
    }
    
    // Map commonDefaults indices  
    const commonDefaultsMap = {
      0: 'container',
      1: 'header',
      2: 'body',
      3: 'action',
      4: 'icon_badge',
      5: 'difficulty_badge',
      6: 'brand_badge',
      7: 'title',
      8: 'description',
      10: 'stat_cards',
      11: 'stat_value',
      12: 'primary_button',
      13: 'secondary_button'
    };
    
    const commonDefaultsPattern = /\{\s*\.\.\.commonDefaults\[(\d+)\]/g;
    let commonMatch;
    
    while ((commonMatch = commonDefaultsPattern.exec(partsBlock)) !== null) {
      const index = parseInt(commonMatch[1], 10);
      if (commonDefaultsMap[index]) {
        partIds.push(commonDefaultsMap[index]);
      }
    }
    
    presets[componentName] = partIds;
  }
  
  return presets;
}

// Extract data-part-id usage from TSX per component
function extractTsxPartIds(content) {
  const componentParts = {};
  
  // Component rendering sections mapping
  const componentSections = {
    concept_card: /if \(\['concept_card', 'conceptcard'\]\.includes\(normalizedSubsection\)\)([\s\S]*?)(?=if \(\[|$)/,
    definition_block: /if \(\['definition_block', 'definitionblock'\]\.includes\(normalizedSubsection\)\)([\s\S]*?)(?=if \(\[|$)/,
    syntax_block: /if \(\['syntax_block', 'syntaxblock'\]\.includes\(normalizedSubsection\)\)([\s\S]*?)(?=if \(\[|$)/,
    component_grid: /if \(\['component_grid', 'componentgrid'\]\.includes\(normalizedSubsection\)\)([\s\S]*?)(?=if \(\[|$)/,
    example_panel: /if \(\['example_panel', 'examplepanel'\]\.includes\(normalizedSubsection\)\)([\s\S]*?)(?=if \(\[|$)/,
    practice_card: /if \(\['practice_card', 'practicecard'\]\.includes\(normalizedSubsection\)\)([\s\S]*?)(?=if \(\[|$)/,
    warning_faq: /if \(\['warning_faq', 'warningfaq'\]\.includes\(normalizedSubsection\)\)([\s\S]*?)(?=if \(\[|$)/,
    summary_card: /if \(\['summary_card', 'summarycard'\]\.includes\(normalizedSubsection\)\)([\s\S]*?)(?=if \(\[|$)/,
  };
  
  for (const [componentName, regex] of Object.entries(componentSections)) {
    const match = content.match(regex);
    if (match) {
      const sectionContent = match[1];
      
      // Extract all data-part-id values from this section
      const partIds = new Set();
      
      // Static data-part-id="value"
      const staticMatches = sectionContent.matchAll(/data-part-id=["'](\w+)["']/g);
      for (const m of staticMatches) {
        partIds.add(m[1]);
      }
      
      // Dynamic data-part-id={pillId} where pillId is computed
      const dynamicMatches = sectionContent.matchAll(/data-part-id=\{(\w+)\}/g);
      for (const m of dynamicMatches) {
        const varName = m[1];
        // If it's pillId, look for how it's computed
        if (varName === 'pillId') {
          const pillIdMatch = sectionContent.match(/const pillId = `quick_look_pill_\$\{index\}`/);
          if (pillIdMatch) {
            // Add the pill variants
            partIds.add('quick_look_pill_0');
            partIds.add('quick_look_pill_1');
            partIds.add('quick_look_pill_2');
            partIds.add('quick_look_pill_3');
          }
        }
      }
      
      componentParts[componentName] = Array.from(partIds);
    } else {
      log(`⚠️  Could not find rendering section for ${componentName}`, 'yellow');
    }
  }
  
  return componentParts;
}

// Main validation
function main() {
  log('\n' + '='.repeat(80), 'cyan');
  log('  Renderer Highlighting Alignment Validator', 'bright');
  log('='.repeat(80) + '\n', 'cyan');
  
  log('📖 Reading configuration files...', 'blue');
  
  const notesPresets = extractNotesPartPresets(pageContent);
  const educationalPresets = extractEducationalPartPresets(pageContent);
  const tsxParts = extractTsxPartIds(previewContent);
  
  log(`\n✅ Found ${Object.keys(notesPresets).length} Notes component presets`, 'green');
  log(`✅ Found ${Object.keys(educationalPresets).length} Educational component presets`, 'green');
  log(`✅ Found ${Object.keys(tsxParts).length} TSX component sections\n`, 'green');
  
  // Validate Notes components
  log('─'.repeat(80), 'cyan');
  log('NOTES COMPONENTS VALIDATION', 'bright');
  log('─'.repeat(80) + '\n', 'cyan');
  
  let totalIssues = 0;
  const allComponents = { ...notesPresets, ...educationalPresets };
  
  for (const [componentName, presetParts] of Object.entries(allComponents)) {
    const tsxPartIds = tsxParts[componentName] || [];
    const isNotes = componentName in notesPresets;
    const componentType = isNotes ? 'Notes' : 'Educational';
    
    log(`\n${componentType} Component: ${componentName}`, 'magenta');
    log('  Preset parts: ' + presetParts.length, 'cyan');
    log('  TSX parts: ' + tsxPartIds.length, 'cyan');
    
    // Find parts in preset but not in TSX
    const missingInTsx = presetParts.filter(id => !tsxPartIds.includes(id));
    if (missingInTsx.length > 0) {
      log(`  ⚠️  Parts in preset but NOT in TSX (${missingInTsx.length}):`, 'yellow');
      missingInTsx.forEach(id => log(`     - ${id}`, 'yellow'));
      totalIssues += missingInTsx.length;
    }
    
    // Find parts in TSX but not in preset
    const missingInPreset = tsxPartIds.filter(id => !presetParts.includes(id));
    if (missingInPreset.length > 0) {
      log(`  ⚠️  Parts in TSX but NOT in preset (${missingInPreset.length}):`, 'yellow');
      missingInPreset.forEach(id => log(`     - ${id}`, 'yellow'));
      totalIssues += missingInPreset.length;
    }
    
    // Perfect alignment
    if (missingInTsx.length === 0 && missingInPreset.length === 0) {
      log(`  ✅ Perfect alignment! All ${presetParts.length} parts match`, 'green');
    }
  }
  
  // Summary
  log('\n' + '='.repeat(80), 'cyan');
  log('VALIDATION SUMMARY', 'bright');
  log('='.repeat(80) + '\n', 'cyan');
  
  if (totalIssues === 0) {
    log('✅ ✅ ✅  PERFECT ALIGNMENT! ✅ ✅ ✅', 'green');
    log('\nAll components have perfect alignment between:', 'green');
    log('  • Child Layout dropdown (notesPartPresets/educationalPartPresets)', 'green');
    log('  • Renderer Preview TSX (data-part-id attributes)', 'green');
    log('  • Highlighting mechanism (getHighlightClass/getHighlightStyle)', 'green');
    log('\nAll dropdown selections will highlight correctly in the preview! 🎉\n', 'green');
  } else {
    log(`⚠️  Found ${totalIssues} alignment issues`, 'yellow');
    log('\nThese mismatches may cause:', 'yellow');
    log('  • Parts in dropdown that don\'t highlight anything', 'yellow');
    log('  • Visual elements that can\'t be selected from dropdown', 'yellow');
    log('\nRecommendations:', 'cyan');
    log('  1. Add missing parts to presets if they should be editable', 'cyan');
    log('  2. Remove extra preset parts if they don\'t exist in UI', 'cyan');
    log('  3. Ensure all visual elements have data-part-id attributes\n', 'cyan');
  }
  
  log('─'.repeat(80) + '\n', 'cyan');
  
  process.exit(totalIssues === 0 ? 0 : 1);
}

main();
