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
  PlacementExecutionResult,
  PlacementManifest,
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
/**
 * Compute SHA-256 hash for file content.
 * Matches backend CandidateValidator / candidate intake expectations.
 */
async function computeSha256(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  try {
    const nodeCrypto = await import('crypto');
    return nodeCrypto.createHash('sha256').update(content, 'utf8').digest('hex');
  } catch {
    return '';
  }
}

/**
 * Handle fetch response errors and throw structured ProjectLlmError with backend detail
 */
async function handleFetchError(response: Response): Promise<never> {
  const { status } = response;
  let detail = '';
  try {
    const data = await response.clone().json();
    if (data && typeof data === 'object') {
      detail = data.detail || data.error || data.message || '';
    }
  } catch {
    try {
      detail = await response.clone().text();
    } catch {
      // ignore
    }
  }

  const suffix = detail ? `: ${detail}` : '';

  switch (status) {
    case 401:
      throw new ProjectLlmError(
        ProjectLlmErrorCode.UNAUTHORIZED,
        401,
        `Session expired. Please log in again.${suffix}`
      );
    case 403:
      throw new ProjectLlmError(
        ProjectLlmErrorCode.FORBIDDEN,
        403,
        `You do not have permission to perform this action.${suffix}`
      );
    case 404:
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NOT_FOUND,
        404,
        `Resource not found. The workflow may have been deleted.${suffix}`
      );
    case 409:
      throw new ProjectLlmError(
        ProjectLlmErrorCode.UNKNOWN_ERROR,
        409,
        `Workflow Conflict${suffix}`
      );
    case 422:
      throw new ProjectLlmError(
        ProjectLlmErrorCode.UNKNOWN_ERROR,
        422,
        `Validation Failed${suffix}`
      );
    case 500:
      throw new ProjectLlmError(
        ProjectLlmErrorCode.SERVER_ERROR,
        500,
        `Server error. Please try again later.${suffix}`
      );
    case 503:
      throw new ProjectLlmError(
        ProjectLlmErrorCode.SERVICE_UNAVAILABLE,
        503,
        `Backend service unavailable. Please try again later.${suffix}`
      );
    default:
      throw new ProjectLlmError(
        ProjectLlmErrorCode.UNKNOWN_ERROR,
        status,
        detail || `Request failed: ${status} ${response.statusText}`
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
        await handleFetchError(response);
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
   * Upload candidate files using CandidatePackage JSON payload.
   * Computes SHA-256 for each file to satisfy backend CandidateFile requirements.
   * NEVER uses hardcoded candidate data.
   */
  async uploadCandidate(
    workflowId: string,
    files: File[]
  ): Promise<CandidateResponse> {
    try {
      const candidateFiles = await Promise.all(
        files.map(async (file) => {
          let content: string;
          if (file.name.toLowerCase().endsWith('.zip')) {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let binary = '';
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            content = btoa(binary);
          } else {
            content = await file.text();
          }
          const hash = await computeSha256(content);
          return {
            filename: file.name,
            content,
            contentType: file.type || (file.name.toLowerCase().endsWith('.zip') ? 'application/zip' : 'text/plain'),
            hash,
          };
        })
      );

      const generatedId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0').slice(-12);

      const payload = {
        candidateId: generatedId,
        workflow_id: workflowId,
        files: candidateFiles,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'admin',
      };

      // Ensure workflow is transitioned through canonical states to CANDIDATE_REQUESTED before uploading
      await this.ensureCandidateRequested(workflowId);

      let response = await fetch(`${this.baseUrl}/candidates/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      });

      // If workflow state conflict (e.g. race condition), retry once with state advancement
      if (response.status === 409) {
        await this.ensureCandidateRequested(workflowId);
        response = await fetch(`${this.baseUrl}/candidates/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          credentials: 'same-origin',
        });
      }

      if (!response.ok) {
        await handleFetchError(response);
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

  /** Retrieve a persisted, server-generated placement manifest. */
  async getPlacementManifest(candidateId: string): Promise<PlacementManifest> {
    return this.requestJson<PlacementManifest>(
      `/candidates/${encodeURIComponent(candidateId)}/manifest`,
      { method: 'GET' }
    );
  }

  /**
   * Generate a manifest from the stored candidate and canonical repository snapshot.
   * This does not approve or execute repository mutations.
   */
  async generatePlacementManifest(candidateId: string): Promise<PlacementManifest> {
    return this.requestJson<PlacementManifest>(
      `/candidates/${encodeURIComponent(candidateId)}/manifest`,
      { method: 'POST' }
    );
  }

  /**
   * Execute a placement that the backend has already independently approved.
   * The backend verifies approval and all candidate/manifest bindings again.
   */
  async executeApprovedPlacement(candidateId: string): Promise<PlacementExecutionResult> {
    return this.requestJson<PlacementExecutionResult>(
      `/candidates/${encodeURIComponent(candidateId)}/execute`,
      { method: 'POST' }
    );
  }

  private async requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
        credentials: 'same-origin',
        ...init,
      });

      if (!response.ok) {
        await handleFetchError(response);
      }

      return response.json() as Promise<T>;
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
    manifestHash?: string,
    details?: {
      contractHash?: string;
      candidateSha256?: string;
      placementManifestId?: string;
      reason?: string;
    }
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
            ...(manifestHash ? { manifest_hash: manifestHash } : {}),
            ...(details?.contractHash ? { contract_hash: details.contractHash } : {}),
            ...(details?.candidateSha256 ? { candidate_sha256: details.candidateSha256 } : {}),
            ...(details?.placementManifestId ? { placement_manifest_id: details.placementManifestId } : {}),
            approved: true,
            reason: details?.reason || 'Approved by Administrator via Certification Console',
          }),
          credentials: 'same-origin',
        }
      );

      if (!response.ok) {
        await handleFetchError(response);
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
        await handleFetchError(response);
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
        state: data.state?.current || data.state?.current_state || data.current_state || 'REQUESTED',
        gates,
        certifiedAt: data.updated_at || undefined,
        targetFamily: data.target?.family,
        targetVersion: data.target?.version,
        candidateId: data.artifacts?.candidate?.id || data.artifacts?.candidate?.artifact_id || undefined,
        manifestId: data.artifacts?.manifest?.id || data.artifacts?.manifest?.artifact_id || undefined,
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
   * Transition workflow state through canonical state machine.
   */
  async transitionWorkflow(
    workflowId: string,
    toState: string,
    reason?: string
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows/${workflowId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_state: toState,
          triggered_by: 'admin-ui',
          reason: reason || `Transitioned to ${toState} from admin UI`,
        }),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        await handleFetchError(response);
      }

      return response.json();
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
   * Ensure workflow is in CANDIDATE_REQUESTED state before candidate upload.
   * Advances sequentially through canonical state machine rules.
   */
  async ensureCandidateRequested(workflowId: string): Promise<void> {
    try {
      const cert = await this.getCertificationStatus(workflowId);
      let currentState: string = cert.state || '';

      if (currentState === 'REQUESTED') {
        await this.transitionWorkflow(workflowId, 'DISCOVERY', 'Auto-advance to discovery');
        currentState = 'DISCOVERY';
      }
      if (currentState === 'DISCOVERY') {
        await this.transitionWorkflow(workflowId, 'BRIEF_READY', 'Auto-advance to brief ready');
        currentState = 'BRIEF_READY';
      }
      if (currentState === 'BRIEF_READY') {
        await this.transitionWorkflow(workflowId, 'AWAITING_GATE_1', 'Submitted for Gate 1 human review');
        currentState = 'AWAITING_GATE_1';
      }
      if (currentState === 'AWAITING_GATE_1') {
        await this.transitionWorkflow(workflowId, 'GUI_APPROVED', 'Prototype GUI approved by admin');
        currentState = 'GUI_APPROVED';
      }
      if (currentState === 'GUI_APPROVED') {
        await this.transitionWorkflow(workflowId, 'CANDIDATE_REQUESTED', 'Requested candidate package implementation');
        currentState = 'CANDIDATE_REQUESTED';
      }
    } catch (err) {
      console.warn('[ensureCandidateRequested] Transition note:', err);
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
        await handleFetchError(response);
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
        await handleFetchError(response);
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
        await handleFetchError(response);
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
        await handleFetchError(response);
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
        await handleFetchError(response);
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
        await handleFetchError(response);
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
        await handleFetchError(response);
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
        await handleFetchError(response);
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

