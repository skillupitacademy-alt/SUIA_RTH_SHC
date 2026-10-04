/**
 * Project LLM Creation Brief Engine Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateCreationBrief,
  generateI2CreationBrief,
  assertRepositoryIntelligenceIntegrity,
  resolveFamilyName,
  resolveTargetVersion,
  resolveReference,
  buildConstraints,
  buildRuntimeRequirements,
  buildValidationChecklist,
  buildExternalAiWorkflow,
  buildHumanApprovalGate,
  buildProhibitedActions,
  buildObjectives,
} from './projectLlmCreationBrief';
import { CreationBriefRequest } from '@quiz/types';

describe('projectLlmCreationBrief', () => {
  describe('assertRepositoryIntelligenceIntegrity', () => {
    it('passes when repository intelligence is valid', () => {
      expect(() => assertRepositoryIntelligenceIntegrity()).not.toThrow();
    });

    // Note: Integrity check runs at module initialization, so mocking tests
    // would require unstable module mocking patterns. Testing integrity failure
    // paths is deferred to integration tests where corpus mutations can be
    // simulated safely.
  });

  describe('resolveFamilyName', () => {
    it('resolves Introduction family name', () => {
      expect(resolveFamilyName('I')).toBe('Introduction');
    });

    it('resolves Code family name', () => {
      expect(resolveFamilyName('C')).toBe('Code');
    });

    it('resolves Definition family name', () => {
      expect(resolveFamilyName('D')).toBe('Definition');
    });

    it('returns undefined for unknown family', () => {
      expect(resolveFamilyName('ZZZ')).toBeUndefined();
    });
  });

  describe('resolveTargetVersion', () => {
    it('returns true when version exists in family', () => {
      expect(resolveTargetVersion('I', 'I2')).toBe(true);
    });

    it('returns false when version does not exist', () => {
      expect(resolveTargetVersion('I', 'I99')).toBe(false);
    });

    it('returns false when family does not exist', () => {
      expect(resolveTargetVersion('ZZZ', 'ZZZ1')).toBe(false);
    });
  });

  describe('resolveReference', () => {
    it('returns I1 reference for Introduction family', () => {
      const ref = resolveReference('I');
      expect(ref).toBeDefined();
      expect(ref?.versionId).toBe('I1');
      expect(ref?.familyId).toBe('I');
      expect(ref?.familyName).toBe('Introduction');
      expect(ref?.status).toBe('RUNTIME_INTEGRATED');
    });

    it('returns C1 reference for Code family', () => {
      const ref = resolveReference('C');
      expect(ref).toBeDefined();
      expect(ref?.versionId).toBe('C1');
    });

    it('returns D1 reference for Definition family', () => {
      const ref = resolveReference('D');
      expect(ref).toBeDefined();
      expect(ref?.versionId).toBe('D1');
    });

    it('returns undefined for families without verified references', () => {
      const ref = resolveReference('O');
      expect(ref).toBeUndefined();
    });
  });

  describe('buildConstraints', () => {
    it('returns 8 constraints', () => {
      const constraints = buildConstraints();
      expect(constraints).toHaveLength(8);
    });

    it('includes E-001 Prototype First constraint with correct instruction', () => {
      const constraints = buildConstraints();
      const e001 = constraints.find((c) => c.id === 'E-001');
      expect(e001).toBeDefined();
      expect(e001?.severity).toBe('MANDATORY');
      expect(e001?.title).toBe('Prototype First');
      expect(e001?.instruction).toContain('HTML/CSS/JS/JSON prototype');
      expect(e001?.instruction).toContain('before any React/TypeScript');
    });

    it('includes E-002 Human GUI Approval Required constraint with STOP instruction', () => {
      const constraints = buildConstraints();
      const e002 = constraints.find((c) => c.id === 'E-002');
      expect(e002).toBeDefined();
      expect(e002?.severity).toBe('MANDATORY');
      expect(e002?.instruction).toContain('STOP');
      expect(e002?.instruction).toContain('explicit human approval');
    });

    it('includes UBRC Compatibility constraint with DOM attribute requirements', () => {
      const constraints = buildConstraints();
      const ubrc = constraints.find((c) => c.id === 'E-004');
      expect(ubrc).toBeDefined();
      expect(ubrc?.severity).toBe('REQUIRED');
      expect(ubrc?.instruction).toContain('data-block-type');
      expect(ubrc?.instruction).toContain('data-block-version');
      expect(ubrc?.instruction).toContain('data-block-id');
    });

    it('includes prohibited constraints with specific platform component restrictions', () => {
      const constraints = buildConstraints();
      const prohibited = constraints.filter((c) => c.severity === 'PROHIBITED');
      expect(prohibited.length).toBeGreaterThan(0);
      
      const e007 = constraints.find((c) => c.id === 'E-007');
      expect(e007?.instruction).toContain('ILS');
      expect(e007?.instruction).toContain('LSNB');
      expect(e007?.instruction).toContain('RSSB');
      
      const e008 = constraints.find((c) => c.id === 'E-008');
      expect(e008?.instruction).toContain('commit');
      expect(e008?.instruction).toContain('push');
      expect(e008?.instruction).toContain('deploy');
    });
  });

  describe('buildRuntimeRequirements', () => {
    it('returns 8 runtime requirements', () => {
      const requirements = buildRuntimeRequirements();
      expect(requirements).toHaveLength(8);
    });

    it('includes UBRC requirement with specific DOM attribute names', () => {
      const requirements = buildRuntimeRequirements();
      const ubrc = requirements.find((r) => r.includes('UBRC'));
      expect(ubrc).toBeDefined();
      expect(ubrc).toContain('data-block-type');
      expect(ubrc).toContain('data-block-version');
      expect(ubrc).toContain('data-block-id');
    });

    it('includes no ILS API calls requirement', () => {
      const requirements = buildRuntimeRequirements();
      const ils = requirements.find((r) => r.includes('ILS'));
      expect(ils).toBeDefined();
      expect(ils).toContain('must not call');
    });

    it('includes LSNB and RSSB infrastructure restrictions', () => {
      const requirements = buildRuntimeRequirements();
      const lsnb = requirements.find((r) => r.includes('LSNB'));
      const rssb = requirements.find((r) => r.includes('RSSB'));
      expect(lsnb).toBeDefined();
      expect(rssb).toBeDefined();
      expect(lsnb).toContain('must not embed');
      expect(rssb).toContain('must not embed');
    });
  });

  describe('buildValidationChecklist', () => {
    it('returns 12 checklist items', () => {
      const checklist = buildValidationChecklist();
      expect(checklist).toHaveLength(12);
    });

    it('includes GUI prototype review item with approval gate reference', () => {
      const checklist = buildValidationChecklist();
      const gui = checklist.find((item) => item.includes('GUI prototype'));
      expect(gui).toBeDefined();
      expect(gui).toContain('before React/TypeScript');
    });

    it('includes platform safety checklist items', () => {
      const checklist = buildValidationChecklist();
      const ilsCheck = checklist.find((item) => item.includes('No ILS API calls'));
      const lsnbCheck = checklist.find((item) => item.includes('No LSNB'));
      const rssbCheck = checklist.find((item) => item.includes('No RSSB'));
      expect(ilsCheck).toBeDefined();
      expect(lsnbCheck).toBeDefined();
      expect(rssbCheck).toBeDefined();
    });
  });

  describe('buildExternalAiWorkflow', () => {
    it('returns 9 workflow steps', () => {
      const workflow = buildExternalAiWorkflow();
      expect(workflow).toHaveLength(9);
    });

    it('includes STOP instruction at step 6 with explicit approval gate', () => {
      const workflow = buildExternalAiWorkflow();
      const step6 = workflow.find((step) => step.includes('Step 6'));
      expect(step6).toBeDefined();
      expect(step6).toContain('STOP');
      expect(step6).toContain('Do NOT proceed');
      expect(step6).toContain('explicit written approval');
    });

    it('includes React/TypeScript candidate creation only after approval', () => {
      const workflow = buildExternalAiWorkflow();
      const step7 = workflow.find((step) => step.includes('Step 7'));
      expect(step7).toBeDefined();
      expect(step7).toContain('After receiving human approval');
      expect(step7).toContain('React/TypeScript candidate');
    });
  });

  describe('buildHumanApprovalGate', () => {
    it('returns 7 approval gate items', () => {
      const gate = buildHumanApprovalGate();
      expect(gate).toHaveLength(7);
    });

    it('describes approval outcomes with specific actions', () => {
      const gate = buildHumanApprovalGate();
      const combined = gate.join(' ');
      
      expect(combined).toContain('APPROVED');
      expect(combined).toContain('Proceed to React/TypeScript');
      expect(combined).toContain('REJECTED');
      expect(combined).toContain('Discard prototype');
      expect(combined).toContain('NEEDS_CORRECTION');
      expect(combined).toContain('Apply specified corrections');
    });
  });

  describe('buildProhibitedActions', () => {
    it('returns 11 prohibited actions', () => {
      const actions = buildProhibitedActions();
      expect(actions).toHaveLength(11);
    });

    it('prohibits database migrations', () => {
      const actions = buildProhibitedActions();
      const migrations = actions.find((a) => a.includes('database migrations'));
      expect(migrations).toBeDefined();
    });

    it('prohibits LLM provider integration with specific provider names', () => {
      const actions = buildProhibitedActions();
      const llm = actions.find((a) => a.includes('OpenAI'));
      expect(llm).toBeDefined();
      expect(llm).toContain('Anthropic');
      expect(llm).toContain('Gemini');
    });

    it('prohibits provider API credentials generically without naming specific key formats', () => {
      const actions = buildProhibitedActions();
      const credentials = actions.find((a) => a.includes('provider API credentials'));
      expect(credentials).toBeDefined();
      expect(credentials).toContain('such as provider API keys');
    });

    it('does not mention specific API key environment variable names', () => {
      const actions = buildProhibitedActions();
      const combined = actions.join(' ');
      expect(combined).not.toContain('OPENAI_API_KEY');
      expect(combined).not.toContain('ANTHROPIC_API_KEY');
      expect(combined).not.toContain('GEMINI_API_KEY');
    });

    it('prohibits platform infrastructure modifications', () => {
      const actions = buildProhibitedActions();
      const infrastructure = actions.find((a) => a.includes('ILS') && a.includes('LSNB'));
      expect(infrastructure).toBeDefined();
      expect(infrastructure).toContain('RSSB');
    });
  });

  describe('buildObjectives', () => {
    it('includes basic objectives', () => {
      const request: CreationBriefRequest = {
        requestId: 'test-1',
        targetFamilyId: 'I',
        targetVersionId: 'I2',
        learningIntent: 'Test learning intent',
        targetStage: 'GUI_PROTOTYPE',
      };
      const objectives = buildObjectives(request, 'Introduction');
      expect(objectives.length).toBeGreaterThanOrEqual(3);
      expect(objectives[0]).toContain('Introduction I2');
      expect(objectives[1]).toContain('Test learning intent');
    });

    it('includes topic when provided', () => {
      const request: CreationBriefRequest = {
        requestId: 'test-1',
        targetFamilyId: 'I',
        targetVersionId: 'I2',
        learningIntent: 'Test intent',
        topic: 'JavaScript closures',
        targetStage: 'GUI_PROTOTYPE',
      };
      const objectives = buildObjectives(request, 'Introduction');
      const topicObj = objectives.find((o) => o.includes('JavaScript closures'));
      expect(topicObj).toBeDefined();
    });

    it('includes audience when provided', () => {
      const request: CreationBriefRequest = {
        requestId: 'test-1',
        targetFamilyId: 'I',
        targetVersionId: 'I2',
        learningIntent: 'Test intent',
        audience: 'Beginner developers',
        targetStage: 'GUI_PROTOTYPE',
      };
      const objectives = buildObjectives(request, 'Introduction');
      const audienceObj = objectives.find((o) => o.includes('Beginner developers'));
      expect(audienceObj).toBeDefined();
    });
  });

  describe('generateI2CreationBrief', () => {
    it('generates valid I2 brief via convenience function', () => {
      const brief = generateI2CreationBrief({
        requestId: 'test-i2-1',
        learningIntent: 'Introduce learners to the topic',
      });

      expect(brief.briefId).toBeDefined();
      expect(brief.stage).toBe('GUI_PROTOTYPE');
      expect(brief.target.familyId).toBe('I');
      expect(brief.target.versionId).toBe('I2');
      expect(brief.target.familyName).toBe('Introduction');
    });

    it('uses I1 reference for I2 request', () => {
      const brief = generateI2CreationBrief({
        requestId: 'test-i2-2',
        learningIntent: 'Test learning intent',
      });

      expect(brief.referenceImplementation).toBeDefined();
      expect(brief.referenceImplementation?.versionId).toBe('I1');
    });
  });

  describe('generateCreationBrief', () => {
    it('requires learning intent', () => {
      const request: CreationBriefRequest = {
        requestId: 'test-1',
        targetFamilyId: 'I',
        targetVersionId: 'I2',
        learningIntent: '',
        targetStage: 'GUI_PROTOTYPE',
      };

      expect(() => generateCreationBrief(request)).toThrow('learningIntent must not be empty');
    });

    it('requires requestId', () => {
      const request: CreationBriefRequest = {
        requestId: '',
        targetFamilyId: 'I',
        targetVersionId: 'I2',
        learningIntent: 'Test intent',
        targetStage: 'GUI_PROTOTYPE',
      };

      expect(() => generateCreationBrief(request)).toThrow('requestId must not be empty');
    });

    it('rejects unknown family', () => {
      const request: CreationBriefRequest = {
        requestId: 'test-1',
        targetFamilyId: 'ZZZ',
        targetVersionId: 'ZZZ1',
        learningIntent: 'Test intent',
        targetStage: 'GUI_PROTOTYPE',
      };

      expect(() => generateCreationBrief(request)).toThrow('Unknown family');
      expect(() => generateCreationBrief(request)).toThrow('ZZZ');
    });

    it('rejects undocumented version', () => {
      const request: CreationBriefRequest = {
        requestId: 'test-1',
        targetFamilyId: 'I',
        targetVersionId: 'I99',
        learningIntent: 'Test intent',
        targetStage: 'GUI_PROTOTYPE',
      };

      expect(() => generateCreationBrief(request)).toThrow('not documented');
      expect(() => generateCreationBrief(request)).toThrow('I99');
    });

    it('rejects REACT_TYPESCRIPT_CANDIDATE stage', () => {
      const request: CreationBriefRequest = {
        requestId: 'test-1',
        targetFamilyId: 'I',
        targetVersionId: 'I2',
        learningIntent: 'Test intent',
        targetStage: 'REACT_TYPESCRIPT_CANDIDATE',
      };

      expect(() => generateCreationBrief(request)).toThrow('Phase 1 only supports GUI_PROTOTYPE');
    });

    it('contains mandatory human approval gate text in promptText', () => {
      const request: CreationBriefRequest = {
        requestId: 'test-1',
        targetFamilyId: 'I',
        targetVersionId: 'I2',
        learningIntent: 'Test learning intent',
        targetStage: 'GUI_PROTOTYPE',
      };

      const brief = generateCreationBrief(request);

      expect(brief.promptText).toContain('STOP');
      expect(brief.promptText).toContain('wait for explicit human GUI approval');
      expect(brief.promptText).toContain('Only after approval');
    });

    it('contains passive runtime restrictions in promptText', () => {
      const request: CreationBriefRequest = {
        requestId: 'test-1',
        targetFamilyId: 'I',
        targetVersionId: 'I2',
        learningIntent: 'Test learning intent',
        targetStage: 'GUI_PROTOTYPE',
      };

      const brief = generateCreationBrief(request);

      expect(brief.promptText).toContain('No ILS');
      expect(brief.promptText).toContain('LSNB');
      expect(brief.promptText).toContain('RSSB');
    });

    it('does NOT contain provider API keys in promptText', () => {
      const request: CreationBriefRequest = {
        requestId: 'test-1',
        targetFamilyId: 'I',
        targetVersionId: 'I2',
        learningIntent: 'Test learning intent',
        targetStage: 'GUI_PROTOTYPE',
      };

      const brief = generateCreationBrief(request);

      expect(brief.promptText).not.toContain('OPENAI_API_KEY');
      expect(brief.promptText).not.toContain('ANTHROPIC_API_KEY');
      expect(brief.promptText).not.toContain('GEMINI_API_KEY');
    });

    it('generates brief for O1 without reference pattern', () => {
      const request: CreationBriefRequest = {
        requestId: 'test-o1',
        targetFamilyId: 'O',
        targetVersionId: 'O1',
        learningIntent: 'Define learning objectives',
        targetStage: 'GUI_PROTOTYPE',
      };

      const brief = generateCreationBrief(request);

      expect(brief.target.familyName).toBe('Objective');
      expect(brief.referenceImplementation).toBeUndefined();
      expect(brief.promptText).toContain('No reference implementation available');
    });

    it('includes reference implementation key files', () => {
      const request: CreationBriefRequest = {
        requestId: 'test-1',
        targetFamilyId: 'I',
        targetVersionId: 'I2',
        learningIntent: 'Test intent',
        targetStage: 'GUI_PROTOTYPE',
      };

      const brief = generateCreationBrief(request);

      expect(brief.promptText).toContain('IntroductionBlock.tsx');
      expect(brief.promptText).toContain('TutorialBlockRenderer.tsx');
    });
  });
});
