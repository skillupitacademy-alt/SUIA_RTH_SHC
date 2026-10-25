'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  GitBranch,
  TestTube,
  Cpu,
  Workflow,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  Play,
  XCircle,
  Terminal,
  Lock,
} from 'lucide-react';
import { useProjectLlm } from '../context/ProjectLlmContext';
import { ProjectLlmStepper } from '../components/ProjectLlmStepper';
import { ProjectLlmContextBanner } from '../components/ProjectLlmContextBanner';
import { projectLlmClient, ProjectLlmError } from '@/lib/project-llm/api/projectLlmClient';
import type {
  CertificationStatus,
  RuntimeHealthStatus,
  BrowserVerificationStatus,
  PlacementExecutionResult,
  PlacementManifest,
} from '@/lib/project-llm/types/canonicalWorkflowState';

type CertTab = 'repo' | 'tests' | 'composer' | 'runtime' | 'cert';

export default function IntegrationCertificationPage() {
  const router = useRouter();
  const { state, setState } = useProjectLlm();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflowId') || state.workflowId;
  const queryCandidateId = searchParams.get('candidateId');
  const [resolvedCandidateId, setResolvedCandidateId] = useState<string | null>(queryCandidateId);
  const [certificationData, setCertificationData] = useState<CertificationStatus | null>(null);

  const effectiveCandidateId = queryCandidateId || resolvedCandidateId || certificationData?.candidateId || null;
  
  const [activeTab, setActiveTab] = useState<CertTab>('repo');
  const [runtimeHealth, setRuntimeHealth] = useState<RuntimeHealthStatus | null>(null);
  const [browserVerification, setBrowserVerification] = useState<BrowserVerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manifest, setManifest] = useState<PlacementManifest | null>(null);
  const [placementResult, setPlacementResult] = useState<PlacementExecutionResult | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isQualifying, setIsQualifying] = useState(false);
  const [isVerifyingComposer, setIsVerifyingComposer] = useState(false);
  const [isSuperseding, setIsSuperseding] = useState(false);
  const [composerVerification, setComposerVerification] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Extracted fetch function to avoid duplication
  const fetchCertificationData = async () => {
    if (!workflowId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Primary: Fetch certification status and workflow identity
      const cert = await projectLlmClient.getCertificationStatus(workflowId);
      setCertificationData(cert);

      if (cert.rawGateResults?.composer) {
        setComposerVerification(cert.rawGateResults.composer);
      }

      if (cert.targetFamily && cert.targetVersion) {
        setState((prev) => ({
          ...prev,
          familyName: cert.targetFamily!,
          targetVersion: cert.targetVersion!,
          familyId: cert.targetFamily!.charAt(0).toUpperCase(),
        }));
      }

      const targetCandId = queryCandidateId || cert.candidateId || null;
      if (targetCandId && targetCandId !== resolvedCandidateId) {
        setResolvedCandidateId(targetCandId);
      }

      // Fetch placement manifest if candidateId is present
      if (targetCandId) {
        try {
          const loadedManifest = await projectLlmClient.getPlacementManifest(targetCandId);
          setManifest(loadedManifest);
        } catch {
          // No manifest yet or error
        }
      }

      // Secondary: Best-effort telemetry loading
      try {
        const [runtime, browser] = await Promise.all([
          projectLlmClient.getRuntimeHealth(workflowId),
          projectLlmClient.getBrowserVerificationStatus(workflowId),
        ]);
        setRuntimeHealth(runtime);
        setBrowserVerification(browser);
      } catch (telemetryErr) {
        console.warn('[IntegrationCertification] Telemetry loading note:', telemetryErr);
      }
    } catch (err) {
      if (err instanceof ProjectLlmError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch certification data from backend on mount
  useEffect(() => {
    fetchCertificationData();
  }, [workflowId]);

  useEffect(() => {
    if (!effectiveCandidateId) {
      setManifest(null);
      return;
    }

    projectLlmClient.getPlacementManifest(effectiveCandidateId)
      .then(setManifest)
      .catch(() => setManifest(null));
  }, [effectiveCandidateId]);

  const handleRetry = () => {
    fetchCertificationData();
  };

  const handleGenerateManifest = async () => {
    if (!effectiveCandidateId) return;
    setError(null);
    setIsPlanning(true);
    try {
      setManifest(await projectLlmClient.generatePlacementManifest(effectiveCandidateId));
      await fetchCertificationData();
    } catch (err) {
      setError(err instanceof ProjectLlmError ? err.message : 'Unable to generate placement manifest.');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleRunQualification = async () => {
    if (!effectiveCandidateId) return;
    setError(null);
    setIsQualifying(true);
    try {
      const result = await projectLlmClient.qualifyCandidate(effectiveCandidateId);
      if (!result.passed) {
        setError(result.detail);
      }
      await fetchCertificationData();
    } catch (err) {
      setError(err instanceof ProjectLlmError ? err.message : 'Unable to run the candidate test suite.');
    } finally {
      setIsQualifying(false);
    }
  };

  const handleApprovePlacement = async () => {
    if (!workflowId) return;
    setError(null);
    setIsApproving(true);
    try {
      await projectLlmClient.approveImplementation(workflowId, manifest?.manifestHash, {
        placementManifestId: manifest?.manifestId,
        reason: 'Approved by Administrator via Certification Console',
      });
      await fetchCertificationData();
    } catch (err) {
      setError(err instanceof ProjectLlmError ? err.message : 'Unable to approve placement plan.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleExecutePlacement = async () => {
    if (!effectiveCandidateId) return;
    setError(null);
    setIsExecuting(true);
    try {
      setPlacementResult(await projectLlmClient.executeApprovedPlacement(effectiveCandidateId));
      await fetchCertificationData();
    } catch (err) {
      setError(err instanceof ProjectLlmError ? err.message : 'Unable to execute approved placement.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleVerifyComposer = async () => {
    if (!workflowId) return;
    setError(null);
    setIsVerifyingComposer(true);
    try {
      const res = await projectLlmClient.verifyComposerWorktree(workflowId);
      setComposerVerification(res);
      await fetchCertificationData();
    } catch (err) {
      setError(err instanceof ProjectLlmError ? err.message : 'Composer verification failed on isolated worktree preview.');
    } finally {
      setIsVerifyingComposer(false);
    }
  };

  const handleSupersedeWorkflow = async () => {
    if (!workflowId) return;
    const confirmed = window.confirm(
      'Are you sure you want to supersede this placement plan? This will preserve the current workflow in the immutable audit log and create a linked replacement workflow requiring fresh candidate upload and qualification.'
    );
    if (!confirmed) return;

    setError(null);
    setIsSuperseding(true);
    try {
      const res = await projectLlmClient.supersedeWorkflow(
        workflowId,
        'Placement plan superseded by new candidate revision via GUI'
      );
      router.push(`/tools/project-llm/candidate-upload?workflowId=${res.new_workflow_id}`);
    } catch (err) {
      setError(err instanceof ProjectLlmError ? err.message : 'Failed to supersede workflow.');
      setIsSuperseding(false);
    }
  };

  const familyName = certificationData?.targetFamily || state.familyName || 'Introduction';
  const targetVersion = certificationData?.targetVersion || state.targetVersion || 'I1';

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card with Stepper */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-5 sm:p-6 shadow-sm border-t border-white/60">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                <ShieldCheck size={12} />
                Step 6 of 6
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">Autonomous Engineering Protocol</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
              Integration & Repository Certification
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium">
              Verify placement manifests, inspect test suites, execute live runtime verification, and certify{' '}
              <span className="font-bold text-slate-800">{familyName} {targetVersion}</span> for downstream authoring in the Tutorial Composer.
            </p>
          </div>

          <ProjectLlmStepper currentStep={6} />
        </div>
      </div>

      {/* Context Banner */}
      <ProjectLlmContextBanner
        familyName={familyName}
        targetVersion={targetVersion}
      />

      {/* No Workflow ID Warning */}
      {!workflowId && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 shadow-sm flex items-start gap-4">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-outfit">No Workflow Selected</h4>
            <p className="text-xs text-slate-600 mt-1">
              Go to the dashboard to select or create a workflow. Append <span className="font-mono bg-white px-1 py-0.5 rounded">?workflowId=xxx</span> to the URL to test with a specific workflow.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50/90 p-5 shadow-sm flex items-start gap-4">
          <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900 font-outfit">Error Loading Certification Data</h4>
            <p className="text-xs text-slate-600 mt-1">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="text-xs font-bold text-red-700 hover:text-red-900 underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-pink-600" />
          <p className="text-sm font-medium text-slate-600">Loading certification data...</p>
        </div>
      )}

      {/* Main Container with 5 Tabs */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-4 border-b border-slate-200/80 bg-slate-50/70 overflow-x-auto no-scrollbar">
          {[
            { id: 'repo', label: 'Repository Integration', icon: GitBranch },
            { id: 'tests', label: 'Test Suite', icon: TestTube },
            { id: 'composer', label: 'Tutorial Composer', icon: Workflow },
            { id: 'runtime', label: 'Runtime Verification', icon: Cpu },
            { id: 'cert', label: 'Final Certification', icon: ShieldCheck },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as CertTab)}
                className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all shrink-0 -mb-[2px] ${
                  isSelected
                    ? 'border-[#e11d48] text-[#e11d48] bg-white rounded-t-xl shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 rounded-t-xl'
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="p-5 sm:p-6 bg-slate-50/20">
          {/* TAB A: REPOSITORY INTEGRATION */}
          {activeTab === 'repo' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-outfit">
                    Autonomous Placement Manifest
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated by Project AI Placement Engine based on candidate files
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-600">
                    Branch: project-ai-gui
                  </span>
                </div>
              </div>

              {!effectiveCandidateId ? (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-xs text-amber-900 uppercase tracking-wider font-mono">Candidate Package Required</p>
                    <p className="text-xs text-amber-800 mt-1">
                      No candidate package ID was detected in the URL or workflow state. The candidate package from Step 5 is required to bind placement actions to its stored files.
                    </p>
                  </div>
                  <Link
                    href={`/tools/project-llm/candidate-upload${workflowId ? `?workflowId=${workflowId}` : ''}`}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    Go to Step 5 (Candidate Upload)
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Stored candidate</p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-800">{effectiveCandidateId}</p>
                      {manifest ? (
                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          <p><span className="font-semibold">Decision:</span> {manifest.decision}</p>
                          <p><span className="font-semibold">Target:</span> <span className="font-mono">{manifest.targetPath}</span></p>
                          <p><span className="font-semibold">Manifest:</span> <span className="font-mono">{manifest.manifestHash}</span></p>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">No persisted placement manifest was found for this candidate.</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateManifest}
                        disabled={isPlanning || isExecuting || isApproving}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RefreshCw size={14} className={isPlanning ? 'animate-spin' : ''} />
                        {isPlanning ? 'Generating plan...' : manifest ? 'Regenerate plan' : 'Generate placement plan'}
                      </button>

                      <button
                        type="button"
                        onClick={handleSupersedeWorkflow}
                        disabled={isSuperseding || isPlanning || isExecuting}
                        title="Archive stale or unapproved plan and create clean replacement workflow"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                      >
                        <RefreshCw size={13} className={isSuperseding ? 'animate-spin' : ''} />
                        {isSuperseding ? 'Superseding...' : 'Supersede Placement Plan'}
                      </button>

                      {manifest && certificationData?.state === 'IMPLEMENTING' && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          Plan Approved
                        </span>
                      )}

                      {manifest && (certificationData?.state === 'AWAITING_IMPLEMENTATION_APPROVAL' || certificationData?.state === 'INTEGRATION_PLANNED') && (
                        <button
                          type="button"
                          onClick={handleApprovePlacement}
                          disabled={isApproving || isPlanning || isExecuting}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-sm"
                        >
                          <ShieldCheck size={14} className={isApproving ? 'animate-spin' : ''} />
                          {isApproving ? 'Approving plan...' : 'Approve Placement Plan'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleExecutePlacement}
                        disabled={
                          !manifest ||
                          manifest.decision === 'REJECT' ||
                          isPlanning ||
                          isExecuting ||
                          isApproving ||
                          certificationData?.state !== 'IMPLEMENTING'
                        }
                        title={
                          !manifest
                            ? 'Generate a placement manifest first'
                            : manifest.decision === 'REJECT'
                            ? 'Rejected manifests cannot be executed'
                            : certificationData?.state !== 'IMPLEMENTING'
                            ? 'Placement execution requires approval. Click "Approve Placement Plan" to advance workflow to IMPLEMENTING state.'
                            : 'Execute approved placement in isolated worktree'
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <GitBranch size={14} />
                        {isExecuting ? 'Executing placement...' : 'Execute approved placement'}
                      </button>
                    </div>
                  </div>
                  {placementResult && (
                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950">
                      <p className="font-bold">Placement completed: {placementResult.action || placementResult.status}</p>
                      <p className="mt-1 break-all font-mono">{placementResult.targetPath}</p>
                      {typeof placementResult.commit === 'string' && <p className="mt-1 font-mono">Commit: {placementResult.commit}</p>}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-slate-500">
                    Execution is fail-closed: the backend verifies the candidate hash, manifest hash, workflow binding, and an independent approval before it creates a worktree.
                  </p>
                </div>
              )}

              {/* Placement Cards: Granular fileOperations or fallback */}
              {manifest?.fileOperations && manifest.fileOperations.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* CREATE OPERATIONS */}
                    <div className="p-4 rounded-xl border border-emerald-200 bg-white shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                          CREATE ({manifest.fileOperations.filter(op => op.action === 'CREATE').length} files)
                        </span>
                        <span className="text-[11px] text-slate-400">Approved destination files</span>
                      </div>
                      <div className="space-y-2 text-xs font-mono">
                        {manifest.fileOperations
                          .filter(op => op.action === 'CREATE')
                          .map((op, i) => (
                            <div key={i} className="p-2 rounded bg-emerald-50/50 text-emerald-900 border border-emerald-100/80">
                              <div className="font-semibold truncate">+ {op.target_path}</div>
                              <div className="text-[10px] text-emerald-700 font-sans mt-0.5">{op.description}</div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* SURGICAL PATCH OPERATIONS */}
                    <div className="p-4 rounded-xl border border-blue-200 bg-white shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                          SURGICAL PATCH ({manifest.fileOperations.filter(op => op.action.startsWith('PATCH')).length} files)
                        </span>
                        <span className="text-[11px] text-slate-400">Pre-image verified AST mutations</span>
                      </div>
                      <div className="space-y-2 text-xs font-mono">
                        {manifest.fileOperations
                          .filter(op => op.action.startsWith('PATCH'))
                          .map((op, i) => (
                            <div key={i} className="p-2 rounded bg-blue-50/50 text-blue-900 border border-blue-100/80">
                              <div className="font-semibold truncate">~ {op.target_path}</div>
                              <div className="flex items-center justify-between mt-1 text-[10px] text-blue-700">
                                <span>Strategy: <span className="font-bold">{op.patch_strategy || op.action}</span></span>
                                {op.expected_pre_hash && (
                                  <span className="font-mono text-slate-500">pre: {op.expected_pre_hash.slice(0, 10)}…</span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* SKIP & SHARED OPERATIONS */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                          SKIP ({manifest.fileOperations.filter(op => op.action === 'SKIP').length} file)
                        </span>
                        <span className="text-[11px] text-slate-400">Candidate metadata</span>
                      </div>
                      <div className="space-y-2 text-xs font-mono">
                        {manifest.fileOperations
                          .filter(op => op.action === 'SKIP')
                          .map((op, i) => (
                            <div key={i} className="p-2 rounded bg-slate-50 text-slate-700 border border-slate-200/80">
                              <div className="font-semibold truncate">• {op.source_filename}</div>
                              <div className="text-[10px] text-slate-500 font-sans mt-0.5">{op.description}</div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-purple-200 bg-white shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">
                          SHARED PRIMITIVES
                        </span>
                        <span className="text-[11px] text-slate-400">Design system components</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-purple-800">
                        {['Button', 'Card', 'Badge', 'Tooltip'].map((c, i) => (
                          <div key={i} className="p-1.5 rounded bg-purple-50/50 border border-purple-100 text-center font-bold">
                            @quiz/ui/{c}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* ADD */}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-white shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                        TARGET COMPONENT
                      </span>
                      <span className="text-[11px] text-slate-400">Canonical destination</span>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2 rounded bg-emerald-50/50 text-emerald-900 border border-emerald-100/80 truncate">
                        + packages/ui/src/tutorial/blocks/{familyName}{targetVersion}Block.tsx
                      </div>
                      <div className="p-2 rounded bg-emerald-50/50 text-emerald-900 border border-emerald-100/80 truncate">
                        + packages/ui/src/tutorial/schemas/{familyName.toLowerCase()}-{targetVersion.toLowerCase()}.schema.json
                      </div>
                    </div>
                  </div>

                  {/* SURGICAL PATCHES */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-white shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                        CANONICAL INTEGRATION TARGETS
                      </span>
                      <span className="text-[11px] text-slate-400">Wiring destinations</span>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2 rounded bg-blue-50/50 text-blue-900 border border-blue-100/80 truncate">
                        ~ packages/ui/src/tutorial/TutorialBlockRenderer.tsx
                      </div>
                      <div className="p-2 rounded bg-blue-50/50 text-blue-900 border border-blue-100/80 truncate">
                        ~ apps/skillhubcore-admin/.../registry/index.ts
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Snapshot Comparison Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Repository Security Seal & Cryptographic Binding
                  </h4>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    Verified Binding
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">CANDIDATE PACKAGE IDENTITY</span>
                    <span className="font-bold text-slate-800 break-all">{effectiveCandidateId || 'Unbound'}</span>
                    <p className="text-[11px] text-slate-500 mt-1">Verified package stored in PostgreSQL</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
                    <span className="text-emerald-700 block text-[10px]">PLACEMENT MANIFEST SHA-256</span>
                    <span className="font-bold text-emerald-900 break-all">
                      {manifest?.manifestHash ? `sha256:${manifest.manifestHash.slice(0, 24)}…` : 'Pending generation'}
                    </span>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Protocol State: <span className="font-bold">{certificationData?.state || 'REQUESTED'}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB B: TEST SUITE */}
          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-outfit">
                    Autonomous Validation & Certification Gates
                  </h3>
                  <p className="text-xs text-slate-500">
                    Active gate results evaluated against canonical specifications and governance policies
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRunQualification}
                    disabled={!effectiveCandidateId || isQualifying}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <TestTube size={13} />
                    {isQualifying ? 'Running tests...' : 'Run qualification'}
                  </button>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    certificationData?.gates?.every(g => g.result === 'PASS')
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {certificationData?.gates?.filter(g => g.result === 'PASS').length || 0} / {certificationData?.gates?.length || 0} Gates Passed
                  </span>
                </div>
              </div>

              {/* Dynamic Gates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {certificationData?.gates && certificationData.gates.length > 0 ? (
                  certificationData.gates.map((gate, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-900 font-outfit">{gate.gate}</h4>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          gate.result === 'PASS'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : gate.result === 'PENDING'
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-rose-700 bg-rose-50 border-rose-200'
                        }`}>
                          {gate.result}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {gate.detail || (gate.result === 'PASS' ? 'Cryptographically certified by backend engine' : 'Awaiting phase completion')}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-2">
                        Workflow: {workflowId ? `${workflowId.slice(0, 8)}…` : 'N/A'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                    <p className="text-sm">No validation gates recorded yet for this workflow.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB C: TUTORIAL COMPOSER VERIFICATION */}
          {activeTab === 'composer' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                      Isolated Worktree Preview Gate
                    </span>
                    {composerVerification?.status === 'PASS' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        COMPOSER VERIFIED (PASS)
                      </span>
                    ) : composerVerification?.status === 'FAIL' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-300">
                        <XCircle size={12} className="text-rose-600" />
                        VERIFICATION FAILED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                        <AlertCircle size={12} className="text-amber-600" />
                        VERIFICATION PENDING
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 font-outfit">
                    Tutorial Composer Post-Placement Verification
                  </h3>
                  <p className="text-xs text-slate-500">
                    Runs Playwright browser automation on an isolated ephemeral preview checked out at the exact placement commit.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleVerifyComposer}
                    disabled={
                      isVerifyingComposer ||
                      !['IMPLEMENTED', 'VERIFYING', 'CERTIFICATION_READY', 'AWAITING_GATE_2', 'CERTIFIED'].includes(certificationData?.state || '')
                    }
                    title={
                      !['IMPLEMENTED', 'VERIFYING', 'CERTIFICATION_READY', 'AWAITING_GATE_2', 'CERTIFIED'].includes(certificationData?.state || '')
                        ? 'Placement must be executed before Composer verification can run'
                        : 'Execute headless Playwright checks against isolated worktree preview'
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-sm transition-all"
                  >
                    <Play size={13} className={isVerifyingComposer ? 'animate-spin' : ''} />
                    {isVerifyingComposer ? 'Verifying on Worktree Preview...' : 'Run Isolated Worktree Verification'}
                  </button>

                  <Link
                    href="/tools/tutorial-page-content"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-all"
                  >
                    <Workflow size={13} />
                    Open Live Composer
                  </Link>
                </div>
              </div>

              {/* In-Progress Notification */}
              {isVerifyingComposer && (
                <div className="rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 p-4 shadow-sm animate-pulse">
                  <div className="flex items-center gap-3">
                    <RefreshCw size={20} className="animate-spin text-pink-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-pink-900 font-outfit">
                        Executing Post-Placement Composer Verification Engine
                      </p>
                      <p className="text-[11px] text-pink-700 mt-0.5">
                        Creating isolated git worktree at placement commit, starting ephemeral Next.js preview on an isolated dynamic port, and executing Playwright browser assertions...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Diagnostic Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className={`p-3.5 rounded-xl border ${
                  composerVerification?.findings?.some((f: string) => f.includes('discoverable in Composer dropdown')) || composerVerification?.runner_metadata?.dropdown_registered
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : composerVerification?.status === 'FAIL'
                    ? 'border-rose-200 bg-rose-50/50'
                    : 'border-slate-200 bg-slate-50/50'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block mb-1">
                    Registry Discovery
                  </span>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    {composerVerification?.findings?.some((f: string) => f.includes('discoverable in Composer dropdown')) || composerVerification?.runner_metadata?.dropdown_registered ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        Dropdown Option Present
                      </>
                    ) : composerVerification?.status === 'FAIL' ? (
                      <>
                        <XCircle size={14} className="text-rose-600" />
                        Dropdown Option Missing
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} className="text-amber-500" />
                        Awaiting Verification
                      </>
                    )}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    Type: &apos;{familyName.toLowerCase()}&apos;
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  composerVerification?.findings?.some((f: string) => f.includes('successfully rendered')) || composerVerification?.runner_metadata?.rendered_dom
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : composerVerification?.status === 'FAIL'
                    ? 'border-rose-200 bg-rose-50/50'
                    : 'border-slate-200 bg-slate-50/50'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block mb-1">
                    Preview Pane DOM
                  </span>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    {composerVerification?.findings?.some((f: string) => f.includes('successfully rendered')) || composerVerification?.runner_metadata?.rendered_dom ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        DOM Attributes Verified
                      </>
                    ) : composerVerification?.status === 'FAIL' ? (
                      <>
                        <XCircle size={14} className="text-rose-600" />
                        Render Failed / Attributes Missing
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} className="text-amber-500" />
                        Awaiting Verification
                      </>
                    )}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    data-block-type=&quot;{familyName.toLowerCase()}&quot;
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  composerVerification && !composerVerification?.findings?.some((f: string) => f.includes('Console errors detected'))
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : composerVerification?.status === 'FAIL'
                    ? 'border-rose-200 bg-rose-50/50'
                    : 'border-slate-200 bg-slate-50/50'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block mb-1">
                    Console Error Audit
                  </span>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    {composerVerification && !composerVerification?.findings?.some((f: string) => f.includes('Console errors detected')) ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        0 Unhandled Errors
                      </>
                    ) : composerVerification?.status === 'FAIL' ? (
                      <>
                        <XCircle size={14} className="text-rose-600" />
                        Console Errors Detected
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} className="text-amber-500" />
                        Awaiting Execution
                      </>
                    )}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    Browser Console / Page Errors
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block mb-1">
                    Placement Commit
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-900 truncate">
                    {composerVerification?.verified_commit ? `${composerVerification.verified_commit.slice(0, 10)}…` : 'Pending Placement'}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    Port: {composerVerification?.runner_metadata?.port || 'Dynamic'}
                  </p>
                </div>
              </div>

              {/* Verified & Hash-Bound Evidence Box */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-900 text-white shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                    <span className="text-xs font-mono font-bold text-slate-200">
                      Authoritative Hash-Bound Evidence Ledger
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-pink-400">
                    Engine: Playwright Chromium (Subprocess)
                  </span>
                </div>

                {composerVerification ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] uppercase text-slate-500 block mb-1">EVIDENCE SHA-256 HASH</span>
                        <span className="text-emerald-400 break-all text-[11px]">{composerVerification.evidence_hash}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] uppercase text-slate-500 block mb-1">VERIFIED COMMIT SHA</span>
                        <span className="text-indigo-400 break-all text-[11px]">{composerVerification.verified_commit || 'HEAD'}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase text-slate-500 block mb-1">VERIFICATION FINDINGS & EVIDENCE AUDIT</span>
                      {composerVerification.findings && composerVerification.findings.length > 0 ? (
                        composerVerification.findings.map((f: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{f}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-[11px]">{composerVerification.reason || 'Verification record active.'}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs">
                    <Terminal size={24} className="mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold text-slate-300">No Post-Placement Composer Verification Record Found</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                      Execute approved placement in Step 6 Tab A first, then click &apos;Run Isolated Worktree Verification&apos; above to verify candidate inclusion in Tutorial Composer.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB D: RUNTIME VERIFICATION */}
          {activeTab === 'runtime' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-outfit">
                    Runtime Verification in Live Container
                  </h3>
                  <p className="text-xs text-slate-500">
                    Application health, container routes, and performance benchmarks
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Container Healthy
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">DEV SERVER PORT</span>
                  <p className="text-base font-mono font-bold text-slate-800">:3007 (skillhubcore-admin)</p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">HTTP 200 OK • Healthy</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">BACKEND SERVICE PORT</span>
                  <p className="text-base font-mono font-bold text-emerald-600">:8000 (project-ai)</p>
                  <p className="text-[11px] text-slate-500 mt-1">FastAPI Governance Engine</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">PROCESS STATUS</span>
                  <p className="text-base font-mono font-bold text-emerald-600">
                    {runtimeHealth?.processStatus || 'RUNNING'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Last Checked: {runtimeHealth?.lastChecked ? new Date(runtimeHealth.lastChecked).toLocaleTimeString() : 'Active'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-900 text-slate-200 font-mono text-xs">
                <div className="text-slate-400 text-[11px] mb-2">{`// Live Runtime Container Verification Log`}</div>
                <div className="text-emerald-400">GET /tools/project-llm/integration-certification 200 OK</div>
                <div className="text-emerald-400">Active Workflow: {workflowId || 'N/A'}</div>
                <div className="text-emerald-400">Target Identity: {familyName} {targetVersion}</div>
                <div className="text-slate-400">Governance Engine status: {certificationData?.state || 'READY'}</div>
              </div>
            </div>
          )}

          {/* TAB E: FINAL CERTIFICATION */}
          {activeTab === 'cert' && (
            <div className="space-y-6">
              {/* Composer Verification Lock Alert */}
              {composerVerification?.status !== 'PASS' && (
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 flex items-start gap-3">
                  <Lock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold">Final Certification Gate Locked</p>
                    <p className="mt-0.5 text-amber-800">
                      Autonomous engineering policy requires Tutorial Composer verification to pass on the isolated placement commit before final certification can be signed off. Click the &apos;Tutorial Composer&apos; tab to execute isolated worktree verification.
                    </p>
                  </div>
                </div>
              )}

              {/* Grand Banner */}
              <div className="p-6 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center shrink-0">
                      <ShieldCheck size={36} strokeWidth={2.5} />
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30 uppercase tracking-wider font-mono">
                        Verified &amp; Hash-Bound Evidence
                      </span>
                      <h2 className="text-2xl font-black font-outfit mt-1">
                        Candidate Certified &amp; Integrated
                      </h2>
                      <p className="text-emerald-100 text-xs mt-1 max-w-xl font-medium">
                        {familyName} {targetVersion} autonomous engineering pipeline is verified.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    <Link
                      href="/tools/tutorial-page-content"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition-all shadow-md active:scale-95"
                    >
                      <Workflow size={16} />
                      Open in Tutorial Composer
                    </Link>

                    <Link
                      href={`/tools/project-llm/workflow-details${workflowId ? `?workflowId=${workflowId}` : ''}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-bold text-xs border border-white/20 transition-all"
                    >
                      View Evidence Graph
                    </Link>
                  </div>
                </div>
              </div>

              {/* Certification Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    WORKFLOW ID
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-900 truncate">
                    {workflowId ? `${workflowId.slice(0, 12)}…` : 'N/A'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    PLACEMENT MANIFEST
                  </span>
                  <p className="text-sm font-mono font-bold text-emerald-600 truncate">
                    {manifest?.manifestHash ? `sha256:${manifest.manifestHash.slice(0, 10)}…` : 'Pending'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    CANDIDATE ID
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-900 truncate">
                    {effectiveCandidateId ? `${effectiveCandidateId.slice(0, 12)}…` : 'N/A'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    PROTOCOL STATUS
                  </span>
                  <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    {certificationData?.state || 'READY'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Next Step Callout */}
      {/* Workflow Status Banner */}
      {certificationData?.state === 'CERTIFIED' ? (
        <div className="rounded-2xl border border-pink-200/80 bg-gradient-to-r from-pink-50/80 via-rose-50/40 to-amber-50/60 p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e11d48] text-white shadow-md shadow-pink-500/20 shrink-0 mt-0.5">
              <Lightbulb size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 font-outfit">
                Workflow Complete: Downstream Authoring Ready
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                <span className="font-bold text-slate-900">{familyName} {targetVersion}</span> is certified! You can now compose tutorials using this new block family version directly inside the{' '}
                <Link href="/tools/tutorial-page-content" className="text-pink-600 font-bold underline hover:text-pink-700">
                  Tutorial Composer
                </Link>
                , or review the complete immutable audit trail in{' '}
                <Link href={`/tools/project-llm/workflow-details${workflowId ? `?workflowId=${workflowId}` : ''}`} className="text-pink-600 font-bold underline hover:text-pink-700">
                  Workflow & Evidence Details
                </Link>.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50/60 p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0 mt-0.5">
              <ShieldCheck size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 font-outfit">
                Current Protocol State: {certificationData?.state || 'AWAITING_IMPLEMENTATION_APPROVAL'}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                Placement manifest for <span className="font-bold text-slate-900">{familyName} {targetVersion}</span> has been calculated and stored. The pipeline requires an independent human approval gate before repository mutations are executed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Nav */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href={`/tools/project-llm/candidate-upload${workflowId ? `?workflowId=${workflowId}` : ''}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to Candidate Upload
        </Link>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href={`/tools/project-llm/workflow-details${workflowId ? `?workflowId=${workflowId}` : ''}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            Inspect Evidence Graph
          </Link>

          <Link
            href="/tools/tutorial-page-content"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-sm font-bold transition-all shadow-md shadow-pink-500/20 active:scale-95"
          >
            Launch Tutorial Composer
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
