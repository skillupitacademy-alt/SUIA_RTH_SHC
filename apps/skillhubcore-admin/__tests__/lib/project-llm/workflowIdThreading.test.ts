/**
 * WorkflowId URL Threading Test (Phase 7)
 *
 * Validates that every Project LLM page:
 * 1. Reads workflowId from URL searchParams
 * 2. Passes workflowId to navigation links
 * 3. Never drops workflowId during page transitions
 *
 * This is a static analysis test — it reads TSX source files
 * and checks for correct patterns.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_LLM_DIR = join(
  __dirname,
  '../../../src/app/(admin)/tools/project-llm'
);

const PAGES_REQUIRING_WORKFLOW_ID = [
  'compliance-brief/page.tsx',
  'external-ai-handoff/page.tsx',
  'candidate-upload/page.tsx',
  'integration-certification/page.tsx',
];

describe('workflowId URL threading', () => {
  PAGES_REQUIRING_WORKFLOW_ID.forEach((pagePath) => {
    const pageFile = join(PROJECT_LLM_DIR, pagePath);
    const pageName = pagePath.split('/')[0];

    describe(pageName, () => {
      let source: string;

      try {
        source = readFileSync(pageFile, 'utf-8');
      } catch {
        source = '';
      }

      it('should import useSearchParams', () => {
        expect(source).toContain('useSearchParams');
      });

      it('should extract workflowId from searchParams', () => {
        expect(source).toMatch(/workflowId/);
        expect(source).toMatch(/searchParams\.get/);
      });

      it('should pass workflowId in all navigation Link hrefs', () => {
        // Every Link that navigates within project-llm should include workflowId
        const linkMatches = source.match(/href=\{[^}]*project-llm[^}]*\}/g) || [];
        linkMatches.forEach((match) => {
          expect(match).toContain('workflowId');
        });
      });
    });
  });

  describe('create page', () => {
    const createPage = join(PROJECT_LLM_DIR, 'create/page.tsx');
    let source: string;

    try {
      source = readFileSync(createPage, 'utf-8');
    } catch {
      source = '';
    }

    it('should call createBackendWorkflow', () => {
      expect(source).toContain('createBackendWorkflow');
    });

    it('should pass workflowId in URL when navigating to compliance-brief', () => {
      expect(source).toMatch(/compliance-brief.*workflowId/);
    });
  });
});
