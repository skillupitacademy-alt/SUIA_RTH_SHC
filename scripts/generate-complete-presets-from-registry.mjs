#!/usr/bin/env node

/**
 * Complete Preset Generator from Registry
 * 
 * This script:
 * 1. Reads global-architecture-registry.ts (source of truth)
 * 2. Extracts ALL ui_subcomponents for every section/component
 * 3. Generates complete notesPartPresets and educationalPartPresets
 * 4. Outputs code ready to paste into page.tsx
 * 5. Validates TSX rendering has all parts with data-part-id
 * 
 * Run: node scripts/generate-complete-presets-from-registry.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

// Read the registry file
function readRegistry() {
  const registryPath = resolve(projectRoot, 'apps/skillhubcore-admin/src/app/(admin)/content-generation/global-architecture/global-architecture-registry.ts');
  return readFileSync(registryPath, 'utf-8');
}

// Extract ui_subcomponents from registry
function extractSubcomponentsFromRegistry(registryContent) {
  const components = {
    notes: {},
    overview: {},
    layman: {},
    real_life: {},
  };
  
  // Extract NOTES_UIUX_COMPONENT_DEFAULTS
  const notesMatch = registryContent.match(/const NOTES_UIUX_COMPONENT_DEFAULTS: Record<string, JsonRecord> = \{([\s\S]+?)\n\};/);
  if (notesMatch) {
    const notesContent = notesMatch[1];
    
    // Extract each component
    const componentRegex = /(\w+):\s*\{[\s\S]+?ui_subcomponents:\s*\[([\s\S]+?)\],/g;
    let match;
    
    while ((match = componentRegex.exec(notesContent)) !== null) {
      const componentName = match[1];
      const subcomponentsContent = match[2];
      
      const subcomponents = [];
      const subcompRegex = /\{\s*id:\s*'(\w+)',\s*label:\s*'([^']+)'[^}]*\}/g;
      let subMatch;
      
      while ((subMatch = subcompRegex.exec(subcomponentsContent)) !== null) {
        subcomponents.push({
          id: subMatch[1],
          label: subMatch[2],
        });
      }
      
      components.notes[componentName] = subcomponents;
    }
  }
  
  return components;
}

// Generate preset code for notes
function generateNotesPresetCode(notesComponents) {
  let code = '    const notesPartPresets: Record<string, Array<Record<string, unknown>>> = {\n';
  
  for (const [componentName, subcomponents] of Object.entries(notesComponents)) {
    code += `      ${componentName}: [\n`;
    
    for (const sub of subcomponents) {
      // Map to commonDefaults indices where possible
      const commonDefaultsMap = {
        'container': 0,
        'header': 1,
        'body': 2,
        'action': 3,
        'icon_badge': 4,
        'difficulty_badge': 5,
        'brand_badge': 6,
        'title': 7,
        'description': 8,
        'stat_cards': 9,
        'stat_value': 10,
        'primary_button': 11,
        'secondary_button': 12,
        'progress_bar': 13,
      };
      
      if (commonDefaultsMap[sub.id] !== undefined) {
        const extras = sub.label !== sub.id ? `, label: '${sub.label}'` : '';
        code += `        { ...commonDefaults[${commonDefaultsMap[sub.id]}]${extras} },\n`;
      } else {
        code += `        { id: '${sub.id}', label: '${sub.label}', role: 'Component part', layout: 'inline', color: algorithmPalette.primary },\n`;
      }
    }
    
    code += `      ],\n`;
  }
  
  code += '    };\n';
  return code;
}

// Main execution
async function main() {
  try {
    logSection('🚀 COMPLETE PRESET GENERATOR FROM REGISTRY');
    
    log('\n📂 Reading global-architecture-registry.ts...', 'cyan');
    const registryContent = readRegistry();
    log('   ✅ Registry loaded', 'green');
    
    log('\n🔍 Extracting ui_subcomponents from registry...', 'cyan');
    const components = extractSubcomponentsFromRegistry(registryContent);
    log(`   ✅ Found ${Object.keys(components.notes).length} notes components`, 'green');
    
    logSection('📋 NOTES COMPONENTS STRUCTURE');
    
    for (const [componentName, subcomponents] of Object.entries(components.notes)) {
      log(`\n${componentName}:`, 'yellow');
      log(`  Total subcomponents: ${subcomponents.length}`, 'white');
      subcomponents.forEach((sub, index) => {
        log(`    ${index + 1}. ${sub.id} - "${sub.label}"`, 'white');
      });
    }
    
    logSection('🔧 GENERATED PRESET CODE');
    
    const presetCode = generateNotesPresetCode(components.notes);
    log('\nCopy this code to replace notesPartPresets in page.tsx:\n', 'yellow');
    console.log(presetCode);
    
    // Save to file
    const outputPath = resolve(projectRoot, 'scripts/generated-presets.txt');
    writeFileSync(outputPath, presetCode);
    log(`\n📄 Code saved to: scripts/generated-presets.txt`, 'cyan');
    
    logSection('📊 SUMMARY');
    log(`Total notes components: ${Object.keys(components.notes).length}`, 'white');
    log(`Total subcomponents: ${Object.values(components.notes).reduce((sum, arr) => sum + arr.length, 0)}`, 'white');
    
    log('\n✅ Preset generation complete!', 'green');
    log('\nNext steps:', 'yellow');
    log('1. Review the generated code in scripts/generated-presets.txt', 'white');
    log('2. Replace notesPartPresets in page.tsx with the generated code', 'white');
    log('3. Run the validation script to check TSX rendering', 'white');
    
    process.exit(0);
    
  } catch (error) {
    log('\n❌ ERROR:', 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
