/**
 * Project LLM Workflow Coordinator
 *
 * This is the ORCHESTRATOR SKELETON — pure TypeScript contracts and coordination
 * logic. No agent implementations are provided here; each agent stub returns a
 * NOT_IMPLEMENTED error so the coordinator compiles and the contract is locked.
 *
 * AUTHORITY GATE RULE:
 *   When requiresHumanAction === true, the coordinator STOPS and surfaces the
 *   humanAction reason. It NEVER fabricates an approval or advances past a gate.
 */
import type {
  ProjectLlmWorkflow,
  ProjectLlmWorkflowResult,
  ProjectLlmWorkflowState,
  AgentExecutionResult,
  StopReason,
} from '@quiz/types/project-llm';
import {
  TERMINAL_STATES,
  AUTHORITY_REQUIRED_STATES,
  ALLOWED_TRANSITIONS,
} from '@quiz/types/project-llm';
import type {
  ExternalAiHandoff,
  CandidatePackage,
  IntegrationPlanRecord,
  CertificationPackage,
} from '@quiz/types/project-llm';

// ─── Persistence contract ───────────────────────────────────────────────────

export interface ProjectLlmWorkflowStore {
  get(workflowId: string): Promise<ProjectLlmWorkflow | null>;
  save(workflow: ProjectLlmWorkflow): Promise<void>;
}

/**
 * Phase-1 in-memory store. Replace with a database-backed implementation
 * for production without changing the coordinator logic.
 */
export class InMemoryProjectLlmWorkflowStore implements ProjectLlmWorkflowStore {
  private readonly records = new Map<string, ProjectLlmWorkflow>();

  async get(workflowId: string): Promise<ProjectLlmWorkflow | null> {
    return this.records.get(workflowId) ?? null;
  }

  async save(workflow: ProjectLlmWorkflow): Promise<void> {
    this.records.set(workflow.workflowId, { ...workflow });
  }
}

// ─── State machine helpers ───────────────────────────────────────────────────

export function isTerminal(state: ProjectLlmWorkflowState): boolean {
  return TERMINAL_STATES.has(state);
}

export function requiresAuthority(state: ProjectLlmWorkflowState): boolean {
  return AUTHORITY_REQUIRED_STATES.has(state);
}

/**
 * Validates that a state transition is permitted by the state machine.
 * Throws if the transition is illegal — no silent bypasses.
 */
export function assertValidTransition(
  from: ProjectLlmWorkflowState,
  to: ProjectLlmWorkflowState,
): void {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!(allowed as readonly string[]).includes(to)) {
    throw new Error(
      `Illegal workflow transition: ${from} → ${to}. ` +
      `Allowed: [${allowed.join(', ')}]`,
    );
  }
}

// ─── Authority gate enforcement ──────────────────────────────────────────────

/**
 * AGENT F gate: candidate intake is blocked until GUI approval is recorded.
 * The AI cannot manufacture this approval.
 */
export function assertCandidateIntakeAllowed(handoff: ExternalAiHandoff): void {
  if (handoff.status !== 'GUI_APPROVED') {
    throw new Error(
      `Candidate intake is blocked until GUI approval is recorded. ` +
      `Current handoff status: ${handoff.status}`,
    );
  }
}

/**
 * AGENT G gate: enforces that a genuine GUI approval decision exists
 * on the handoff record before candidate normalization proceeds.
 */
export function assertGuiApprovalExists(handoff: ExternalAiHandoff): void {
  if (!handoff.guiApproval || handoff.guiApproval.decision !== 'APPROVED') {
    throw new Error(
      `Agent G cannot run without GUI approval. ` +
      `guiApproval: ${JSON.stringify(handoff.guiApproval ?? null)}`,
    );
  }
}

/**
 * AGENT J gate: the integration plan must carry humanApprovalRequired = true
 * (it is a literal type, so this guard is a runtime safety net).
 */
export function assertImplementationApprovalRequired(plan: IntegrationPlanRecord): void {
  if (!plan.humanApprovalRequired) {
    throw new Error(
      'Integration plan must require human approval before implementation proceeds.',
    );
  }
}

/**
 * AGENT L gate: Project LLM cannot certify its own work.
 * Only HAA may set haaDecision; this function verifies the package has not
 * been self-certified.
 */
export function assertCannotSelfCertify(pkg: CertificationPackage): void {
  if (pkg.projectLlmStatus === 'CERTIFICATION_READY' && pkg.haaDecision !== undefined) {
    // HAA made a decision — allowed.
    return;
  }
  if (pkg.projectLlmStatus !== 'CERTIFICATION_READY' && pkg.haaDecision === undefined) {
    // Package not yet ready, no decision yet — allowed.
    return;
  }
  if (pkg.projectLlmStatus !== 'CERTIFICATION_READY') {
    throw new Error(
      'Certification package is not in CERTIFICATION_READY status; cannot record HAA decision.',
    );
  }
  // All other combinations are valid (e.g. CERTIFICATION_READY with no haaDecision yet).
}

// ─── STOP condition evaluation ───────────────────────────────────────────────

const MAX_CORRECTION_LOOPS = 3;

/**
 * Evaluates all STOP conditions for the current workflow state.
 * Returns a StopReason if the workflow must be halted, or null if execution
 * may continue.
 */
export function evaluateStopConditions(
  workflow: ProjectLlmWorkflow,
): StopReason | null {
  const { state, artifacts, correctionLoopCount } = workflow;

  // Missing artifact guards
  if (
    state === 'CANDIDATE_READY' &&
    artifacts.candidatePackage?.artifacts.length === 0
  ) {
    return 'MISSING_ARTIFACT';
  }

  // Compliance failure loop guard
  if (
    (state === 'COMPLIANCE_FAILED' || state === 'CORRECTION_REQUIRED') &&
    correctionLoopCount >= MAX_CORRECTION_LOOPS
  ) {
    return 'COMPLIANCE_FAILURE';
  }

  // Validation failure after correction already attempted
  if (
    state === 'VALIDATION_FAILED' &&
    correctionLoopCount >= MAX_CORRECTION_LOOPS
  ) {
    return 'MISSING_EVIDENCE';
  }

  // Security failures always stop immediately
  if (artifacts.complianceReview) {
    const hasSecurityFail = artifacts.complianceReview.findings.some(
      (f) => f.category === 'SECURITY' && f.result === 'FAIL',
    );
    if (hasSecurityFail && state === 'COMPLIANCE_FAILED') {
      return 'SECURITY_FAILURE';
    }
  }

  // Architecture-change requests are always blocked
  if (artifacts.complianceReview) {
    const hasArchFail = artifacts.complianceReview.findings.some(
      (f) => f.category === 'ARCHITECTURE' && f.result === 'FAIL',
    );
    if (hasArchFail) {
      return 'ARCHITECTURE_CHANGE_REQUESTED';
    }
  }

  // HAA issued a STOP decision
  if (artifacts.certificationPackage?.haaDecision === 'STOP') {
    return 'HAA_STOP';
  }

  return null;
}

// ─── Agent stubs (NOT IMPLEMENTED — replaced by real agents sequentially) ───

type AgentFn<T> = (workflow: ProjectLlmWorkflow) => Promise<AgentExecutionResult<T>>;

const NOT_IMPLEMENTED_STUB = (agentName: string): AgentFn<unknown> =>
  async (_workflow) => ({
    agent: agentName,
    success: false,
    nextState: null,
    blockers: [`${agentName} is not yet implemented.`],
    requiresHumanAction: false,
  });

// Stubs replaced when each agent is implemented:
const runAgentF = NOT_IMPLEMENTED_STUB('AGENT_F') as AgentFn<unknown>;
const runAgentG = NOT_IMPLEMENTED_STUB('AGENT_G') as AgentFn<unknown>;
const runAgentH = NOT_IMPLEMENTED_STUB('AGENT_H') as AgentFn<unknown>;
const runAgentI = NOT_IMPLEMENTED_STUB('AGENT_I') as AgentFn<unknown>;
const runAgentJ = NOT_IMPLEMENTED_STUB('AGENT_J') as AgentFn<unknown>;
const runAgentK = NOT_IMPLEMENTED_STUB('AGENT_K') as AgentFn<unknown>;
const runAgentL = NOT_IMPLEMENTED_STUB('AGENT_L') as AgentFn<unknown>;

// ─── Main orchestration loop ──────────────────────────────────────────────────

/**
 * Runs the Project LLM workflow from its current state, advancing
 * autonomously through all states that do not require human or HAA authority.
 *
 * Stops and returns status='WAITING' when:
 *   - The workflow reaches an authority-required state
 *   - An agent returns requiresHumanAction = true
 *
 * Stops and returns status='STOPPED' when:
 *   - A STOP condition fires
 *   - A terminal STOPPED state is reached
 *
 * Stops and returns status='COMPLETE' when:
 *   - A terminal CERTIFIED or REJECTED state is reached
 */
export async function runWorkflow(
  workflowId: string,
  store: ProjectLlmWorkflowStore,
): Promise<ProjectLlmWorkflowResult> {
  const workflow = await store.get(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  let current = workflow;

  while (!isTerminal(current.state)) {
    // Check authority-required pause points
    if (requiresAuthority(current.state)) {
      return {
        status: 'WAITING',
        workflow: current,
        reason: `Workflow is paused at authority-required state: ${current.state}`,
      };
    }

    // Evaluate STOP conditions before running the next agent
    const stopReason = evaluateStopConditions(current);
    if (stopReason !== null) {
      const stopped: ProjectLlmWorkflow = {
        ...current,
        state: 'STOPPED',
        stopReason,
        metadata: {
          ...current.metadata,
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
      };
      await store.save(stopped);
      return { status: 'STOPPED', workflow: stopped, reason: stopReason };
    }

    // Dispatch to the correct agent for the current state
    let result: AgentExecutionResult<unknown>;

    switch (current.state) {
      case 'HANDOFF_READY':
        result = await runAgentF(current);
        break;
      case 'GUI_APPROVED':
        result = await runAgentG(current);
        break;
      case 'CANDIDATE_READY':
        result = await runAgentH(current);
        break;
      case 'COMPLIANCE_FAILED':
      case 'CORRECTION_REQUIRED':
      case 'VALIDATION_FAILED':
        result = await runAgentI(current);
        break;
      case 'COMPLIANCE_PASSED':
        result = await runAgentJ(current);
        break;
      case 'IMPLEMENTED':
        result = await runAgentK(current);
        break;
      case 'CERTIFICATION_READY':
        result = await runAgentL(current);
        break;
      default:
        // States not dispatched here are either authority-required (handled above),
        // terminal (loop exits), or waiting for external state change (AWAITING_*).
        return {
          status: 'WAITING',
          workflow: current,
          reason: `No autonomous agent handles state: ${current.state}`,
        };
    }

    // Agent returned requiresHumanAction — pause immediately
    if (result.requiresHumanAction) {
      return {
        status: 'WAITING',
        workflow: current,
        reason: result.humanAction?.reason ?? 'Agent requires human action',
      };
    }

    // Agent failed without a valid next state — stop the workflow
    if (!result.success || result.nextState === null) {
      const stopped: ProjectLlmWorkflow = {
        ...current,
        state: 'STOPPED',
        stopReason: 'UNKNOWN_REQUIREMENT',
        metadata: {
          ...current.metadata,
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
      };
      await store.save(stopped);
      return {
        status: 'STOPPED',
        workflow: stopped,
        reason: result.blockers?.join('; ') ?? 'Agent failed',
      };
    }

    // Validate and apply the state transition
    assertValidTransition(current.state, result.nextState);

    const updatedCorrectionCount =
      result.nextState === 'CANDIDATE_READY' && current.state === 'CORRECTION_REQUIRED'
        ? current.correctionLoopCount + 1
        : current.correctionLoopCount;

    current = {
      ...current,
      state: result.nextState,
      correctionLoopCount: updatedCorrectionCount,
      metadata: {
        ...current.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    await store.save(current);
  }

  // Workflow reached a terminal state
  const completed = {
    ...current,
    metadata: {
      ...current.metadata,
      completedAt: current.metadata.completedAt ?? new Date().toISOString(),
    },
  };
  await store.save(completed);

  return { status: 'COMPLETE', workflow: completed };
}
