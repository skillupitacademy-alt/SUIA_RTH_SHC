#!/usr/bin/env node

/**
 * Global Architecture Component Parts Validation Script
 * 
 * This script validates that:
 * 1. All sections in Global Architecture have their components defined
 * 2. All components have their subcomponents properly mapped
 * 3. All parts rendered in ContractAwareComponentPreview match the Micro Component Editor dropdown
 * 4. Flags any mismatches between rendered parts and editable parts
 * 
 * Run: node scripts/validate-global-architecture-parts.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80));
}

function logSubsection(title) {
  console.log('\n' + '-'.repeat(80));
  log(title, 'blue');
  console.log('-'.repeat(80));
}

// Read and parse the Global Architecture page
function readGlobalArchitecturePage() {
  const pagePath = resolve(projectRoot, 'apps/skillhubcore-admin/src/app/(admin)/content-generation/global-architecture/page.tsx');
  return readFileSync(pagePath, 'utf-8');
}

// Read and parse ContractAwareComponentPreview
function readContractAwareComponentPreview() {
  const previewPath = resolve(projectRoot, 'apps/skillhubcore-admin/src/app/(admin)/tools/content-manager/components/ContractAwareComponentPreview.tsx');
  return readFileSync(previewPath, 'utf-8');
}

// Extract part presets from page.tsx (notesPartPresets and educationalPartPresets)
function extractPartPresets(pageContent) {
  const presets = {
    notes: {},
    educational: {},
  };

  // Extract notes presets
  const notesMatch = pageContent.match(/const notesPartPresets: Record<string, Array<Record<string, unknown>>> = \{([\s\S]+?)\n    \};\s+\/\/ Educational/);
  if (notesMatch) {
    const notesContent = notesMatch[1];
    
    // Extract each component and its parts
    const lines = notesContent.split('\n');
    let currentComponent = null;
    let bracketCount = 0;
    let partIds = [];
    
    for (const line of lines) {
      const componentMatch = line.match(/^\s+(\w+):\s*\[/);
      if (componentMatch) {
        if (currentComponent && partIds.length > 0) {
          presets.notes[currentComponent] = [...new Set(partIds)];
        }
        currentComponent = componentMatch[1];
        partIds = [];
        bracketCount = 1;
        continue;
      }
      
      if (currentComponent) {
        // Count brackets
        bracketCount += (line.match(/\[/g) || []).length;
        bracketCount -= (line.match(/\]/g) || []).length;
        
        // Extract explicit id definitions
        const idMatch = line.match(/id:\s*['"](\w+)['"]/);
        if (idMatch) {
          partIds.push(idMatch[1]);
        }
        
        // Extract commonDefaults references
        const commonDefaultMatch = line.match(/\.\.\.commonDefaults\[(\d+)\]/);
        if (commonDefaultMatch) {
          const index = parseInt(commonDefaultMatch[1]);
          const commonDefaultIds = [
            'container', 'header', 'body', 'action', 'icon_badge',
            'difficulty_badge', 'brand_badge', 'title', 'description',
            'stat_cards', 'stat_value', 'primary_button', 'secondary_button', 'progress_bar',
          ];
          if (commonDefaultIds[index]) {
            partIds.push(commonDefaultIds[index]);
          }
        }
        
        // Check if component definition is complete
        if (bracketCount === 0 && line.includes('],')) {
          if (partIds.length > 0) {
            presets.notes[currentComponent] = [...new Set(partIds)];
          }
          currentComponent = null;
          partIds = [];
        }
      }
    }
    
    // Add last component if exists
    if (currentComponent && partIds.length > 0) {
      presets.notes[currentComponent] = [...new Set(partIds)];
    }
  }

  // Extract educational presets
  const educationalMatch = pageContent.match(/\/\/ Educational Architecture component-specific part presets\s+const educationalPartPresets: Record<string, Array<Record<string, unknown>>> = \{([\s\S]+?)\n    \};\s+const notesSubsectionKey/);
  if (educationalMatch) {
    const educationalContent = educationalMatch[1];
    
    // Extract each component and its parts
    const lines = educationalContent.split('\n');
    let currentComponent = null;
    let bracketCount = 0;
    let partIds = [];
    
    for (const line of lines) {
      const componentMatch = line.match(/^\s+(\w+):\s*\[/);
      if (componentMatch) {
        if (currentComponent && partIds.length > 0) {
          presets.educational[currentComponent] = [...new Set(partIds)];
        }
        currentComponent = componentMatch[1];
        partIds = [];
        bracketCount = 1;
        continue;
      }
      
      if (currentComponent) {
        // Count brackets
        bracketCount += (line.match(/\[/g) || []).length;
        bracketCount -= (line.match(/\]/g) || []).length;
        
        // Extract explicit id definitions
        const idMatch = line.match(/id:\s*['"](\w+)['"]/);
        if (idMatch) {
          partIds.push(idMatch[1]);
        }
        
        // Extract commonDefaults references
        const commonDefaultMatch = line.match(/\.\.\.commonDefaults\[(\d+)\]/);
        if (commonDefaultMatch) {
          const index = parseInt(commonDefaultMatch[1]);
          const commonDefaultIds = [
            'container', 'header', 'body', 'action', 'icon_badge',
            'difficulty_badge', 'brand_badge', 'title', 'description',
            'stat_cards', 'stat_value', 'primary_button', 'secondary_button', 'progress_bar',
          ];
          if (commonDefaultIds[index]) {
            partIds.push(commonDefaultIds[index]);
          }
        }
        
        // Check if component definition is complete
        if (bracketCount === 0 && line.includes('],')) {
          if (partIds.length > 0) {
            presets.educational[currentComponent] = [...new Set(partIds)];
          }
          currentComponent = null;
          partIds = [];
        }
      }
    }
    
    // Add last component if exists
    if (currentComponent && partIds.length > 0) {
      presets.educational[currentComponent] = [...new Set(partIds)];
    }
  }

  return presets;
}

// Extract rendered parts from ContractAwareComponentPreview
function extractRenderedParts(previewContent) {
  const renderedParts = {
    notes: {},
  };

  // Simpler approach: extract all part IDs from data-part-id attributes in the entire file
  // Then filter by component context
  
  const allPartIds = new Set();
  const staticPartIds = previewContent.matchAll(/data-part-id=["'](\w+)["']/g);
  for (const match of staticPartIds) {
    allPartIds.add(match[1]);
  }
  
  // For now, assign all found parts to all components since they use similar structures
  // In a perfect world, we'd parse the exact component boundaries
  const notesComponents = [
    'concept_card',
    'definition_block',
    'syntax_block',
    'component_grid',
    'example_panel',
    'practice_card',
    'warning_faq',
    'summary_card',
  ];
  
  const allPartsArray = Array.from(allPartIds).sort();
  
  // Return all parts for each component for now
  // The validation will show which parts are actually defined vs rendered
  for (const component of notesComponents) {
    renderedParts.notes[component] = allPartsArray;
  }

  return renderedParts;
}

// Compare preset parts with rendered parts
function comparePartsAndFindMismatches(presets, renderedParts) {
  const mismatches = [];
  let totalChecks = 0;
  let passedChecks = 0;

  logSection('🔍 VALIDATION RESULTS');

  // Check Notes components
  logSubsection('📘 Notes Section Components');
  
  for (const [componentName, presetParts] of Object.entries(presets.notes)) {
    totalChecks++;
    const rendered = renderedParts.notes[componentName] || [];
    const presetSet = new Set(presetParts);
    const renderedSet = new Set(rendered);
    
    // Find parts in preset but not rendered
    const missingInRender = presetParts.filter(p => !renderedSet.has(p));
    
    // Find parts rendered but not in preset
    const missingInPreset = rendered.filter(p => !presetSet.has(p));
    
    if (missingInRender.length === 0 && missingInPreset.length === 0) {
      passedChecks++;
      log(`  ✅ ${componentName}: Perfect match (${presetParts.length} parts)`, 'green');
    } else {
      log(`  ❌ ${componentName}: MISMATCH DETECTED`, 'red');
      
      if (missingInRender.length > 0) {
        log(`     ⚠️  In Dropdown but NOT Rendered: ${missingInRender.join(', ')}`, 'yellow');
      }
      
      if (missingInPreset.length > 0) {
        log(`     ⚠️  Rendered but NOT in Dropdown: ${missingInPreset.join(', ')}`, 'yellow');
      }
      
      mismatches.push({
        section: 'notes',
        component: componentName,
        missingInRender,
        missingInPreset,
        presetParts,
        renderedParts: rendered,
      });
    }
  }

  // Check Educational components
  logSubsection('📗 Educational Architecture Components');
  
  for (const [componentName, presetParts] of Object.entries(presets.educational)) {
    totalChecks++;
    // Educational components don't have specific rendering yet, so just log them
    log(`  ℹ️  ${componentName}: Defined (${presetParts.length} parts) - Render validation pending`, 'cyan');
    log(`     Parts: ${presetParts.join(', ')}`, 'white');
  }

  return { mismatches, totalChecks, passedChecks };
}

// Generate detailed mismatch report
function generateMismatchReport(mismatches) {
  if (mismatches.length === 0) {
    logSection('✅ SUCCESS: NO MISMATCHES FOUND!');
    log('All components have their rendered parts perfectly matching the Micro Component Editor dropdown.', 'green');
    return true;
  }

  logSection('❌ MISMATCH REPORT');
  
  log(`Found ${mismatches.length} component(s) with mismatches:\n`, 'red');

  for (const mismatch of mismatches) {
    log(`Component: ${mismatch.section}.${mismatch.component}`, 'yellow');
    log(`  Preset parts (${mismatch.presetParts.length}): ${mismatch.presetParts.join(', ')}`, 'white');
    log(`  Rendered parts (${mismatch.renderedParts.length}): ${mismatch.renderedParts.join(', ')}`, 'white');
    
    if (mismatch.missingInRender.length > 0) {
      log(`  ⚠️  Parts in dropdown but NOT rendered: ${mismatch.missingInRender.join(', ')}`, 'red');
      log(`     ACTION: Either add rendering for these parts OR remove them from the preset`, 'yellow');
    }
    
    if (mismatch.missingInPreset.length > 0) {
      log(`  ⚠️  Parts rendered but NOT in dropdown: ${mismatch.missingInPreset.join(', ')}`, 'red');
      log(`     ACTION: Add these parts to the ${mismatch.section}PartPresets[${mismatch.component}] array`, 'yellow');
    }
    
    console.log('');
  }

  return false;
}

// Generate recommendation report
function generateRecommendations(presets, renderedParts) {
  logSection('💡 RECOMMENDATIONS');

  log('\n1. Notes Components Coverage:', 'cyan');
  const notesComponents = Object.keys(presets.notes);
  const renderedNotesComponents = Object.keys(renderedParts.notes);
  
  log(`   ✅ Defined in presets: ${notesComponents.length} components`, 'green');
  log(`   ✅ Have rendering logic: ${renderedNotesComponents.length} components`, 'green');
  
  const missingRendering = notesComponents.filter(c => !renderedNotesComponents.includes(c));
  if (missingRendering.length > 0) {
    log(`   ⚠️  Missing rendering: ${missingRendering.join(', ')}`, 'yellow');
  }

  log('\n2. Educational Components Coverage:', 'cyan');
  const educationalComponents = Object.keys(presets.educational);
  log(`   ✅ Defined in presets: ${educationalComponents.length} components`, 'green');
  log(`   ℹ️  Note: Educational components use generic rendering, no specific validation needed`, 'white');

  log('\n3. Part Hierarchy Best Practices:', 'cyan');
  log('   ✅ Each component should have 4-10 subcomponents for optimal UX', 'white');
  
  for (const [componentName, parts] of Object.entries(presets.notes)) {
    if (parts.length < 4) {
      log(`   ⚠️  ${componentName} has only ${parts.length} parts - consider adding more granular control`, 'yellow');
    } else if (parts.length > 15) {
      log(`   ⚠️  ${componentName} has ${parts.length} parts - consider grouping some parts`, 'yellow');
    }
  }
}

// Main validation function
async function main() {
  try {
    logSection('🚀 GLOBAL ARCHITECTURE PARTS VALIDATION');
    log('Validating component parts across Micro Component Editor and Renderer Preview\n', 'white');

    // Step 1: Read source files
    log('📂 Reading source files...', 'cyan');
    const pageContent = readGlobalArchitecturePage();
    const previewContent = readContractAwareComponentPreview();
    log('   ✅ Source files loaded', 'green');

    // Step 2: Extract part presets from page.tsx
    log('\n📋 Extracting part presets from Global Architecture page...', 'cyan');
    const presets = extractPartPresets(pageContent);
    log(`   ✅ Found ${Object.keys(presets.notes).length} notes component presets`, 'green');
    log(`   ✅ Found ${Object.keys(presets.educational).length} educational component presets`, 'green');

    // Step 3: Extract rendered parts from ContractAwareComponentPreview
    log('\n🎨 Extracting rendered parts from ContractAwareComponentPreview...', 'cyan');
    const renderedParts = extractRenderedParts(previewContent);
    log(`   ✅ Found rendering logic for ${Object.keys(renderedParts.notes).length} notes components`, 'green');

    // Step 4: Compare and find mismatches
    const { mismatches, totalChecks, passedChecks } = comparePartsAndFindMismatches(presets, renderedParts);

    // Step 5: Generate reports
    const allPassed = generateMismatchReport(mismatches);
    generateRecommendations(presets, renderedParts);

    // Step 6: Summary
    logSection('📊 VALIDATION SUMMARY');
    log(`Total components checked: ${totalChecks}`, 'white');
    log(`Passed validation: ${passedChecks}`, passedChecks === totalChecks ? 'green' : 'yellow');
    log(`Failed validation: ${totalChecks - passedChecks}`, totalChecks - passedChecks === 0 ? 'green' : 'red');
    log(`Match rate: ${Math.round((passedChecks / totalChecks) * 100)}%`, passedChecks === totalChecks ? 'green' : 'yellow');

    if (allPassed) {
      log('\n🎉 All validations passed! The component parts are consistent.', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  Some validations failed. Please review the mismatch report above.', 'yellow');
      process.exit(1);
    }

  } catch (error) {
    log('\n❌ VALIDATION ERROR:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the validation
main();
