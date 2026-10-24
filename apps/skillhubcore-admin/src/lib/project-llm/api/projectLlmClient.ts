/**
 * API client for Project LLM backend
 *
 * All methods call the real FastAPI backend; no hardcoded data allowed.
 * Uses native fetch API (no additional dependencies).
 *
 * Base URL defaults to '/api/project-llm' and proxies through Next.js adapter
 * to the FastAPI backend (typically http://localhost:8000).
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

/**
 * Typed error codes for API failures
 */
export enum ProjectLlmErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured error class for Project LLM API failures
 */
export class ProjectLlmError extends Error {
  constructor(
    public code: ProjectLlmErrorCode,
    public statusCode: number | null,
    message: string
  ) {
    super(message);
    this.name = 'ProjectLlmError';
  }
}

/**
 * Handle fetch response errors and throw structured ProjectLlmError
 */
function handleFetchError(response: Response): never {
  const { status } = response;

  switch (status) {
    case 401:
      throw new ProjectLlmError(
        ProjectLlmErrorCode.UNAUTHORIZED,
        401,
        'Session expired. Please log in again.'
      );
    case 403:
      throw new ProjectLlmError(
        ProjectLlmErrorCode.FORBIDDEN,
        403,
        'You do not have permission to perform this action. Contact your administrator.'
      );
    case 404:
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NOT_FOUND,
        404,
        'Resource not found. The workflow may have been deleted.'
      );
    case 500:
      throw new ProjectLlmError(
        ProjectLlmErrorCode.SERVER_ERROR,
        500,
        'Server error. Please try again later.'
      );
    case 503:
      throw new ProjectLlmError(
        ProjectLlmErrorCode.SERVICE_UNAVAILABLE,
        503,
        'Backend service unavailable. Please try again later.'
      );
    default:
      throw new ProjectLlmError(
        ProjectLlmErrorCode.UNKNOWN_ERROR,
        status,
        `Request failed: ${status} ${response.statusText}`
      );
  }
}

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
    try {
      const response = await fetch(`${this.baseUrl}/workflows/${workflowId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        handleFetchError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof ProjectLlmError) {
        throw error;
      }
      // Network error or other fetch failure
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NETWORK_ERROR,
        null,
        'Unable to connect to server. Check your network connection.'
      );
    }
  }

  /**
   * Upload candidate files using multipart/form-data.
   * NEVER uses hardcoded candidate data.
   */
  /**
   * Upload candidate files using CandidatePackage JSON payload.
   * NEVER uses hardcoded candidate data.
   */
  async uploadCandidate(
    workflowId: string,
    files: File[]
  ): Promise<CandidateResponse> {
    try {
      const candidateFiles = await Promise.all(
        files.map(async (file) => ({
          filename: file.name,
          content: await file.text(),
          contentType: file.type || 'text/plain',
        }))
      );

      const payload = {
        candidateId: `candidate-${Date.now()}`,
        workflow_id: workflowId,
        files: candidateFiles,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'admin',
      };

      const response = await fetch(`${this.baseUrl}/candidates/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        handleFetchError(response);
      }

      const res = await response.json();
      return {
        candidateId: res.candidateId || payload.candidateId,
        status: res.status || 'uploaded',
      };
    } catch (error) {
      if (error instanceof ProjectLlmError) {
        throw error;
      }
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NETWORK_ERROR,
        null,
        'Unable to connect to server. Check your network connection.'
      );
    }
  }

  /**
   * Approve a placement manifest for implementation.
   * Binds approval to the manifest hash.
   */
  async approveImplementation(
    workflowId: string,
    manifestHash: string
  ): Promise<ApprovalResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/approvals/workflows/${workflowId}/approve-placement`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflow_id: workflowId,
            manifest_hash: manifestHash,
            contract_hash: manifestHash,
            candidate_sha256: manifestHash,
            placement_manifest_id: manifestHash,
            approved: true,
            reason: 'Approved via admin UI',
          }),
          credentials: 'same-origin',
        }
      );

      if (!response.ok) {
        handleFetchError(response);
      }

      const data = await response.json();
      return {
        approved: data.approved !== false,
        workflowId,
      };
    } catch (error) {
      if (error instanceof ProjectLlmError) {
        throw error;
      }
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NETWORK_ERROR,
        null,
        'Unable to connect to server. Check your network connection.'
      );
    }
  }

  /**
   * Get certification status with gate results.
   * Reads from canonical GET /workflows/{workflowId}.
   * NEVER fabricates PASS status.
   */
  async getCertificationStatus(
    workflowId: string
  ): Promise<CertificationStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows/${workflowId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        handleFetchError(response);
      }

      const data: any = await response.json();
      const rawGates = data.gate_results || {};
      const gates: any[] = Object.entries(rawGates).map(([gateName, gateVal]: [string, any]) => {
        let result: 'PASS' | 'FAIL' | 'SKIPPED' | 'PENDING' = 'PENDING';
        let detail = '';
        if (typeof gateVal === 'string') {
          const upper = gateVal.toUpperCase();
          result = (['PASS', 'FAIL', 'SKIPPED', 'PENDING'].includes(upper) ? upper : 'PENDING') as any;
        } else if (typeof gateVal === 'object' && gateVal !== null) {
          const status = (gateVal.status || gateVal.verdict || gateVal.result || 'PENDING').toUpperCase();
          result = (['PASS', 'FAIL', 'SKIPPED', 'PENDING'].includes(status) ? status : 'PENDING') as any;
          detail = gateVal.detail || gateVal.reason || gateVal.message || '';
        }
        return {
          gate: gateName,
          result,
          detail,
        };
      });

      return {
        workflowId: data.workflow_id || workflowId,
        state: data.state?.current_state || data.current_state || 'REQUESTED',
        gates,
        certifiedAt: data.updated_at || undefined,
      };
    } catch (error) {
      if (error instanceof ProjectLlmError) {
        throw error;
      }
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NETWORK_ERROR,
        null,
        'Unable to connect to server. Check your network connection.'
      );
    }
  }

  /**
   * Trigger runtime verification for a workflow.
   * Initiates transition to VERIFYING state.
   */
  async triggerRuntimeVerification(
    workflowId: string
  ): Promise<RuntimeVerificationResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/workflows/${workflowId}/transition`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to_state: 'VERIFYING',
            triggered_by: 'ui-runtime-verification',
            reason: 'Triggered runtime verification from UI',
          }),
          credentials: 'same-origin',
        }
      );

      if (!response.ok) {
        handleFetchError(response);
      }

      return {
        triggered: true,
        workflowId,
      };
    } catch (error) {
      if (error instanceof ProjectLlmError) {
        throw error;
      }
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NETWORK_ERROR,
        null,
        'Unable to connect to server. Check your network connection.'
      );
    }
  }

  /**
   * Get runtime health check results.
   * Derived from canonical workflow state.
   */
  async getRuntimeHealth(workflowId: string): Promise<RuntimeHealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows/${workflowId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        handleFetchError(response);
      }

      const data: any = await response.json();
      const runtimeGate = data.gate_results?.['runtime-verification'] || {};
      const isHealthy = runtimeGate.status === 'PASS' || runtimeGate.verdict === 'PASS';

      return {
        workflowId,
        healthy: isHealthy,
        processStatus: isHealthy ? 'RUNNING' : (runtimeGate.status || 'PENDING'),
        lastChecked: runtimeGate.created_at || data.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof ProjectLlmError) {
        throw error;
      }
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NETWORK_ERROR,
        null,
        'Unable to connect to server. Check your network connection.'
      );
    }
  }

  /**
   * Get browser verification status.
   * Returns PASS, FAIL, or SKIPPED (not a failure).
   */
  async getBrowserVerificationStatus(
    workflowId: string
  ): Promise<BrowserVerificationStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows/${workflowId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        handleFetchError(response);
      }

      const data: any = await response.json();
      const browserGate = data.gate_results?.['browser-verification'] || {};
      let result: 'PASS' | 'FAIL' | 'SKIPPED' = 'SKIPPED';
      const status = (browserGate.status || browserGate.verdict || '').toUpperCase();
      if (status === 'PASS') result = 'PASS';
      else if (status === 'FAIL') result = 'FAIL';

      return {
        workflowId,
        result,
        detail: browserGate.detail || browserGate.reason || '',
      };
    } catch (error) {
      if (error instanceof ProjectLlmError) {
        throw error;
      }
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NETWORK_ERROR,
        null,
        'Unable to connect to server. Check your network connection.'
      );
    }
  }


  /**
   * Create a new workflow with target family + version.
   * Maps to: POST /workflows/create
   */
  async createWorkflow(params: {
    targetFamily: string;
    targetVersion: string;
    purpose?: string;
    specificationId?: string;
  }): Promise<Record<string, any>> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_family: params.targetFamily,
          target_version: params.targetVersion,
          purpose: params.purpose || '',
          specification_id: params.specificationId || '',
        }),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        handleFetchError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof ProjectLlmError) throw error;
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NETWORK_ERROR,
        null,
        'Unable to connect to server. Check your network connection.'
      );
    }
  }

  /**
   * Generate an engineering contract for a workflow.
   * Maps to: POST /workflows/{workflowId}/engineering-contract
   */
  async generateEngineeringContract(workflowId: string): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/workflows/${workflowId}/engineering-contract`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
        }
      );

      if (!response.ok) {
        handleFetchError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof ProjectLlmError) throw error;
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NETWORK_ERROR,
        null,
        'Unable to connect to server. Check your network connection.'
      );
    }
  }

  /**
   * Get the engineering contract for a workflow.
   * Maps to: GET /workflows/{workflowId}/engineering-contract
   * If the contract hasn't been generated yet (404), it automatically generates it.
   */
  async getEngineeringContract(workflowId: string): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/workflows/${workflowId}/engineering-contract`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
        }
      );

      if (response.status === 404) {
        // Contract not yet generated for this workflow — generate it on-demand
        return await this.generateEngineeringContract(workflowId);
      }

      if (!response.ok) {
        handleFetchError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof ProjectLlmError) throw error;
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NETWORK_ERROR,
        null,
        'Unable to connect to server. Check your network connection.'
      );
    }
  }


  /**
   * List all workflows.
   * Maps to: GET /workflows
   */
  async listWorkflows(): Promise<Array<Record<string, unknown>>> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        handleFetchError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof ProjectLlmError) throw error;
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NETWORK_ERROR,
        null,
        'Unable to connect to server. Check your network connection.'
      );
    }
  }

  /**
   * Get live repository snapshot.
   * Maps to: GET /snapshot
   */
  async getSnapshot(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/snapshot`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        handleFetchError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof ProjectLlmError) throw error;
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NETWORK_ERROR,
        null,
        'Unable to connect to server. Check your network connection.'
      );
    }
  }
}

// Singleton instance for convenience
export const projectLlmClient = new ProjectLlmClient();

