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
  async uploadCandidate(
    workflowId: string,
    files: File[]
  ): Promise<CandidateResponse> {
    try {
      const formData = new FormData();
      formData.append('workflowId', workflowId);

      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${this.baseUrl}/candidates/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
        // Don't set Content-Type header; browser will set it with boundary
      });

      if (!response.ok) {
        handleFetchError(response);
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
   * Approve a placement manifest for implementation.
   * Binds approval to the manifest hash.
   */
  async approveImplementation(
    workflowId: string,
    manifestHash: string
  ): Promise<ApprovalResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/approvals/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          manifestHash,
        }),
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
      throw new ProjectLlmError(
        ProjectLlmErrorCode.NETWORK_ERROR,
        null,
        'Unable to connect to server. Check your network connection.'
      );
    }
  }

  /**
   * Get certification status with gate results.
   * NEVER fabricates PASS status.
   */
  async getCertificationStatus(
    workflowId: string
  ): Promise<CertificationStatus> {
    try {
      const response = await fetch(
        `${this.baseUrl}/workflows/${workflowId}/certification`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
        }
      );

      if (!response.ok) {
        handleFetchError(response);
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
   * Trigger runtime verification for a workflow.
   * Initiates ILS lifecycle, LSNB navigation, and RSSB state checks.
   */
  async triggerRuntimeVerification(
    workflowId: string
  ): Promise<RuntimeVerificationResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/workflows/${workflowId}/runtime-verification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
        }
      );

      if (!response.ok) {
        handleFetchError(response);
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
   * Get runtime health check results.
   * Shows process management status.
   */
  async getRuntimeHealth(workflowId: string): Promise<RuntimeHealthStatus> {
    try {
      const response = await fetch(
        `${this.baseUrl}/workflows/${workflowId}/runtime-health`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
        }
      );

      if (!response.ok) {
        handleFetchError(response);
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
   * Get browser verification status.
   * Returns PASS, FAIL, or SKIPPED (not a failure).
   */
  async getBrowserVerificationStatus(
    workflowId: string
  ): Promise<BrowserVerificationStatus> {
    try {
      const response = await fetch(
        `${this.baseUrl}/workflows/${workflowId}/browser-verification`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
        }
      );

      if (!response.ok) {
        handleFetchError(response);
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
}

// Singleton instance for convenience
export const projectLlmClient = new ProjectLlmClient();
