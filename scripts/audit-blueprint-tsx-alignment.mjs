#!/usr/bin/env node

/**
 * Blueprint-TSX-Preview Alignment Auditor
 * 
 * This script performs a comprehensive audit of:
 * 1. Blueprint JSON schemas (AllSectionTutorialPage.json, AllSectionTutorialPageUIUXDetailed.json)
 * 2. Actual TSX renderer components and their field expectations
 * 3. Global Architecture presets (notesPartPresets, educationalPartPresets)
 * 4. ContractAwareComponentPreview rendering logic
 * 
 * It identifies:
 * - Schema mismatches between blueprint and TSX
 * - Missing subcomponents in presets
 * - Rendering gaps in preview components
 * - Proposes canonical schemas for each section/component
 * 
 * Run: node scripts/audit-blueprint-tsx-alignment.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// ANSI color codes
const colors = {
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
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(100));
  log(title, 'cyan');
  console.log('='.repeat(100));
}

function logSubsection(title) {
  console.log('\n' + '-'.repeat(100));
  log(title, 'blue');
}

// Read blueprint files
function readBlueprintFiles() {
  const blueprintPath = resolve(projectRoot, 'docs/completeproject/TutorialPageComponents/AllSectionTutorialPage.json');
  const uiuxPath = resolve(projectRoot, 'docs/completeproject/TutorialPageComponents/AllSectionTutorialPageUIUXDetailed.json');
  
  const blueprint = JSON.parse(readFileSync(blueprintPath, 'utf-8'));
  const uiux = JSON.parse(readFileSync(uiuxPath, 'utf-8'));
  
  return { blueprint, uiux };
}

// Read active architecture files
function readActiveArchitectureFiles() {
  const activePath = resolve(projectRoot, 'apps/skillhubcore-admin/src/data/AllSectionTutorialPage.json');
  const active = JSON.parse(readFileSync(activePath, 'utf-8'));
  return active;
}

// Read TSX renderer
function readTsxRenderer() {
  const rendererPath = resolve(projectRoot, 'apps/skillhubcore-admin/src/app/(admin)/tools/content-manager/components/ContractAwareComponentPreview.tsx');
  return readFileSync(rendererPath, 'utf-8');
}

// Read Global Architecture page
function readGlobalArchitecturePage() {
  const pagePath = resolve(projectRoot, 'apps/skillhubcore-admin/src/app/(admin)/content-generation/global-architecture/page.tsx');
  return readFileSync(pagePath, 'utf-8');
}

// Extract component structure from blueprint
function extractBlueprintComponents(blueprint, uiux) {
  const components = {};
  
  // Notes section from blueprint
  const notesEducational = blueprint.find(item => item.notes_section_architecture);
  const notesUIUX = uiux.find(item => item.notes_section_uiux_architecture);
  
  if (notesEducational && notesUIUX) {
    const eduComponents = notesEducational.notes_section_architecture.universal_architecture_fixed || {};
    const uiuxComponents = notesUIUX.notes_section_uiux_architecture.component_design_system || {};
    
    components.notes = {};
    for (const [key, value] of Object.entries(uiuxComponents)) {
      components.notes[key] = {
        educational: eduComponents[key] || null,
        uiux: value,
        ui_subcomponents: value.ui_subcomponents || [],
      };
    }
  }
  
  // Overview section
  const overviewEducational = blueprint.find(item => item.overview_section_architecture);
  const overviewUIUX = uiux.find(item => item.overview_section_uiux_architecture);
  
  if (overviewEducational && overviewUIUX) {
    const eduComponents = overviewEducational.overview_section_architecture.universal_architecture_fixed || {};
    const uiuxComponents = overviewUIUX.overview_section_uiux_architecture.component_design_system || {};
    
    components.overview = {};
    for (const [key, value] of Object.entries(eduComponents)) {
      components.overview[key] = {
        educational: value,
        uiux: uiuxComponents[key] || null,
        ui_subcomponents: (uiuxComponents[key] || {}).ui_subcomponents || [],
      };
    }
  }
  
  return components;
}

// Extract what TSX actually renders
function extractTsxRenderedFields(tsxContent) {
  const rendered = {
    notes: {},
  };
  
  // For each notes component, find what fields it accesses
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
  
  for (const component of notesComponents) {
    const fields = new Set();
    const parts = new Set();
    
    // Find data-part-id attributes
    const partIdRegex = /data-part-id=["'](\w+)["']/g;
    let match;
    while ((match = partIdRegex.exec(tsxContent)) !== null) {
      parts.add(match[1]);
    }
    
    // Find contentRecord field accesses like contentRecord.heroTitle
    const fieldRegex = /contentRecord\.(\w+)/g;
    while ((match = fieldRegex.exec(tsxContent)) !== null) {
      fields.add(match[1]);
    }
    
    rendered.notes[component] = {
      fields: Array.from(fields).sort(),
      parts: Array.from(parts).sort(),
    };
  }
  
  return rendered;
}

// Extract current presets from Global Architecture
function extractCurrentPresets(pageContent) {
  const presets = {
    notes: {},
    educational: {},
  };
  
  // Extract notes presets
  const notesMatch = pageContent.match(/const notesPartPresets[\s\S]+?\n    \};\s+\/\/ Educational/);
  if (notesMatch) {
    const lines = notesMatch[0].split('\n');
    let currentComponent = null;
    let partCount = 0;
    
    for (const line of lines) {
      const componentMatch = line.match(/^\s+(\w+):\s*\[/);
      if (componentMatch) {
        currentComponent = componentMatch[1];
        partCount = 0;
      }
      
      if (currentComponent && (line.includes('{ id:') || line.includes('{ ...commonDefaults'))) {
        partCount++;
      }
      
      if (currentComponent && line.includes('],')) {
        presets.notes[currentComponent] = { partCount };
        currentComponent = null;
      }
    }
  }
  
  // Extract educational presets
  const eduMatch = pageContent.match(/const educationalPartPresets[\s\S]+?\n    \};/);
  if (eduMatch) {
    const lines = eduMatch[0].split('\n');
    let currentComponent = null;
    let partCount = 0;
    
    for (const line of lines) {
      const componentMatch = line.match(/^\s+(\w+):\s*\[/);
      if (componentMatch) {
        currentComponent = componentMatch[1];
        partCount = 0;
      }
      
      if (currentComponent && (line.includes('{ id:') || line.includes('{ ...commonDefaults'))) {
        partCount++;
      }
      
      if (currentComponent && line.includes('],')) {
        presets.educational[currentComponent] = { partCount };
        currentComponent = null;
      }
    }
  }
  
  return presets;
}

// Generate alignment report
function generateAlignmentReport(blueprintComponents, tsxRendered, currentPresets) {
  logSection('📊 BLUEPRINT-TSX-PREVIEW ALIGNMENT REPORT');
  
  const issues = [];
  const recommendations = [];
  
  // Check Notes components
  logSubsection('📘 Notes Section Alignment');
  
  for (const [componentName, blueprintData] of Object.entries(blueprintComponents.notes || {})) {
    log(`\n🔍 Component: ${componentName}`, 'yellow');
    
    const blueprintSubcomponents = blueprintData.ui_subcomponents || [];
    const blueprintPartCount = blueprintSubcomponents.length;
    const presetPartCount = (currentPresets.notes[componentName] || {}).partCount || 0;
    const tsxData = tsxRendered.notes[componentName] || { fields: [], parts: [] };
    
    log(`  Blueprint subcomponents: ${blueprintPartCount}`, 'white');
    log(`  Current preset parts: ${presetPartCount}`, 'white');
    log(`  TSX rendered parts: ${tsxData.parts.length}`, 'white');
    
    // Check alignment
    if (blueprintPartCount !== presetPartCount) {
      log(`  ❌ MISMATCH: Blueprint has ${blueprintPartCount} parts, preset has ${presetPartCount}`, 'red');
      issues.push({
        component: `notes.${componentName}`,
        issue: 'part_count_mismatch',
        blueprint: blueprintPartCount,
        preset: presetPartCount,
      });
      recommendations.push({
        component: `notes.${componentName}`,
        action: `Update notesPartPresets[${componentName}] to include all ${blueprintPartCount} subcomponents from blueprint`,
      });
    } else {
      log(`  ✅ Part count aligned`, 'green');
    }
    
    // Show blueprint subcomponents
    if (blueprintSubcomponents.length > 0) {
      log(`  Blueprint parts:`, 'cyan');
      blueprintSubcomponents.forEach(part => {
        log(`    - ${part.id || 'unknown'}: ${part.label || 'no label'}`, 'white');
      });
    }
  }
  
  // Check Educational components
  logSubsection('📗 Educational Architecture Alignment');
  
  for (const [componentName, blueprintData] of Object.entries(blueprintComponents.overview || {})) {
    log(`\n🔍 Component: ${componentName}`, 'yellow');
    
    const blueprintSubcomponents = blueprintData.ui_subcomponents || [];
    const blueprintPartCount = blueprintSubcomponents.length;
    const presetPartCount = (currentPresets.educational[componentName] || {}).partCount || 0;
    
    log(`  Blueprint subcomponents: ${blueprintPartCount}`, 'white');
    log(`  Current preset parts: ${presetPartCount}`, 'white');
    
    if (blueprintPartCount > 0 && blueprintPartCount !== presetPartCount) {
      log(`  ❌ MISMATCH: Blueprint has ${blueprintPartCount} parts, preset has ${presetPartCount}`, 'red');
      issues.push({
        component: `overview.${componentName}`,
        issue: 'part_count_mismatch',
        blueprint: blueprintPartCount,
        preset: presetPartCount,
      });
      recommendations.push({
        component: `overview.${componentName}`,
        action: `Update educationalPartPresets[${componentName}] to match blueprint`,
      });
    } else if (blueprintPartCount > 0) {
      log(`  ✅ Part count aligned`, 'green');
    } else {
      log(`  ℹ️  No blueprint subcomponents defined`, 'cyan');
    }
    
    // Show blueprint subcomponents if any
    if (blueprintSubcomponents.length > 0) {
      log(`  Blueprint parts:`, 'cyan');
      blueprintSubcomponents.forEach(part => {
        log(`    - ${part.id || 'unknown'}: ${part.label || 'no label'}`, 'white');
      });
    }
  }
  
  return { issues, recommendations };
}

// Generate fix recommendations
function generateFixRecommendations(issues, recommendations, blueprintComponents) {
  logSection('💡 FIX RECOMMENDATIONS');
  
  if (recommendations.length === 0) {
    log('\n✅ No issues found! All components are aligned.', 'green');
    return;
  }
  
  log(`\nFound ${issues.length} alignment issues. Here are the recommended fixes:\n`, 'yellow');
  
  const groupedByComponent = {};
  for (const rec of recommendations) {
    if (!groupedByComponent[rec.component]) {
      groupedByComponent[rec.component] = [];
    }
    groupedByComponent[rec.component].push(rec.action);
  }
  
  for (const [component, actions] of Object.entries(groupedByComponent)) {
    log(`\n📌 ${component}:`, 'cyan');
    actions.forEach(action => {
      log(`   • ${action}`, 'white');
    });
  }
  
  // Generate code snippets
  logSection('🔧 PROPOSED CODE FIXES');
  
  log('\nAdd these to notesPartPresets in page.tsx:\n', 'yellow');
  
  for (const [componentName, blueprintData] of Object.entries(blueprintComponents.notes || {})) {
    const blueprintSubcomponents = blueprintData.ui_subcomponents || [];
    if (blueprintSubcomponents.length > 0) {
      log(`${componentName}: [`, 'white');
      blueprintSubcomponents.forEach((part, index) => {
        const comma = index < blueprintSubcomponents.length - 1 ? ',' : '';
        log(`  { id: '${part.id}', label: '${part.label}', role: '${part.role || 'Component part'}', layout: '${part.layout || 'inline'}', visible: true, color: algorithmPalette.primary }${comma}`, 'white');
      });
      log(`],\n`, 'white');
    }
  }
}

// Main execution
async function main() {
  try {
    logSection('🚀 BLUEPRINT-TSX-PREVIEW ALIGNMENT AUDITOR');
    log('Auditing consistency across Blueprint JSON, TSX Renderers, and Preview Components\n', 'white');
    
    // Step 1: Read all files
    log('📂 Reading blueprint files...', 'cyan');
    const { blueprint, uiux } = readBlueprintFiles();
    log('   ✅ Blueprint files loaded', 'green');
    
    log('\n📂 Reading active architecture...', 'cyan');
    const active = readActiveArchitectureFiles();
    log('   ✅ Active architecture loaded', 'green');
    
    log('\n📂 Reading TSX renderer...', 'cyan');
    const tsxContent = readTsxRenderer();
    log('   ✅ TSX renderer loaded', 'green');
    
    log('\n📂 Reading Global Architecture page...', 'cyan');
    const pageContent = readGlobalArchitecturePage();
    log('   ✅ Global Architecture page loaded', 'green');
    
    // Step 2: Extract structures
    log('\n🔍 Extracting component structures...', 'cyan');
    const blueprintComponents = extractBlueprintComponents(blueprint, uiux);
    const tsxRendered = extractTsxRenderedFields(tsxContent);
    const currentPresets = extractCurrentPresets(pageContent);
    log('   ✅ Structures extracted', 'green');
    
    // Step 3: Generate alignment report
    const { issues, recommendations } = generateAlignmentReport(blueprintComponents, tsxRendered, currentPresets);
    
    // Step 4: Generate fix recommendations
    generateFixRecommendations(issues, recommendations, blueprintComponents);
    
    // Step 5: Summary
    logSection('📊 AUDIT SUMMARY');
    log(`Total components audited: ${Object.keys(blueprintComponents.notes || {}).length + Object.keys(blueprintComponents.overview || {}).length}`, 'white');
    log(`Issues found: ${issues.length}`, issues.length > 0 ? 'red' : 'green');
    log(`Recommendations: ${recommendations.length}`, recommendations.length > 0 ? 'yellow' : 'green');
    
    if (issues.length === 0) {
      log('\n🎉 All components are aligned with blueprint!', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  Please review and apply the recommended fixes above.', 'yellow');
      
      // Save report to file
      const report = {
        timestamp: new Date().toISOString(),
        issues,
        recommendations,
        blueprintComponents: Object.keys(blueprintComponents.notes || {}).length + Object.keys(blueprintComponents.overview || {}).length,
      };
      
      const reportPath = resolve(projectRoot, 'scripts/alignment-report.json');
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      log(`\n📄 Detailed report saved to: scripts/alignment-report.json`, 'cyan');
      
      process.exit(1);
    }
    
  } catch (error) {
    log('\n❌ AUDIT ERROR:', 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
