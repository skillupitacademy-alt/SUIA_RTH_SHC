/**
 * Tests for ProjectLlmClient
 *
 * Verifies that the API client correctly calls backend endpoints,
 * computes SHA-256 for file uploads, and never fabricates data.
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

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
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
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        clone: () => ({
          json: async () => ({ detail: 'Workflow test not found' }),
          text: async () => 'Workflow test not found',
        }),
      });

      await expect(client.getWorkflowState('nonexistent')).rejects.toThrow(
        /Resource not found/i
      );
    });
  });

  describe('uploadCandidate', () => {
    it('should upload files using CandidatePackage JSON payload with computed SHA-256 hashes', async () => {
      const mockFiles = [
        new File(['content1'], 'file1.tsx', { type: 'text/plain' }),
        new File(['content2'], 'file2.tsx', { type: 'text/plain' }),
      ];

      const mockResponse = {
        candidateId: 'candidate-456',
        status: 'uploaded',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.uploadCandidate('workflow-123', mockFiles);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/project-llm/candidates/upload',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const parsedBody = JSON.parse(callArgs[1].body);

      expect(parsedBody.workflow_id).toBe('workflow-123');
      expect(parsedBody.files).toHaveLength(2);
      expect(parsedBody.files[0].filename).toBe('file1.tsx');
      expect(parsedBody.files[0].content).toBe('content1');
      // Verify SHA-256 hash was computed for each candidate file
      expect(parsedBody.files[0].hash).toMatch(/^[a-f0-9]{64}$/);
      expect(parsedBody.files[1].hash).toMatch(/^[a-f0-9]{64}$/);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('triggerRuntimeVerification', () => {
    it('should trigger runtime verification transition for a workflow', async () => {
      const mockResponse = {
        workflow_id: 'workflow-789',
        current_state: 'VERIFYING',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.triggerRuntimeVerification('workflow-789');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/project-llm/workflows/workflow-789/transition',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"to_state":"VERIFYING"'),
        })
      );
      expect(result).toEqual({
        triggered: true,
        workflowId: 'workflow-789',
      });
    });
  });

  describe('getCertificationStatus', () => {
    it('should fetch certification status without fabricating PASS', async () => {
      const mockBackendWorkflow = {
        workflow_id: 'workflow-999',
        current_state: 'CERTIFICATION_READY',
        gate_results: {
          UBRC: { status: 'PASS', detail: 'All checks passed' },
          Brand: 'PENDING',
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendWorkflow,
      });

      const result = await client.getCertificationStatus('workflow-999');

      expect(result.workflowId).toBe('workflow-999');
      expect(result.state).toBe('CERTIFICATION_READY');
      expect(result.gates).toHaveLength(2);
      expect(result.gates[0]).toEqual({
        gate: 'UBRC',
        result: 'PASS',
        detail: 'All checks passed',
      });
      expect(result.gates[1]).toEqual({
        gate: 'Brand',
        result: 'PENDING',
        detail: '',
      });
    });
  });
});
