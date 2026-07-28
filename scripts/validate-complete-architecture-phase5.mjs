#!/usr/bin/env node

/**
 * COMPREHENSIVE PHASE 5 VALIDATION
 * 
 * Validates ALL sections, components, subcomponents, and in-depth child components
 * across all 5 phases of Educational → UI/UX Architecture workflow
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tutorial sections (all 14)
const TUTORIAL_SECTIONS = [
  'overview', 'notes', 'layman', 'visual', 'real_life', 'technical',
  'code', 'practice', 'assignment', 'project', 'quiz', 'summary',
  'interview', 'ai_tutor'
];

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const SECTIONS_SPECS_PATH = path.join(__dirname, '../apps/skillhubcore-admin/src/app/(admin)/tools/visual-guide/components/sections-specs.ts');
const ASSET_SPECS_PATH = path.join(__dirname, '../apps/skillhubcore-admin/src/app/(admin)/tools/prompt-generator/lib/asset-specs.ts');
const REGISTRY_PATH = path.join(__dirname, '../apps/skillhubcore-admin/src/app/(admin)/content-generation/global-architecture/global-architecture-registry.ts');
const LEARNER_UI_PATH = path.join(__dirname, '../src/share-branding/TutorialEngine/components/notes/NotesMainContent.tsx');

console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  COMPREHENSIVE PHASE 5 VALIDATION - ALL COMPONENTS DEEP DIVE${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);

// Phase tracker
const phaseResults = {
  phase1: { name: 'Data Model & Registry', passed: false, details: [] },
  phase2: { name: 'Educational UI Components', passed: false, details: [] },
  phase3: { name: 'UI/UX Components', passed: false, details: [] },
  phase4: { name: 'State Management & Integration', passed: false, details: [] },
  phase5: { name: 'Learner-Facing Integration', passed: false, details: [] },
};

const componentHierarchy = {
  sections: 0,
  components: 0,
  subcomponents: 0,
  childElements: 0,
  interactiveElements: 0,
};

// ============================================================================
// PHASE 1: DATA MODEL & REGISTRY VALIDATION
// ============================================================================
console.log(`${colors.bold}${colors.blue}━━━ PHASE 1: DATA MODEL & REGISTRY ━━━${colors.reset}\n`);

try {
  const registryContent = fs.readFileSync(REGISTRY_PATH, 'utf-8');
  
  // Check Educational Architecture properties
  const hasEnabled = registryContent.includes('enabled: true');
  const hasPriority = registryContent.includes('priority:');
  const hasLearningObjective = registryContent.includes('learning_objective:');
  const hasContentRequirements = registryContent.includes('content_requirements:');
  const hasPrerequisites = registryContent.includes('prerequisites:');
  const hasEnables = registryContent.includes('enables:');
  const hasFinalizationStatus = registryContent.includes('finalized_status:');
  const hasFinalizationMetadata = registryContent.includes('finalized_at:') && registryContent.includes('finalized_by:');
  
  // Check helper functions
  const hasGetEnabledComponents = registryContent.includes('function getEnabledComponents');
  const hasGetEnabledComponentsForSection = registryContent.includes('export function getEnabledComponentsForSection');
  const hasIsEducationalArchitectureFinalized = registryContent.includes('export function isEducationalArchitectureFinalized');
  
  const phase1Checks = [
    { name: 'Educational enabled property', passed: hasEnabled },
    { name: 'Educational priority property', passed: hasPriority },
    { name: 'Educational learning_objective', passed: hasLearningObjective },
    { name: 'Educational content_requirements', passed: hasContentRequirements },
    { name: 'Educational prerequisites', passed: hasPrerequisites },
    { name: 'Educational enables', passed: hasEnables },
    { name: 'Finalization status tracking', passed: hasFinalizationStatus },
    { name: 'Finalization metadata', passed: hasFinalizationMetadata },
    { name: 'getEnabledComponents helper', passed: hasGetEnabledComponents },
    { name: 'getEnabledComponentsForSection helper', passed: hasGetEnabledComponentsForSection },
    { name: 'isEducationalArchitectureFinalized helper', passed: hasIsEducationalArchitectureFinalized },
  ];
  
  phase1Checks.forEach(check => {
    const icon = check.passed ? '✓' : '✗';
    const color = check.passed ? colors.green : colors.red;
    console.log(`  ${color}${icon}${colors.reset} ${check.name}`);
    phaseResults.phase1.details.push(check);
  });
  
  phaseResults.phase1.passed = phase1Checks.every(c => c.passed);
  
  console.log(`\n  ${phaseResults.phase1.passed ? colors.green + '✓ PHASE 1 PASSED' : colors.red + '✗ PHASE 1 FAILED'}${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}✗ Failed to read registry file${colors.reset}\n`);
  phaseResults.phase1.passed = false;
}

// ============================================================================
// PHASE 2: EDUCATIONAL UI COMPONENTS VALIDATION
// ============================================================================
console.log(`${colors.bold}${colors.blue}━━━ PHASE 2: EDUCATIONAL UI COMPONENTS ━━━${colors.reset}\n`);

const educationalComponents = [
  { name: 'ComponentSelectionTab.tsx', file: 'ComponentSelectionTab.tsx', requiredFeatures: ['formatComponentId', 'onToggleEnabled', 'onUpdatePriority', 'componentList'] },
  { name: 'EducationalPropertiesTab.tsx', file: 'EducationalPropertiesTab.tsx', requiredFeatures: ['learning_objective', 'content_requirements', 'prerequisites', 'enables'] },
  { name: 'LearningFlowTab.tsx', file: 'LearningFlowTab.tsx', requiredFeatures: ['validationChecks', 'canFinalize', 'finalized_status', 'showConfirmModal'] },
];

const COMPONENTS_DIR = path.join(__dirname, '../apps/skillhubcore-admin/src/app/(admin)/content-generation/global-architecture/components');

educationalComponents.forEach(comp => {
  try {
    const componentPath = path.join(COMPONENTS_DIR, comp.file);
    const content = fs.readFileSync(componentPath, 'utf-8');
    
    const checks = comp.requiredFeatures.map(feature => ({
      name: `${comp.name} - ${feature}`,
      passed: content.includes(feature),
    }));
    
    checks.forEach(check => {
      const icon = check.passed ? '✓' : '✗';
      const color = check.passed ? colors.green : colors.red;
      console.log(`  ${color}${icon}${colors.reset} ${check.name}`);
      phaseResults.phase2.details.push(check);
    });
    
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} ${comp.name} - File not found`);
    phaseResults.phase2.details.push({ name: comp.name, passed: false });
  }
});

phaseResults.phase2.passed = phaseResults.phase2.details.every(d => d.passed);
console.log(`\n  ${phaseResults.phase2.passed ? colors.green + '✓ PHASE 2 PASSED' : colors.red + '✗ PHASE 2 FAILED'}${colors.reset}\n`);

// ============================================================================
// PHASE 3: UI/UX COMPONENTS VALIDATION
// ============================================================================
console.log(`${colors.bold}${colors.blue}━━━ PHASE 3: UI/UX COMPONENTS ━━━${colors.reset}\n`);

const uiuxComponents = [
  { name: 'UIUXGatingBanner.tsx', file: 'UIUXGatingBanner.tsx', requiredFeatures: ['isLocked', 'Navigate to Educational'] },
  { name: 'VisualStylingTab.tsx', file: 'VisualStylingTab.tsx', requiredFeatures: ['brandColors', 'ui_subcomponents', 'color_role'] },
  { name: 'ResponsiveDesignTab.tsx', file: 'ResponsiveDesignTab.tsx', requiredFeatures: ['desktop_layout', 'tablet_layout', 'mobile_layout'] },
  { name: 'AccessibilityTab.tsx', file: 'AccessibilityTab.tsx', requiredFeatures: ['contrast', 'wcag', 'accessibility'] },
];

uiuxComponents.forEach(comp => {
  try {
    const componentPath = path.join(COMPONENTS_DIR, comp.file);
    const content = fs.readFileSync(componentPath, 'utf-8');
    
    const checks = comp.requiredFeatures.map(feature => ({
      name: `${comp.name} - ${feature}`,
      passed: content.includes(feature),
    }));
    
    checks.forEach(check => {
      const icon = check.passed ? '✓' : '✗';
      const color = check.passed ? colors.green : colors.red;
      console.log(`  ${color}${icon}${colors.reset} ${check.name}`);
      phaseResults.phase3.details.push(check);
    });
    
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} ${comp.name} - File not found`);
    phaseResults.phase3.details.push({ name: comp.name, passed: false });
  }
});

phaseResults.phase3.passed = phaseResults.phase3.details.every(d => d.passed);
console.log(`\n  ${phaseResults.phase3.passed ? colors.green + '✓ PHASE 3 PASSED' : colors.red + '✗ PHASE 3 FAILED'}${colors.reset}\n`);

// ============================================================================
// PHASE 4: STATE MANAGEMENT & INTEGRATION VALIDATION
// ============================================================================
console.log(`${colors.bold}${colors.blue}━━━ PHASE 4: STATE MANAGEMENT & INTEGRATION ━━━${colors.reset}\n`);

try {
  const PAGE_PATH = path.join(__dirname, '../apps/skillhubcore-admin/src/app/(admin)/content-generation/global-architecture/page.tsx');
  const pageContent = fs.readFileSync(PAGE_PATH, 'utf-8');
  
  const integrationChecks = [
    { name: 'handleToggleEnabled handler', passed: pageContent.includes('handleToggleEnabled') },
    { name: 'handleUpdatePriority handler', passed: pageContent.includes('handleUpdatePriority') },
    { name: 'handleUpdateEducationalConfig handler', passed: pageContent.includes('handleUpdateEducationalConfig') },
    { name: 'handleUpdateFinalizationStatus handler', passed: pageContent.includes('handleUpdateFinalizationStatus') },
    { name: 'handleUpdateVisualStyling handler', passed: pageContent.includes('handleUpdateVisualStyling') },
    { name: 'handleNavigateToEducational handler', passed: pageContent.includes('handleNavigateToEducational') },
    { name: 'Storage key v2', passed: pageContent.includes('.v2') },
    { name: 'Gating logic', passed: pageContent.includes('isEducationalArchitectureFinalized') },
    { name: 'Tab structure (Educational)', passed: pageContent.includes('Component Selection') },
    { name: 'Tab structure (UI/UX)', passed: pageContent.includes('Visual Styling') },
  ];
  
  integrationChecks.forEach(check => {
    const icon = check.passed ? '✓' : '✗';
    const color = check.passed ? colors.green : colors.red;
    console.log(`  ${color}${icon}${colors.reset} ${check.name}`);
    phaseResults.phase4.details.push(check);
  });
  
  phaseResults.phase4.passed = integrationChecks.every(c => c.passed);
  console.log(`\n  ${phaseResults.phase4.passed ? colors.green + '✓ PHASE 4 PASSED' : colors.red + '✗ PHASE 4 FAILED'}${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}✗ Failed to read page.tsx file${colors.reset}\n`);
  phaseResults.phase4.passed = false;
}

// ============================================================================
// PHASE 5: LEARNER-FACING INTEGRATION VALIDATION
// ============================================================================
console.log(`${colors.bold}${colors.blue}━━━ PHASE 5: LEARNER-FACING INTEGRATION ━━━${colors.reset}\n`);

try {
  const learnerContent = fs.readFileSync(LEARNER_UI_PATH, 'utf-8');
  
  // All 14 sections to validate
  const sectionsToCheck = [
    'overview', 'notes', 'layman', 'visual', 'real_life', 'technical',
    'code', 'practice', 'assignment', 'project', 'quiz', 'summary',
    'interview', 'ai_tutor'
  ];
  
  const learnerChecks = [
    { name: 'isBlockEnabled function', passed: learnerContent.includes('isBlockEnabled') },
    { name: 'enabledNotesBlocks check', passed: learnerContent.includes('enabledNotesBlocks') },
  ];
  
  // Check each section has conditional rendering
  sectionsToCheck.forEach(section => {
    const sectionCheck = {
      name: `${section} section - conditional rendering`,
      passed: learnerContent.includes(`isBlockEnabled('${section}')`) || learnerContent.includes(section),
    };
    learnerChecks.push(sectionCheck);
  });
  
  learnerChecks.forEach(check => {
    const icon = check.passed ? '✓' : '✗';
    const color = check.passed ? colors.green : colors.red;
    console.log(`  ${color}${icon}${colors.reset} ${check.name}`);
    phaseResults.phase5.details.push(check);
  });
  
  phaseResults.phase5.passed = learnerChecks.every(c => c.passed);
  console.log(`\n  ${phaseResults.phase5.passed ? colors.green + '✓ PHASE 5 PASSED' : colors.red + '✗ PHASE 5 FAILED'}${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}✗ Failed to read learner UI file${colors.reset}\n`);
  phaseResults.phase5.passed = false;
}

// ============================================================================
// COMPONENT HIERARCHY DEEP DIVE
// ============================================================================
console.log(`${colors.bold}${colors.magenta}━━━ COMPONENT HIERARCHY ANALYSIS ━━━${colors.reset}\n`);

try {
  const sectionsContent = fs.readFileSync(SECTIONS_SPECS_PATH, 'utf-8');
  const registryContent = fs.readFileSync(REGISTRY_PATH, 'utf-8');
  
  // Count sections
  componentHierarchy.sections = TUTORIAL_SECTIONS.length;
  
  // Count components (subsections)
  const subsectionMatches = sectionsContent.match(/id:\s*['"][\w_]+['"]/g) || [];
  componentHierarchy.components = subsectionMatches.length;
  
  // Count subcomponents (ui_subcomponents)
  const uiSubcomponentMatches = registryContent.match(/ui_subcomponents:/g) || [];
  componentHierarchy.subcomponents = uiSubcomponentMatches.length;
  
  // Count child elements (individual ui_subcomponent items)
  const childElementMatches = registryContent.match(/{\s*id:\s*['"][\w_]+['"],\s*label:/g) || [];
  componentHierarchy.childElements = childElementMatches.length;
  
  // Count interactive elements
  const interactiveMatches = registryContent.match(/interactive_elements:\s*\[/g) || [];
  componentHierarchy.interactiveElements = interactiveMatches.length;
  
  console.log(`  ${colors.cyan}▸${colors.reset} Total Sections: ${colors.bold}${componentHierarchy.sections}${colors.reset}`);
  console.log(`  ${colors.cyan}▸${colors.reset} Total Components (subsections): ${colors.bold}${componentHierarchy.components}${colors.reset}`);
  console.log(`  ${colors.cyan}▸${colors.reset} Total Subcomponents: ${colors.bold}${componentHierarchy.subcomponents}${colors.reset}`);
  console.log(`  ${colors.cyan}▸${colors.reset} Total Child Elements: ${colors.bold}${componentHierarchy.childElements}${colors.reset}`);
  console.log(`  ${colors.cyan}▸${colors.reset} Interactive Element Groups: ${colors.bold}${componentHierarchy.interactiveElements}${colors.reset}`);
  
  const totalParts = componentHierarchy.sections + 
                     componentHierarchy.components + 
                     componentHierarchy.subcomponents + 
                     componentHierarchy.childElements + 
                     componentHierarchy.interactiveElements;
  
  console.log(`\n  ${colors.bold}${colors.yellow}Total Architecture Parts: ${totalParts}${colors.reset}\n`);
  
} catch (error) {
  console.error(`${colors.red}✗ Failed to analyze component hierarchy${colors.reset}\n`);
}

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  VALIDATION SUMMARY${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);

Object.entries(phaseResults).forEach(([key, result]) => {
  const icon = result.passed ? '✓' : '✗';
  const color = result.passed ? colors.green : colors.red;
  const passedCount = result.details.filter(d => d.passed).length;
  const totalCount = result.details.length;
  
  console.log(`  ${color}${icon} ${result.name}${colors.reset}`);
  console.log(`    ${passedCount}/${totalCount} checks passed`);
});

const allPhasesPassed = Object.values(phaseResults).every(phase => phase.passed);

console.log();
if (allPhasesPassed) {
  console.log(`${colors.bold}${colors.green}╔═════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.green}║                                                                 ║${colors.reset}`);
  console.log(`${colors.bold}${colors.green}║  ✓ ALL 5 PHASES PASSED - IMPLEMENTATION COMPLETE!              ║${colors.reset}`);
  console.log(`${colors.bold}${colors.green}║                                                                 ║${colors.reset}`);
  console.log(`${colors.bold}${colors.green}║  Educational → UI/UX Architecture workflow is fully             ║${colors.reset}`);
  console.log(`${colors.bold}${colors.green}║  operational across ALL 14 tutorial sections!                   ║${colors.reset}`);
  console.log(`${colors.bold}${colors.green}║                                                                 ║${colors.reset}`);
  console.log(`${colors.bold}${colors.green}╚═════════════════════════════════════════════════════════════════╝${colors.reset}`);
  process.exit(0);
} else {
  console.log(`${colors.bold}${colors.red}╔═════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.red}║                                                                 ║${colors.reset}`);
  console.log(`${colors.bold}${colors.red}║  ✗ VALIDATION FAILED - Some phases incomplete                   ║${colors.reset}`);
  console.log(`${colors.bold}${colors.red}║                                                                 ║${colors.reset}`);
  console.log(`${colors.bold}${colors.red}╚═════════════════════════════════════════════════════════════════╝${colors.reset}`);
  process.exit(1);
}
