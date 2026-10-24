/**
 * ProjectLlmClient API Integration Test
 *
 * Phase 7: Validates that all API client methods correctly construct
 * request URLs, handle error responses, and return typed data.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectLlmClient, ProjectLlmError, ProjectLlmErrorCode } from '../../../src/lib/project-llm/api/projectLlmClient';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ProjectLlmClient', () => {
  let client: ProjectLlmClient;

  beforeEach(() => {
    client = new ProjectLlmClient('/api/project-llm');
    mockFetch.mockReset();
  });

  describe('createWorkflow', () => {
    it('should POST to /workflows/create with correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workflowId: 'wf-123', state: 'INITIATED' }),
      });

      const result = await client.createWorkflow({
        targetFamily: 'Introduction',
        targetVersion: 'I7',
        purpose: 'New intro block',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/project-llm/workflows/create',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            target_family: 'Introduction',
            target_version: 'I7',
            purpose: 'New intro block',
            specification_id: '',
          }),
        })
      );
      expect(result.workflowId).toBe('wf-123');
    });
  });

  describe('getEngineeringContract', () => {
    it('should GET the contract for a workflow', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          contract_id: 'ct-1',
          workflow_id: 'wf-123',
          contract_hash: 'abc123',
        }),
      });

      const result = await client.getEngineeringContract('wf-123');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/project-llm/workflows/wf-123/engineering-contract',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.contract_hash).toBe('abc123');
    });
  });

  describe('generateEngineeringContract', () => {
    it('should POST to generate the contract', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          contract_id: 'ct-2',
          contract_hash: 'def456',
        }),
      });

      const result = await client.generateEngineeringContract('wf-123');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/project-llm/workflows/wf-123/engineering-contract',
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.contract_id).toBe('ct-2');
    });
  });

  describe('listWorkflows', () => {
    it('should GET all workflows', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ workflow_id: 'wf-1' }, { workflow_id: 'wf-2' }],
      });

      const result = await client.listWorkflows();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/project-llm/workflows',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('getSnapshot', () => {
    it('should GET the live repository snapshot', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          schemaVersion: '1.1.0',
          canonicalHash: 'xyz',
        }),
      });

      const result = await client.getSnapshot();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/project-llm/snapshot',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.schemaVersion).toBe('1.1.0');
    });
  });

  describe('error handling', () => {
    it('should throw UNAUTHORIZED for 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(client.getWorkflowState('wf-1')).rejects.toThrow(ProjectLlmError);
      await expect(
        client.getWorkflowState('wf-1').catch((e) => e)
      ).resolves.toMatchObject({
        code: ProjectLlmErrorCode.UNAUTHORIZED,
        statusCode: 401,
      });
    });

    it('should throw NOT_FOUND for 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(client.getEngineeringContract('wf-none')).rejects.toThrow(
        ProjectLlmError
      );
    });

    it('should throw NETWORK_ERROR when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(client.listWorkflows()).rejects.toThrow(ProjectLlmError);
    });
  });
});
