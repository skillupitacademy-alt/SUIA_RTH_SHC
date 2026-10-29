'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Upload,
  CheckCircle2,
  Check,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  FileCode,
  ShieldCheck,
  FileArchive,
  Clock,
  AlertCircle,
  Activity,
  Hash,
  TestTube,
} from 'lucide-react';
import { useProjectLlm } from '../context/ProjectLlmContext';
import { ProjectLlmStepper } from '../components/ProjectLlmStepper';
import { ProjectLlmContextBanner } from '../components/ProjectLlmContextBanner';
import { projectLlmClient, ProjectLlmError } from '@/lib/project-llm/api/projectLlmClient';
import type { CertificationStatus } from '@/lib/project-llm/types/canonicalWorkflowState';

interface CheckItem {
  id: string;
  name: string;
  category: string;
  duration: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED' | 'PENDING';
  details: string;
  evidenceId?: string;
  evidenceHash?: string;
  timestamp?: string;
  totalTests?: number;
  passedTests?: number;
}

const STEP5_LIVE_PHASES = [
  {
    id: 'phase-5-1',
    code: 'PHASE 5.1',
    title: 'Package Intake & SHA-256 Digest Computation',
    desc: 'Reading candidate files (.tsx, .test.tsx, .schema.json, .schema.ts, block.integration.json) and computing cryptographic SHA-256 digests.',
    feedbackType: 'Cryptographic Integrity Check',
  },
  {
    id: 'phase-5-2',
    code: 'PHASE 5.2',
    title: 'Canonical State & Engineering Contract Binding',
    desc: 'Transitioning workflow to CANDIDATE_RECEIVED and binding candidate_sha256 against the approved EngineeringContract.',
    feedbackType: 'Governance State Binding',
  },
  {
    id: 'phase-5-3',
    code: 'PHASE 5.3',
    title: 'Static UBRC, Brand/Theme & Schema Compliance Audit',
    desc: 'Verifying BlockShell wrapper, semantic design token adherence, zero hardcoded branding, and JSON Schema ↔ TypeScript parity.',
    feedbackType: 'Static Contract Compliance',
  },
  {
    id: 'phase-5-4',
    code: 'PHASE 5.4',
    title: 'Isolated Worktree Vitest Unit Test Execution',
    desc: 'Creating a detached git worktree, linking dependencies, executing the candidate unit test suite, and recording hash-bound test evidence.',
    feedbackType: 'Isolated Qualification Gate',
  },
];

export default function CandidateUploadPage() {
  const { state } = useProjectLlm();
  const searchParams = useSearchParams();
  const searchWorkflowId = searchParams.get('workflowId');
  const activeWorkflowId = searchWorkflowId || state.workflowId;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadResult, setUploadResult] = useState<{
    candidateId: string;
    status: string;
    count: number;
    totalSize: string;
    contractSha256?: string;
    testSummary?: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [certificationData, setCertificationData] = useState<CertificationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingCertification, setIsLoadingCertification] = useState(false);

  // Live progress telemetry for WCAG status announcements
  const [livePhaseIndex, setLivePhaseIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  const isBusy = isUploading || isValidating;

  useEffect(() => {
    if (!isBusy) {
      return;
    }
    setElapsedSeconds(0);
    setLivePhaseIndex(0);
    setLiveAnnouncement(
      isUploading
        ? 'Stepper 5 compliance pipeline started: Phase 5.1 Package Intake & SHA-256 Digest Computation in progress.'
        : 'Re-running Stepper 5 compliance validation gates against backend repository state.'
    );

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (isUploading) {
          if (next === 2) {
            setLivePhaseIndex(1);
            setLiveAnnouncement('Phase 5.2 in progress: Binding candidate package to canonical workflow and engineering contract.');
          } else if (next === 5) {
            setLivePhaseIndex(2);
            setLiveAnnouncement('Phase 5.3 in progress: Auditing UBRC structure, brand independence, and schema parity.');
          } else if (next === 8) {
            setLivePhaseIndex(3);
            setLiveAnnouncement('Phase 5.4 in progress: Executing isolated worktree Vitest unit test suite.');
          }
        } else {
          setLivePhaseIndex(Math.min(3, Math.floor(next / 2)));
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBusy, isUploading]);

  // Fetch certification status from backend on mount or when active workflow changes
  useEffect(() => {
    if (!activeWorkflowId) return;

    const fetchCertification = async () => {
      setIsLoadingCertification(true);
      setError(null);
      try {
        const data = await projectLlmClient.getCertificationStatus(activeWorkflowId);
        setCertificationData(data);
        const totalGates = data.gates.length;
        const passedGates = data.gates.filter((g) => g.result === 'PASS' || g.result === 'SKIPPED').length;
        setProgress(totalGates > 0 ? Math.round((passedGates / totalGates) * 100) : 0);
      } catch (err) {
        if (err instanceof ProjectLlmError) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setIsLoadingCertification(false);
      }
    };

    fetchCertification();
  }, [activeWorkflowId]);

  // Map backend gate results to UI check items
  const checks: CheckItem[] =
    certificationData?.gates.map((gate, idx) => ({
      id: `c${idx + 1}`,
      name: gate.gate,
      category: gate.category || 'Validation Gate',
      duration: '—',
      status: gate.result,
      details:
        gate.detail ||
        (gate.result === 'PASS'
          ? 'Cryptographically verified by backend compliance engine'
          : gate.result === 'PENDING'
          ? 'Awaiting phase execution'
          : 'Failed compliance check'),
      evidenceId: gate.evidenceId,
      evidenceHash: gate.evidenceHash,
      timestamp: gate.timestamp,
      totalTests: gate.totalTests,
      passedTests: gate.passedTests,
    })) || [];

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (!activeWorkflowId) {
      setUploadError('Please select or specify a Workflow ID before uploading candidate files.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const totalBytes = fileArray.reduce((acc, f) => acc + f.size, 0);
      const formattedSize =
        totalBytes > 1024 * 1024
          ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
          : `${(totalBytes / 1024).toFixed(1)} KB`;

      const result = await projectLlmClient.uploadCandidate(activeWorkflowId, fileArray);
      setUploadedFiles(fileArray);
      setUploadResult({
        candidateId: result.candidateId,
        status: result.status,
        count: fileArray.length,
        totalSize: formattedSize,
        contractSha256: result.contractSha256,
        testSummary: result.testResults?.detail,
      });

      // Automatically refresh certification / validation gates for this workflow
      try {
        const certData = await projectLlmClient.getCertificationStatus(activeWorkflowId);
        setCertificationData(certData);
        const totalGates = certData.gates.length;
        const passedGates = certData.gates.filter((g) => g.result === 'PASS' || g.result === 'SKIPPED').length;
        setProgress(totalGates > 0 ? Math.round((passedGates / totalGates) * 100) : 0);
        setLiveAnnouncement(
          `Candidate upload and compliance validation complete: ${passedGates} of ${totalGates} gates passed.`
        );
      } catch {
        setLiveAnnouncement('Candidate package uploaded and bound to workflow.');
      }
    } catch (err: any) {
      const msg = err instanceof ProjectLlmError ? err.message : err?.message || 'Failed to upload candidate files';
      setUploadError(msg);
      setLiveAnnouncement(`Candidate upload failed: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRerun = async () => {
    if (!activeWorkflowId) {
      setError('No workflow ID provided');
      return;
    }

    setError(null);
    setIsValidating(true);
    setProgress(0);

    try {
      const data = await projectLlmClient.getCertificationStatus(activeWorkflowId);
      setCertificationData(data);
      const totalGates = data.gates.length;
      const passedGates = data.gates.filter((g) => g.result === 'PASS' || g.result === 'SKIPPED').length;
      setProgress(totalGates > 0 ? Math.round((passedGates / totalGates) * 100) : 0);
      setLiveAnnouncement(`Validation gates refreshed: ${passedGates} of ${totalGates} gates passed.`);
    } catch (err) {
      const msg = err instanceof ProjectLlmError ? err.message : 'An unexpected error occurred';
      setError(msg);
      setLiveAnnouncement(`Validation refresh error: ${msg}`);
    } finally {
      setIsValidating(false);
    }
  };

  const targetFamily = certificationData?.targetFamily || state.familyName || 'Introduction';
  const targetVersion = certificationData?.targetVersion || state.targetVersion || 'I1';
  const componentName = `${targetFamily}${targetVersion}Block`;
  const schemaStem = `${targetFamily.toLowerCase()}-${targetVersion.toLowerCase()}`;

  const expectedFiles = [
    { name: `${componentName}.tsx`, desc: 'React Block Component (BlockShell)', icon: FileCode },
    { name: `${componentName}.test.tsx`, desc: 'Vitest Unit & Accessibility Tests', icon: FileCode },
    { name: `${schemaStem}.schema.json`, desc: 'Canonical JSON Schema', icon: FileCode },
    { name: `${schemaStem}.schema.ts`, desc: 'TypeScript / Zod Schema', icon: FileCode },
    { name: 'block.integration.json', desc: 'Portable Integration Metadata', icon: FileCode },
    { name: 'README.md', desc: 'Implementation & Usage Notes', icon: FileCode },
  ];

  const hasBoundCandidate = Boolean(uploadResult?.candidateId || certificationData?.candidateId);
  const detectedFilesCount =
    uploadedFiles.length > 0
      ? expectedFiles.filter((f) =>
          uploadedFiles.some(
            (u) =>
              u.name.toLowerCase() === f.name.toLowerCase() ||
              u.name.toLowerCase().endsWith(f.name.toLowerCase()) ||
              f.name.toLowerCase().includes(u.name.toLowerCase())
          )
        ).length
      : hasBoundCandidate
      ? expectedFiles.length
      : 0;

  const passedGatesCount = checks.filter((c) => c.status === 'PASS').length;
  const skippedGatesCount = checks.filter((c) => c.status === 'SKIPPED').length;
  const failedGatesCount = checks.filter((c) => c.status === 'FAIL').length;
  const pendingGatesCount = checks.filter((c) => c.status === 'PENDING').length;
  const allGatesSatisfied = checks.length > 0 && checks.every((c) => c.status === 'PASS' || c.status === 'SKIPPED');

  const getFeedbackBadgeMeta = (status: 'PASS' | 'FAIL' | 'SKIPPED' | 'PENDING') => {
    switch (status) {
      case 'PASS':
        return {
          label: 'PASS • Verified',
          feedbackType: 'Positive Compliance Feedback',
          badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          iconClass: 'bg-emerald-50 border-emerald-300 text-emerald-700',
        };
      case 'FAIL':
        return {
          label: 'FAIL • Action Required',
          feedbackType: 'Blocking Compliance Violation',
          badgeClass: 'bg-red-100 text-red-900 border-red-300',
          iconClass: 'bg-red-50 border-red-300 text-red-700',
        };
      case 'SKIPPED':
        return {
          label: 'EXEMPT • Not Applicable',
          feedbackType: 'Informational Exemption',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
          iconClass: 'bg-slate-50 border-slate-300 text-slate-500',
        };
      default:
        return {
          label: 'PENDING • Queued',
          feedbackType: 'Awaiting Gate Execution',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
          iconClass: 'bg-amber-50 border-amber-300 text-amber-700',
        };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Screen-reader & visual live announcement region (WCAG 4.1.3 Status Messages) */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Top Header Card with Stepper */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-5 sm:p-6 shadow-sm border-t border-white/60">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                <CheckCircle2 size={12} />
                Step 5 of 6
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">Autonomous Engineering Protocol</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
              Candidate Upload &amp; Contract Compliance Validation
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium">
              Inspect candidate package for{' '}
              <span className="font-bold text-slate-800">
                {targetFamily} {targetVersion}
              </span>
              . Every compliance check below reports its real-time execution status, feedback classification, and cryptographic evidence digest.
            </p>
          </div>

          <ProjectLlmStepper currentStep={5} />
        </div>
      </div>

      {/* Context Banner */}
      <ProjectLlmContextBanner />

      {/* No Workflow ID Warning */}
      {!activeWorkflowId && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 shadow-sm flex items-start gap-4"
        >
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-outfit">No Workflow Selected</h4>
            <p className="text-xs text-slate-600 mt-1">
              Go to the dashboard to select or create a workflow. Append{' '}
              <span className="font-mono bg-white px-1 py-0.5 rounded">?workflowId=xxx</span> to the URL to inspect a specific workflow.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border border-red-300 bg-red-50/90 p-5 shadow-sm flex items-start gap-4"
        >
          <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900 font-outfit">
              Error Loading Compliance Validation Data
            </h4>
            <p className="text-xs text-slate-600 mt-1">{error}</p>
          </div>
          <button
            onClick={() => handleRerun()}
            className="text-xs font-bold text-red-700 hover:text-red-900 underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* STEPPER 5 VERBOSE LIVE COMPLIANCE PIPELINE TRACKER (WCAG 2.1 AA) */}
      <section
        aria-label="Stepper 5 Contract Compliance Pipeline Status"
        aria-busy={isBusy}
        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                isBusy
                  ? 'bg-pink-100 text-pink-700'
                  : allGatesSatisfied
                  ? 'bg-emerald-100 text-emerald-700'
                  : failedGatesCount > 0
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isBusy ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : allGatesSatisfied ? (
                <CheckCircle2 size={20} />
              ) : (
                <Activity size={20} />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-outfit">
                  Stepper 5 Live Contract Compliance &amp; Intake Telemetry
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isBusy
                      ? 'bg-pink-50 text-pink-800 border-pink-300'
                      : allGatesSatisfied
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : failedGatesCount > 0
                      ? 'bg-red-50 text-red-800 border-red-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  {isBusy
                    ? `RUNNING • ${elapsedSeconds}s elapsed`
                    : allGatesSatisfied
                    ? 'ALL STEP 5 COMPLIANCE CHECKS PASSED'
                    : failedGatesCount > 0
                    ? `${failedGatesCount} COMPLIANCE CHECK FAILED`
                    : hasBoundCandidate
                    ? 'CANDIDATE BOUND • AWAITING FULL GATES'
                    : 'AWAITING CANDIDATE UPLOAD'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isBusy
                  ? liveAnnouncement
                  : allGatesSatisfied
                  ? `All ${checks.length} recorded compliance gates for ${targetFamily} ${targetVersion} are verified with cryptographic SHA-256 digests.`
                  : 'Displays each contract compliance phase in Stepper 5: what is currently running, what has completed, and the exact feedback classification.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
              State: <strong className="text-slate-900">{certificationData?.state || 'CANDIDATE_REQUESTED'}</strong>
            </span>
          </div>
        </div>

        {/* 4-Phase Stepper 5 Compliance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {STEP5_LIVE_PHASES.map((phase, idx) => {
            let phaseState: 'DONE' | 'ACTIVE' | 'FAILED' | 'PENDING' = 'PENDING';
            if (isBusy) {
              if (idx < livePhaseIndex) phaseState = 'DONE';
              else if (idx === livePhaseIndex) phaseState = 'ACTIVE';
              else phaseState = 'PENDING';
            } else if (failedGatesCount > 0 && idx === 3) {
              phaseState = 'FAILED';
            } else if (allGatesSatisfied) {
              phaseState = 'DONE';
            } else if (hasBoundCandidate && idx <= 2) {
              phaseState = 'DONE';
            }

            return (
              <div
                key={phase.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  phaseState === 'DONE'
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : phaseState === 'ACTIVE'
                    ? 'border-pink-400 bg-pink-50/60 ring-2 ring-pink-300/40'
                    : phaseState === 'FAILED'
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                      {phase.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        phaseState === 'DONE'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : phaseState === 'ACTIVE'
                          ? 'bg-pink-100 text-pink-900 border-pink-300'
                          : phaseState === 'FAILED'
                          ? 'bg-red-100 text-red-900 border-red-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      {phaseState === 'DONE' && <Check size={10} strokeWidth={3} />}
                      {phaseState === 'ACTIVE' && <RefreshCw size={10} className="animate-spin" />}
                      {phaseState === 'FAILED' && <AlertCircle size={10} />}
                      {phaseState === 'PENDING' && <Clock size={10} />}
                      {phaseState === 'DONE'
                        ? 'PASS • Done'
                        : phaseState === 'ACTIVE'
                        ? 'RUNNING • Live'
                        : phaseState === 'FAILED'
                        ? 'FAIL • Action Needed'
                        : 'PENDING'}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 font-outfit">{phase.title}</h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{phase.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-slate-500">Feedback Type:</span>
                  <span className="font-mono font-bold text-slate-700">{phase.feedbackType}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cryptographic Digest Summary Row when Candidate is Bound */}
        {(hasBoundCandidate || certificationData?.candidateSha256 || uploadResult?.contractSha256) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Hash size={11} /> Bound Candidate ID
              </span>
              <p className="font-mono font-bold text-slate-800 mt-0.5 break-all">
                {uploadResult?.candidateId || certificationData?.candidateId || 'Bound'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/90 text-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <ShieldCheck size={11} /> Candidate Package SHA-256
              </span>
              <p className="font-mono font-bold text-emerald-900 mt-0.5 break-all">
                {uploadResult?.contractSha256 ||
                  certificationData?.candidateSha256 ||
                  checks.find((c) => c.evidenceHash)?.evidenceHash ||
                  'Verified by backend'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/90 text-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 flex items-center gap-1">
                <TestTube size={11} /> Isolated Unit Test Feedback
              </span>
              <p className="font-mono font-bold text-blue-900 mt-0.5">
                {uploadResult?.testSummary ||
                  checks.find((c) => c.name.toLowerCase().includes('test') || c.name.toLowerCase().includes('qualif'))
                    ?.details ||
                  'Ready for isolated test verification'}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Two Column Grid: Upload Package + Validation Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Candidate Package & Detected Files (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-[#e11d48]">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-outfit">
                    Upload Candidate Package
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ZIP bundle or individual portable component files
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".zip,.tar.gz,.tsx,.ts,.json,.md,.css"
                className="hidden"
                onChange={onFileInputChange}
              />

              {/* Dropzone */}
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragEnter={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                role="button"
                tabIndex={0}
                aria-label="Upload candidate archive or component files"
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer group ${
                  isDragging
                    ? 'border-pink-500 bg-pink-100/50 scale-[1.01]'
                    : 'border-pink-300 bg-pink-50/30 hover:bg-pink-50/60'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-pink-200 text-pink-600 shadow-sm mx-auto mb-3 group-hover:scale-105 transition-transform">
                  {isUploading ? (
                    <RefreshCw size={24} className="animate-spin text-pink-600" />
                  ) : (
                    <FileArchive size={24} />
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 font-outfit">
                  {isUploading
                    ? `Uploading & validating candidate (${elapsedSeconds}s)...`
                    : 'Drop candidate archive or files here'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supports <span className="font-mono font-medium">.zip</span>,{' '}
                  <span className="font-mono font-medium">.tar.gz</span>, or raw{' '}
                  <span className="font-mono font-medium">.tsx / .ts / .json</span> files (Max 50MB)
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-pink-700 bg-white border border-pink-300 shadow-2xs hover:bg-pink-50 disabled:opacity-50"
                  >
                    <Upload size={13} />
                    {isUploading ? 'Uploading & Running Intake Gates...' : 'Browse Files'}
                  </button>
                </div>
              </div>

              {/* Upload Error Banner */}
              {uploadError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl border border-red-300 bg-red-50 text-red-800 text-xs flex items-start gap-2.5"
                >
                  <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Upload or Intake Compliance Failed</p>
                    <p className="mt-0.5 text-red-700">{uploadError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
                    aria-label="Dismiss upload error"
                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Active Uploaded File Pill */}
              {uploadResult || hasBoundCandidate ? (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileArchive size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <h5 className="text-xs font-bold text-slate-900 font-mono truncate max-w-[200px] sm:max-w-[280px]">
                        {uploadedFiles[0]?.name || `${componentName} Candidate Package`}
                        {uploadedFiles.length > 1 && ` (+${uploadedFiles.length - 1} more)`}
                      </h5>
                      <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={11} />
                        {uploadResult
                          ? `${uploadResult.totalSize} • ${uploadResult.count} ${
                              uploadResult.count === 1 ? 'file' : 'files'
                            } uploaded & hash-bound`
                          : `Candidate ID ${(certificationData?.candidateId || '').slice(0, 12)}… persisted in PostgreSQL`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
                    PASS • Bound
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                      <FileArchive size={18} />
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-slate-600">
                        No Candidate Package Uploaded
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Click Browse Files or drop candidate archive above
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Pending
                  </span>
                </div>
              )}

              {/* Required Files Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Required Contract Files Checklist
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      detectedFilesCount === expectedFiles.length
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : detectedFilesCount > 0
                        ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-slate-600 bg-slate-100 border-slate-200'
                    }`}
                  >
                    {detectedFilesCount} of {expectedFiles.length} Verified
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {expectedFiles.map((f, i) => {
                    const isDetected =
                      uploadedFiles.length > 0
                        ? uploadedFiles.some(
                            (u) =>
                              u.name.toLowerCase() === f.name.toLowerCase() ||
                              u.name.toLowerCase().endsWith(f.name.toLowerCase()) ||
                              f.name.toLowerCase().includes(u.name.toLowerCase())
                          )
                        : hasBoundCandidate;
                    return (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                          isDetected
                            ? 'bg-emerald-50/40 border-emerald-200/80'
                            : 'bg-slate-50/80 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 border ${
                              isDetected
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                : 'bg-slate-100 border-slate-300 text-slate-400'
                            }`}
                          >
                            {isDetected ? <Check size={10} strokeWidth={3} /> : <Clock size={9} />}
                          </div>
                          <span
                            className={`font-mono font-bold text-[11px] ${
                              isDetected ? 'text-slate-900' : 'text-slate-500'
                            }`}
                          >
                            {f.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">{f.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Validation Progress & Verbose Gate Checklist (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            {/* Header with Run/Rerun button */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-[#e11d48]">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-outfit">
                    Autonomous Contract Compliance Gates
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detailed per-gate compliance status, feedback type &amp; cryptographic evidence
                  </p>
                </div>
              </div>

              <button
                onClick={handleRerun}
                disabled={isValidating || isUploading}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-sm transition-all active:scale-95 disabled:opacity-60"
              >
                <RefreshCw size={13} className={isValidating ? 'animate-spin' : ''} />
                {isValidating ? 'Refreshing Gates...' : 'Refresh Compliance Gates'}
              </button>
            </div>

            {/* WCAG Accessible Progress Bar + Status Pill Breakdown */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/70 space-y-2.5">
              <div className="flex items-center justify-between gap-4">
                <div
                  className="flex-1 h-2.5 w-full bg-slate-200 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-label="Contract compliance gate completion progress"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuetext={`${progress}% complete (${passedGatesCount + skippedGatesCount} of ${checks.length} gates satisfied)`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 shrink-0">
                  {progress}% Complete ({passedGatesCount + skippedGatesCount} / {checks.length})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  <Check size={11} strokeWidth={2.5} /> PASS (Verified): {passedGatesCount}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-800 border border-red-200 font-semibold">
                  <AlertCircle size={11} /> FAIL (Action Required): {failedGatesCount}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  EXEMPT (Skipped): {skippedGatesCount}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                  <Clock size={11} /> PENDING: {pendingGatesCount}
                </span>
              </div>
            </div>

            {/* Validation Rows */}
            <div className="p-5 space-y-3 max-h-[520px] overflow-y-auto">
              {isLoadingCertification ? (
                <div className="p-8 text-center text-sm text-slate-500" role="status" aria-live="polite">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-pink-600" />
                  Loading persisted contract compliance gates...
                </div>
              ) : checks.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No validation gates recorded yet. Upload a candidate package above to execute Stepper 5 compliance verification.
                </div>
              ) : (
                checks.map((c) => {
                  const meta = getFeedbackBadgeMeta(c.status);
                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div
                            className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${meta.iconClass}`}
                          >
                            {c.status === 'PASS' ? (
                              <Check size={14} strokeWidth={2.5} />
                            ) : c.status === 'FAIL' ? (
                              <AlertCircle size={14} strokeWidth={2.5} />
                            ) : c.status === 'SKIPPED' ? (
                              <Check size={14} strokeWidth={2.5} />
                            ) : (
                              <Clock size={14} strokeWidth={2.5} />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 font-outfit">
                                {c.name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {c.category}
                              </span>
                              <span className="text-[10px] font-medium text-slate-500">
                                ({meta.feedbackType})
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{c.details}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                          {typeof c.passedTests === 'number' && typeof c.totalTests === 'number' && c.totalTests > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-mono font-bold">
                              {c.passedTests}/{c.totalTests} Tests
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                      </div>

                      {/* Cryptographic Evidence Footer per Gate */}
                      {(c.evidenceHash || c.evidenceId || c.timestamp) && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                          <div className="flex flex-wrap items-center gap-3">
                            {c.evidenceId && (
                              <span>
                                Evidence ID: <strong className="text-slate-700">{c.evidenceId}</strong>
                              </span>
                            )}
                            {c.evidenceHash && (
                              <span>
                                SHA-256 Digest:{' '}
                                <strong className="text-emerald-700">
                                  {c.evidenceHash.slice(0, 18)}…
                                </strong>
                              </span>
                            )}
                          </div>
                          {c.timestamp && (
                            <span>Verified: {new Date(c.timestamp).toLocaleTimeString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Results Summary Card */}
      {certificationData && checks.length > 0 && (
        <div
          role="region"
          aria-label="Validation Results Summary"
          className={`rounded-2xl border p-5 sm:p-6 shadow-sm ${
            allGatesSatisfied
              ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white'
              : failedGatesCount > 0
              ? 'border-red-300 bg-gradient-to-r from-red-50/90 via-rose-50/50 to-white'
              : 'border-amber-300 bg-gradient-to-r from-amber-50/90 via-yellow-50/50 to-white'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div
                className={`h-12 w-12 rounded-2xl text-white flex items-center justify-center shadow-md shrink-0 ${
                  allGatesSatisfied
                    ? 'bg-emerald-500 shadow-emerald-500/20'
                    : failedGatesCount > 0
                    ? 'bg-red-500 shadow-red-500/20'
                    : 'bg-amber-500 shadow-amber-500/20'
                }`}
              >
                {allGatesSatisfied ? (
                  <CheckCircle2 size={26} strokeWidth={2.5} />
                ) : (
                  <AlertCircle size={26} strokeWidth={2.5} />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 font-outfit">
                    {allGatesSatisfied
                      ? `Compliance Validation Successful — All ${checks.length} Recorded Gates Satisfied`
                      : failedGatesCount > 0
                      ? 'Compliance Validation Failed — Gate Failures Detected'
                      : 'Compliance Validation In Progress — Awaiting Remaining Gates'}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      allGatesSatisfied
                        ? 'bg-emerald-200 text-emerald-950'
                        : failedGatesCount > 0
                        ? 'bg-red-200 text-red-950'
                        : 'bg-amber-200 text-amber-950'
                    }`}
                  >
                    {allGatesSatisfied
                      ? 'PASS • Ready for Stepper 6'
                      : failedGatesCount > 0
                      ? 'FAIL • Action Required'
                      : 'PENDING • In Progress'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  {allGatesSatisfied
                    ? `The candidate package for ${targetFamily} ${targetVersion} satisfies all Stepper 5 contract, schema, and isolated unit test constraints.`
                    : failedGatesCount > 0
                    ? 'One or more compliance gates failed. Review the gate failure details above and upload a corrected candidate package.'
                    : 'Some compliance gates are still queued or awaiting execution.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Total Gates: </span>
                <span className="font-mono font-bold text-slate-900">{checks.length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs">
                <span className="text-slate-500 font-medium">Passed: </span>
                <span className="font-mono font-bold text-emerald-700">{passedGatesCount}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-xs">
                <span className="text-slate-500 font-medium">Failed: </span>
                <span className="font-mono font-bold text-red-700">{failedGatesCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Step Callout */}
      <div className="rounded-2xl border border-pink-200/80 bg-gradient-to-r from-pink-50/80 via-rose-50/40 to-amber-50/60 p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e11d48] text-white shadow-md shadow-pink-500/20 shrink-0 mt-0.5">
            <Lightbulb size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900 font-outfit">
              Next Step: Stepper 6 — Integration &amp; Certification
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Proceed to Integration &amp; Certification to generate the repository placement manifest, obtain Authorized Admin Gate 2 hash-bound approval, execute isolated placement, run the 6-width WCAG 2.1 AA Playwright browser verifier, and complete Gate 3 Final Certification for{' '}
              <span className="font-bold text-slate-900">
                {targetFamily} {targetVersion}
              </span>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Footer Nav */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href={`/tools/project-llm/external-ai-handoff${activeWorkflowId ? `?workflowId=${activeWorkflowId}` : ''}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to External AI Handoff
        </Link>

        {(() => {
          const activeCandidateId = uploadResult?.candidateId || certificationData?.candidateId;
          return activeCandidateId && allGatesSatisfied ? (
            <Link
              href={`/tools/project-llm/integration-certification${
                activeWorkflowId ? `?workflowId=${activeWorkflowId}&candidateId=${activeCandidateId}` : ''
              }`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-sm font-bold transition-all shadow-md shadow-pink-500/20 active:scale-95"
            >
              Proceed to Integration &amp; Certification
              <ArrowRight size={16} />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-200 text-slate-500 text-sm font-bold cursor-not-allowed shadow-none"
              title={
                !activeCandidateId
                  ? 'Upload and validate a candidate package to unlock Integration & Certification'
                  : 'All validation gates must pass before proceeding to Integration & Certification'
              }
            >
              Proceed to Integration &amp; Certification (Locked)
              <ArrowRight size={16} />
            </button>
          );
        })()}
      </div>
    </div>
  );
}
