/**
 * Phase 1 P0 Foundation - Seed Default Architectures
 * Seeds educational and UI architectures for immediate use
 */

import { db } from '../../db';
import { educationalArchitectures, uiArchitectures } from '../../schema';

type SectionSequenceItem = {
  sectionType: string;
  isRequired: boolean;
  order: number;
  subsectionDepth: 'shallow' | 'medium' | 'deep';
  estimatedTime: number;
};

type SectionRenderer = {
  sectionType: string;
  componentName: string;
  layoutConfig: {
    spacing: string;
    maxWidth: string;
    imagePosition: 'right' | 'bottom' | 'inline';
    codeTheme: string;
    cardStyle: 'elevated' | 'flat' | 'outlined';
  };
};

export async function seedDefaultArchitectures() {
  console.log('🌱 Seeding default architectures...\n');

  // Seed Educational Architectures
  console.log('📚 Seeding educational architectures...');
  
  const educationalArchs: Array<{
    name: string;
    description: string;
    targetAudience: string[];
    sectionSequence: SectionSequenceItem[];
    interactivityLevel: string;
    visualDensity: string;
  }> = [
    {
      name: 'Beginner Friendly',
      description: 'Optimized for absolute beginners and career switchers',
      targetAudience: ['beginner', 'career_switcher'],
      sectionSequence: [
        { sectionType: 'layman', isRequired: true, order: 1, subsectionDepth: 'medium', estimatedTime: 10 },
        { sectionType: 'visual', isRequired: true, order: 2, subsectionDepth: 'shallow', estimatedTime: 8 },
        { sectionType: 'notes', isRequired: true, order: 3, subsectionDepth: 'shallow', estimatedTime: 15 },
        { sectionType: 'code', isRequired: true, order: 4, subsectionDepth: 'shallow', estimatedTime: 20 },
        { sectionType: 'practice', isRequired: true, order: 5, subsectionDepth: 'medium', estimatedTime: 25 },
        { sectionType: 'quiz', isRequired: false, order: 6, subsectionDepth: 'shallow', estimatedTime: 10 },
      ],
      interactivityLevel: 'high',
      visualDensity: 'high',
    },
    {
      name: 'Advanced Deep Dive',
      description: 'For experienced engineers and architects',
      targetAudience: ['advanced', 'architect', 'senior_engineer'],
      sectionSequence: [
        { sectionType: 'notes', isRequired: true, order: 1, subsectionDepth: 'medium', estimatedTime: 15 },
        { sectionType: 'technical', isRequired: true, order: 2, subsectionDepth: 'deep', estimatedTime: 30 },
        { sectionType: 'code', isRequired: true, order: 3, subsectionDepth: 'deep', estimatedTime: 25 },
        { sectionType: 'real_life', isRequired: true, order: 4, subsectionDepth: 'deep', estimatedTime: 20 },
        { sectionType: 'project', isRequired: true, order: 5, subsectionDepth: 'deep', estimatedTime: 60 },
        { sectionType: 'interview', isRequired: false, order: 6, subsectionDepth: 'deep', estimatedTime: 20 },
      ],
      interactivityLevel: 'medium',
      visualDensity: 'medium',
    },
    {
      name: 'Visual Learner',
      description: 'Optimized for visual and spatial learners',
      targetAudience: ['visual_learner', 'designer', 'architect'],
      sectionSequence: [
        { sectionType: 'visual', isRequired: true, order: 1, subsectionDepth: 'deep', estimatedTime: 20 },
        { sectionType: 'layman', isRequired: true, order: 2, subsectionDepth: 'medium', estimatedTime: 10 },
        { sectionType: 'notes', isRequired: true, order: 3, subsectionDepth: 'medium', estimatedTime: 15 },
        { sectionType: 'real_life', isRequired: true, order: 4, subsectionDepth: 'medium', estimatedTime: 15 },
        { sectionType: 'code', isRequired: false, order: 5, subsectionDepth: 'shallow', estimatedTime: 15 },
      ],
      interactivityLevel: 'high',
      visualDensity: 'high',
    },
    {
      name: 'Job Seeker',
      description: 'Focused on interview preparation and practical skills',
      targetAudience: ['job_seeker', 'interview_prep'],
      sectionSequence: [
        { sectionType: 'notes', isRequired: true, order: 1, subsectionDepth: 'medium', estimatedTime: 15 },
        { sectionType: 'code', isRequired: true, order: 2, subsectionDepth: 'medium', estimatedTime: 20 },
        { sectionType: 'interview', isRequired: true, order: 3, subsectionDepth: 'deep', estimatedTime: 30 },
        { sectionType: 'practice', isRequired: true, order: 4, subsectionDepth: 'deep', estimatedTime: 30 },
        { sectionType: 'real_life', isRequired: false, order: 5, subsectionDepth: 'medium', estimatedTime: 15 },
      ],
      interactivityLevel: 'high',
      visualDensity: 'medium',
    },
    {
      name: 'Quick Reference',
      description: 'Fast refresher for experienced developers',
      targetAudience: ['experienced', 'refresher'],
      sectionSequence: [
        { sectionType: 'summary', isRequired: true, order: 1, subsectionDepth: 'shallow', estimatedTime: 5 },
        { sectionType: 'code', isRequired: true, order: 2, subsectionDepth: 'shallow', estimatedTime: 10 },
        { sectionType: 'notes', isRequired: false, order: 3, subsectionDepth: 'shallow', estimatedTime: 10 },
      ],
      interactivityLevel: 'low',
      visualDensity: 'low',
    },
  ];

  for (const arch of educationalArchs) {
    await db.insert(educationalArchitectures).values(arch);
    console.log(`  ✅ ${arch.name}`);
  }

  // Seed UI Architectures
  console.log('\n🎨 Seeding UI architectures...');
  
  const uiArchs: Array<{
    name: string;
    description: string;
    sectionRenderers: SectionRenderer[];
    responsiveBreakpoints: { mobile: string; tablet: string; desktop: string };
    accessibilityProfile: string;
    compatibleBrands: string[];
  }> = [
    {
      name: 'Card Layout',
      description: 'Modern card-based layout with elevated shadows',
      sectionRenderers: [
        { sectionType: 'notes', componentName: 'CardRenderer', layoutConfig: { spacing: 'comfortable', maxWidth: '900px', imagePosition: 'inline', codeTheme: 'dracula', cardStyle: 'elevated' } },
        { sectionType: 'code', componentName: 'CodeCardRenderer', layoutConfig: { spacing: 'comfortable', maxWidth: '900px', imagePosition: 'inline', codeTheme: 'dracula', cardStyle: 'elevated' } },
        { sectionType: 'visual', componentName: 'DiagramCardRenderer', layoutConfig: { spacing: 'comfortable', maxWidth: '900px', imagePosition: 'inline', codeTheme: 'dracula', cardStyle: 'elevated' } },
      ],
      responsiveBreakpoints: { mobile: '640px', tablet: '768px', desktop: '1024px' },
      accessibilityProfile: 'standard',
      compatibleBrands: ['realtutorialhub', 'skillup'],
    },
    {
      name: 'List Layout',
      description: 'Compact list-based layout for quick scanning',
      sectionRenderers: [
        { sectionType: 'notes', componentName: 'ListRenderer', layoutConfig: { spacing: 'compact', maxWidth: '100%', imagePosition: 'right', codeTheme: 'github', cardStyle: 'flat' } },
        { sectionType: 'code', componentName: 'InlineCodeRenderer', layoutConfig: { spacing: 'compact', maxWidth: '100%', imagePosition: 'right', codeTheme: 'github', cardStyle: 'flat' } },
      ],
      responsiveBreakpoints: { mobile: '640px', tablet: '768px', desktop: '1024px' },
      accessibilityProfile: 'standard',
      compatibleBrands: ['realtutorialhub', 'skillup'],
    },
    {
      name: 'Immersive Layout',
      description: 'Full-screen immersive experience',
      sectionRenderers: [
        { sectionType: 'notes', componentName: 'ImmersiveRenderer', layoutConfig: { spacing: 'spacious', maxWidth: '1200px', imagePosition: 'inline', codeTheme: 'monokai', cardStyle: 'flat' } },
        { sectionType: 'visual', componentName: 'FullScreenDiagramRenderer', layoutConfig: { spacing: 'spacious', maxWidth: '1200px', imagePosition: 'inline', codeTheme: 'monokai', cardStyle: 'flat' } },
      ],
      responsiveBreakpoints: { mobile: '640px', tablet: '768px', desktop: '1280px' },
      accessibilityProfile: 'standard',
      compatibleBrands: ['realtutorialhub', 'skillup'],
    },
    {
      name: 'Accessibility Optimized',
      description: 'High contrast, screen reader friendly',
      sectionRenderers: [
        { sectionType: 'notes', componentName: 'AccessibleRenderer', layoutConfig: { spacing: 'comfortable', maxWidth: '800px', imagePosition: 'bottom', codeTheme: 'high-contrast', cardStyle: 'outlined' } },
      ],
      responsiveBreakpoints: { mobile: '640px', tablet: '768px', desktop: '1024px' },
      accessibilityProfile: 'high_contrast',
      compatibleBrands: ['realtutorialhub', 'skillup'],
    },
  ];

  for (const arch of uiArchs) {
    await db.insert(uiArchitectures).values(arch);
    console.log(`  ✅ ${arch.name}`);
  }

  console.log('\n✅ Default architectures seeded successfully\n');
}

if (require.main === module) {
  seedDefaultArchitectures()
    .then(() => {
      console.log('✅ Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}
