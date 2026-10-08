/**
 * Tests for ProjectLlmClient
 * 
 * Verifies that the API client correctly calls backend endpoints
 * and never fabricates data.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectLlmClient } from '../projectLlmClient';
import type { CanonicalWorkflowStateEnum } from '../../types/canonicalWorkflowState';

// Mock fetch globally
global.fetch = vi.fn();

describe('ProjectLlmClient', () => {
  let client: ProjectLlmClient;

  beforeEach(() => {
    client = new ProjectLlmClient('/api/project-llm');
    vi.clearAllMocks();
  });

  describe('getWorkflowState', () => {
    it('should fetch workflow state from backend', async () => {
      const mockWorkflowState = {
        workflowId: 'test-workflow-123',
        state: 'REQUESTED' as CanonicalWorkflowStateEnum,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflowState,
      });

      const result = await client.getWorkflowState('test-workflow-123');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/project-llm/workflows/test-workflow-123',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      expect(result).toEqual(mockWorkflowState);
    });

    it('should throw error on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(client.getWorkflowState('nonexistent')).rejects.toThrow(
        'Failed to fetch workflow state: 404 Not Found'
      );
    });
  });

  describe('uploadCandidate', () => {
    it('should upload files using multipart/form-data', async () => {
      const mockFiles = [
        new File(['content1'], 'file1.tsx', { type: 'text/plain' }),
        new File(['content2'], 'file2.tsx', { type: 'text/plain' }),
      ];

      const mockResponse = {
        candidateId: 'candidate-456',
        status: 'uploaded',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.uploadCandidate('workflow-123', mockFiles);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/project-llm/candidates/upload',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('triggerRuntimeVerification', () => {
    it('should trigger runtime verification for a workflow', async () => {
      const mockResponse = {
        triggered: true,
        workflowId: 'workflow-789',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.triggerRuntimeVerification('workflow-789');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/project-llm/workflows/workflow-789/runtime-verification',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCertificationStatus', () => {
    it('should fetch certification status without fabricating PASS', async () => {
      const mockCertification = {
        workflowId: 'workflow-999',
        state: 'CERTIFICATION_READY' as CanonicalWorkflowStateEnum,
        gates: [
          { gate: 'UBRC', result: 'PASS' as const, detail: 'All checks passed' },
          { gate: 'Brand', result: 'PENDING' as const },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCertification,
      });

      const result = await client.getCertificationStatus('workflow-999');

      expect(result).toEqual(mockCertification);
      // Verify that the client doesn't modify gate results
      expect(result.gates[0].result).toBe('PASS');
      expect(result.gates[1].result).toBe('PENDING');
    });
  });
});
