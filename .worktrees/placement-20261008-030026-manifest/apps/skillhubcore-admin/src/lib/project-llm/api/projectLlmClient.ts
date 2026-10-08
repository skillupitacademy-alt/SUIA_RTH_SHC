/**
 * API client for Project LLM backend
 * 
 * All methods call the real FastAPI backend; no hardcoded data allowed.
 * Uses native fetch API (no additional dependencies).
 * 
 * Base URL defaults to '/api' and should be configured to proxy to
 * the FastAPI backend (typically http://localhost:8000).
 */

import type {
  CanonicalWorkflowState,
  CandidateResponse,
  ApprovalResponse,
  CertificationStatus,
  RuntimeVerificationResponse,
  RuntimeHealthStatus,
  BrowserVerificationStatus,
} from '../types/canonicalWorkflowState';

export class ProjectLlmClient {
  private baseUrl: string;

  constructor(baseUrl = '/api/project-llm') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch the current workflow state from the backend.
   * NEVER returns fabricated data.
   */
  async getWorkflowState(workflowId: string): Promise<CanonicalWorkflowState> {
    const response = await fetch(`${this.baseUrl}/workflows/${workflowId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch workflow state: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Upload candidate files using multipart/form-data.
   * NEVER uses hardcoded candidate data.
   */
  async uploadCandidate(
    workflowId: string,
    files: File[]
  ): Promise<CandidateResponse> {
    const formData = new FormData();
    formData.append('workflowId', workflowId);
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseUrl}/candidates/upload`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header; browser will set it with boundary
    });

    if (!response.ok) {
      throw new Error(
        `Failed to upload candidate: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Approve a placement manifest for implementation.
   * Binds approval to the manifest hash.
   */
  async approveImplementation(
    workflowId: string,
    manifestHash: string
  ): Promise<ApprovalResponse> {
    const response = await fetch(`${this.baseUrl}/approvals/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId,
        manifestHash,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to approve implementation: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get certification status with gate results.
   * NEVER fabricates PASS status.
   */
  async getCertificationStatus(
    workflowId: string
  ): Promise<CertificationStatus> {
    const response = await fetch(
      `${this.baseUrl}/workflows/${workflowId}/certification`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch certification status: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Trigger runtime verification for a workflow.
   * Initiates ILS lifecycle, LSNB navigation, and RSSB state checks.
   */
  async triggerRuntimeVerification(
    workflowId: string
  ): Promise<RuntimeVerificationResponse> {
    const response = await fetch(
      `${this.baseUrl}/workflows/${workflowId}/runtime-verification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to trigger runtime verification: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get runtime health check results.
   * Shows process management status.
   */
  async getRuntimeHealth(workflowId: string): Promise<RuntimeHealthStatus> {
    const response = await fetch(
      `${this.baseUrl}/workflows/${workflowId}/runtime-health`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch runtime health: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get browser verification status.
   * Returns PASS, FAIL, or SKIPPED (not a failure).
   */
  async getBrowserVerificationStatus(
    workflowId: string
  ): Promise<BrowserVerificationStatus> {
    const response = await fetch(
      `${this.baseUrl}/workflows/${workflowId}/browser-verification`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch browser verification status: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }
}

// Singleton instance for convenience
export const projectLlmClient = new ProjectLlmClient();
