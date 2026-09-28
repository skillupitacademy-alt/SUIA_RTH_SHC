/**
 * Phase 2B.18 Step 1.3 E2E Test Fixtures
 * 
 * Real Java tutorial fixture from database for instructional auto-completion testing.
 * All constants reflect actual published data as of 2026-09-28.
 */

/**
 * Java "What is Java?" tutorial - D1 (definition) block
 * 
 * - navigationNodeId: whatisjava
 * - blockType: definition
 * - expectedTimeSec: 210
 * - progressRole (database): undefined
 * - progressRole (resolver default): instructional
 * - Auto-completion threshold (80%): 168 seconds
 * 
 * This is the fastest instructional block in the Java tutorial,
 * making it optimal for E2E certification (2.8 minute wait vs 5-6 minutes).
 */
export const JAVA_WHATISJAVA_D1 = {
  // Navigation and identity
  navigationNodeId: 'whatisjava',
  subtopicId: '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
  sectionId: '45f4e65b-2178-4bca-867e-9377f064fb20',
  blockId: '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749',
  blockVersion: 'D1',
  
  // Block metadata
  blockType: 'definition',
  expectedTimeSec: 210,
  
  // Auto-completion calculation
  completionThresholdPercent: 0.8,
  completionThresholdSec: 168, // 80% of 210
  
  // Tutorial URL
  tutorialPath: '/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1',
  blockPath: '/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava',
} as const;

/**
 * Feature flag for auto-completion orchestrator
 */
export const AUTO_COMPLETION_FLAG = 'NEXT_PUBLIC_ENABLE_AUTO_COMPLETION';

/**
 * Test selectors and attributes
 */
export const SELECTORS = {
  autoCompletionEnabled: '[data-auto-completion-enabled="true"]',
  autoCompletionDisabled: '[data-auto-completion-enabled="false"]',
  tutorialBlock: '[data-testid="tutorial-block"]',
  nextBlockButton: '[data-testid="next-block-button"]',
  completeButton: '[data-testid="complete-button"]',
} as const;
