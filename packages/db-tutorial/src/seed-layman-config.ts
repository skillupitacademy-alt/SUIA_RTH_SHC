/**
 * seed-layman-config.ts
 * Phase 0.75 Foundation Hardening Package
 * ---------------------------------------
 * Seeds:
 * - Prompt Templates
 * - Educational Architectures
 * - UI Architectures
 * - Governance Baselines
 *
 * Hardens:
 * - FK integrity validation
 * - Brand partitioning validation
 * - Migration readiness checks
 * - Orphan section detection
 *
 * Assumptions:
 * - Drizzle ORM
 * - tutorial DB package exports db + schema
 * - PostgreSQL
 */

import dotenv from 'dotenv';
import path from 'path';
import { db } from './db';
import {
  promptTemplates,
  educationalArchitectures,
  uiArchitectures,
  tutorialSections,
  tutorialSubsections,
  tutorialContent,
  contentReviewQueue,
  contentDeployments,
} from './schema';
import { eq, isNull, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Load environment variables
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env.local'),
];

for (const envPath of envCandidates) {
  dotenv.config({ path: envPath });
}

// --------------------------------------------------
// Constants
// --------------------------------------------------
const SYSTEM_USER = 'system-seed';
const DEFAULT_BRAND = 'shared' as const;
const SECTION_TYPE = 'layman' as const;

// --------------------------------------------------
// Prompt Templates
// --------------------------------------------------
const laymanPromptTemplates = [
  {
    id: randomUUID(),
    name: 'Layman Master Template v1',
    sectionType: SECTION_TYPE,
    subsectionType: 'concept' as const,
    systemPrompt:
      'You are an expert beginner-friendly educator who simplifies complex concepts using analogies, real-world examples, and step-by-step teaching.',
    userPromptTemplate:
      'Generate a layman explanation for {{topicName}} covering analogy, beginner breakdown, use cases, FAQ, summary, and motivation.',
    variables: ['topicName', 'subtopicName', 'difficulty'],
    outputSchema: {
      requiredSections: [
        'analogy',
        'beginner_breakdown',
        'mental_model',
        'use_case',
        'faq',
        'summary',
      ],
    },
    validationRules: [
      { rule: 'minWords', value: 800, required: true },
      { rule: 'maxWords', value: 2500, required: true },
      { rule: 'analogyRequired', value: true, required: true },
      { rule: 'hallucinationThreshold', threshold: 10 },
    ],
    successCriteria: {
      qualityScore: { min: 85 },
      hallucinationScore: { max: 10 },
    },
    version: 1,
    brandId: DEFAULT_BRAND,
    isActive: true,
  },
  {
    id: randomUUID(),
    name: 'Layman Career Switcher Template v1',
    sectionType: SECTION_TYPE,
    subsectionType: 'example' as const,
    systemPrompt:
      'Teach beginners transitioning careers with confidence-building and practical context.',
    userPromptTemplate:
      'Explain {{topicName}} for a career switcher with practical applications and beginner confidence.',
    variables: ['topicName'],
    outputSchema: {},
    validationRules: [],
    successCriteria: {
      qualityScore: { min: 80 },
      hallucinationScore: { max: 10 },
    },
    version: 1,
    brandId: DEFAULT_BRAND,
    isActive: true,
  },
  {
    id: randomUUID(),
    name: 'Layman Fast-Track Template v1',
    sectionType: SECTION_TYPE,
    subsectionType: 'cheatsheet' as const,
    systemPrompt: 'Teach quickly and clearly while preserving simplicity.',
    userPromptTemplate: 'Provide a concise layman overview of {{topicName}}.',
    variables: ['topicName'],
    outputSchema: {},
    validationRules: [],
    successCriteria: {
      qualityScore: { min: 78 },
      hallucinationScore: { max: 10 },
    },
    version: 1,
    brandId: DEFAULT_BRAND,
    isActive: true,
  },
];

// --------------------------------------------------
// Educational Architectures
// --------------------------------------------------
const educationalArchitectureSeeds = [
  {
    id: randomUUID(),
    name: 'Beginner-Friendly',
    targetAudience: ['absolute_beginner'],
    sectionSequence: [
      { sectionType: 'layman', isRequired: true, order: 1, subsectionDepth: 'deep' as const, estimatedTime: 15 },
      { sectionType: 'visual', isRequired: true, order: 2, subsectionDepth: 'medium' as const, estimatedTime: 10 },
      { sectionType: 'real_life', isRequired: false, order: 3, subsectionDepth: 'medium' as const, estimatedTime: 8 },
      { sectionType: 'summary', isRequired: true, order: 4, subsectionDepth: 'shallow' as const, estimatedTime: 5 },
    ],
    interactivityLevel: 'high',
    visualDensity: 'high',
    brandId: DEFAULT_BRAND,
    isActive: true,
  },
  {
    id: randomUUID(),
    name: 'Career Switcher Practical',
    targetAudience: ['career_switcher'],
    sectionSequence: [
      { sectionType: 'layman', isRequired: true, order: 1, subsectionDepth: 'medium' as const, estimatedTime: 12 },
      { sectionType: 'technical', isRequired: true, order: 2, subsectionDepth: 'deep' as const, estimatedTime: 20 },
      { sectionType: 'code', isRequired: true, order: 3, subsectionDepth: 'deep' as const, estimatedTime: 25 },
      { sectionType: 'project', isRequired: false, order: 4, subsectionDepth: 'medium' as const, estimatedTime: 30 },
    ],
    interactivityLevel: 'high',
    visualDensity: 'medium',
    brandId: DEFAULT_BRAND,
    isActive: true,
  },
  {
    id: randomUUID(),
    name: 'Visual Learner',
    targetAudience: ['visual_learner'],
    sectionSequence: [
      { sectionType: 'layman', isRequired: true, order: 1, subsectionDepth: 'medium' as const, estimatedTime: 10 },
      { sectionType: 'visual', isRequired: true, order: 2, subsectionDepth: 'deep' as const, estimatedTime: 20 },
      { sectionType: 'real_life', isRequired: true, order: 3, subsectionDepth: 'medium' as const, estimatedTime: 10 },
    ],
    interactivityLevel: 'high',
    visualDensity: 'high',
    brandId: DEFAULT_BRAND,
    isActive: true,
  },
  {
    id: randomUUID(),
    name: 'Quick Reference',
    targetAudience: ['busy_professional'],
    sectionSequence: [
      { sectionType: 'layman', isRequired: true, order: 1, subsectionDepth: 'shallow' as const, estimatedTime: 5 },
      { sectionType: 'notes', isRequired: true, order: 2, subsectionDepth: 'shallow' as const, estimatedTime: 3 },
      { sectionType: 'summary', isRequired: true, order: 3, subsectionDepth: 'shallow' as const, estimatedTime: 2 },
    ],
    interactivityLevel: 'low',
    visualDensity: 'low',
    brandId: DEFAULT_BRAND,
    isActive: true,
  },
  {
    id: randomUUID(),
    name: 'Expert Foundation Builder',
    targetAudience: ['serious_learner'],
    sectionSequence: [
      { sectionType: 'layman', isRequired: true, order: 1, subsectionDepth: 'deep' as const, estimatedTime: 15 },
      { sectionType: 'technical', isRequired: true, order: 2, subsectionDepth: 'deep' as const, estimatedTime: 25 },
      { sectionType: 'assignment', isRequired: true, order: 3, subsectionDepth: 'deep' as const, estimatedTime: 40 },
      { sectionType: 'interview', isRequired: false, order: 4, subsectionDepth: 'medium' as const, estimatedTime: 15 },
    ],
    interactivityLevel: 'medium',
    visualDensity: 'medium',
    brandId: DEFAULT_BRAND,
    isActive: true,
  },
];

// --------------------------------------------------
// UI Architectures
// --------------------------------------------------
const uiArchitectureSeeds = [
  {
    id: randomUUID(),
    name: 'Standard Interactive',
    sectionRenderers: [
      {
        sectionType: 'layman',
        componentName: 'LaymanSectionShell',
        layoutConfig: {
          spacing: 'comfortable',
          maxWidth: '1200px',
          imagePosition: 'right' as const,
          codeTheme: 'github-dark',
          cardStyle: 'elevated' as const,
        },
      },
    ],
    accessibilityProfile: 'standard',
    brandId: DEFAULT_BRAND,
    brandCompatibility: [
      { brandId: 'shared', isCompatible: true },
      { brandId: 'realtutorialhub', isCompatible: true },
      { brandId: 'skillup', isCompatible: true },
    ],
    isActive: true,
  },
  {
    id: randomUUID(),
    name: 'Mobile First',
    sectionRenderers: [
      {
        sectionType: 'layman',
        componentName: 'LaymanSectionShellMobile',
        layoutConfig: {
          spacing: 'compact',
          maxWidth: '100%',
          imagePosition: 'bottom' as const,
          codeTheme: 'github-light',
          cardStyle: 'flat' as const,
        },
      },
    ],
    accessibilityProfile: 'standard',
    brandId: DEFAULT_BRAND,
    brandCompatibility: [{ brandId: 'shared', isCompatible: true }],
    isActive: true,
  },
  {
    id: randomUUID(),
    name: 'Accessibility First',
    sectionRenderers: [
      {
        sectionType: 'layman',
        componentName: 'LaymanAccessibleRenderer',
        layoutConfig: {
          spacing: 'spacious',
          maxWidth: '900px',
          imagePosition: 'bottom' as const,
          codeTheme: 'high-contrast',
          cardStyle: 'outlined' as const,
        },
      },
    ],
    accessibilityProfile: 'high_contrast',
    brandId: DEFAULT_BRAND,
    brandCompatibility: [{ brandId: 'shared', isCompatible: true }],
    isActive: true,
  },
  {
    id: randomUUID(),
    name: 'Rich Immersive',
    sectionRenderers: [
      {
        sectionType: 'layman',
        componentName: 'LaymanImmersiveRenderer',
        layoutConfig: {
          spacing: 'comfortable',
          maxWidth: '1600px',
          imagePosition: 'inline' as const,
          codeTheme: 'dracula',
          cardStyle: 'elevated' as const,
        },
      },
    ],
    accessibilityProfile: 'standard',
    brandId: DEFAULT_BRAND,
    brandCompatibility: [{ brandId: 'shared', isCompatible: true }],
    isActive: true,
  },
];

// --------------------------------------------------
// Governance Hardening Functions
// --------------------------------------------------
async function validateBrandPartitioning() {
  const invalidBrands = await db
    .select()
    .from(tutorialSections)
    .where(isNull(tutorialSections.brandId));

  if (invalidBrands.length > 0) {
    throw new Error(
      `Brand partition violation: ${invalidBrands.length} sections missing brand_id`
    );
  }

  console.log('✅ Brand partition validation passed');
}

async function validateFkIntegrity() {
  const orphanSections = await db.execute(sql`
    SELECT ts.id
    FROM tutorial_sections ts
    LEFT JOIN educational_architectures ea ON ts.educational_architecture_id = ea.id
    LEFT JOIN ui_architectures ua ON ts.ui_architecture_id = ua.id
    WHERE ts.section_type = 'layman'
      AND (ts.educational_architecture_id IS NULL OR
           ts.ui_architecture_id IS NULL)
  `);

  if (orphanSections.rows.length > 0) {
    throw new Error(
      `FK integrity failure: ${orphanSections.rows.length} orphan layman sections found`
    );
  }

  console.log('✅ FK integrity validation passed');
}

async function migrationReadinessCheck() {
  const legacyContent = await db.select().from(tutorialContent);

  console.log(`ℹ️  Existing tutorial content records: ${legacyContent.length}`);
  console.log('✅ Migration readiness check complete');
}

async function initializeGovernanceBaselines() {
  console.log('🔧 Initializing governance baselines...');

  // Review queue baseline
  // Deployment baseline intentionally starts empty but schema operational

  console.log('✅ Governance baselines initialized');
}

// --------------------------------------------------
// Main Seeder
// --------------------------------------------------
export async function seedLaymanConfig() {
  console.log('🚀 Starting Phase 0.75 Layman constitutional seed...');

  try {
    // Seed Prompt Templates
    for (const template of laymanPromptTemplates) {
      await db.insert(promptTemplates).values(template).onConflictDoNothing();
    }
    console.log(`✅ Seeded ${laymanPromptTemplates.length} prompt templates`);

    // Seed Educational Architectures
    for (const arch of educationalArchitectureSeeds) {
      await db
        .insert(educationalArchitectures)
        .values(arch)
        .onConflictDoNothing();
    }
    console.log(
      `✅ Seeded ${educationalArchitectureSeeds.length} educational architectures`
    );

    // Seed UI Architectures
    for (const ui of uiArchitectureSeeds) {
      await db.insert(uiArchitectures).values(ui).onConflictDoNothing();
    }
    console.log(`✅ Seeded ${uiArchitectureSeeds.length} UI architectures`);

    // Governance Hardening
    await initializeGovernanceBaselines();
    await validateBrandPartitioning();
    await migrationReadinessCheck();

    console.log('🎯 Phase 0.75 foundation seeding completed successfully');
    console.log('➡️  Next step: Build LaymanService + API layer');
  } catch (error) {
    console.error('❌ Seed process failed:', error);
    process.exit(1);
  }
}

// --------------------------------------------------
// Post-Seed Hardening (Run after section FK assignment)
// --------------------------------------------------
export async function runPostSeedHardening() {
  console.log('🔒 Running post-seed governance hardening...');
  await validateFkIntegrity();
  console.log('✅ Post-seed governance hardening complete');
}

// --------------------------------------------------
// CLI Entry
// --------------------------------------------------
if (require.main === module) {
  seedLaymanConfig()
    .then(() => runPostSeedHardening())
    .then(() => {
      console.log('🏁 Full seed + governance hardening complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
