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
} from 'lucide-react';
import { useProjectLlm } from '../context/ProjectLlmContext';
import { ProjectLlmStepper } from '../components/ProjectLlmStepper';
import { ProjectLlmContextBanner } from '../components/ProjectLlmContextBanner';
import { projectLlmClient, ProjectLlmError, ProjectLlmErrorCode } from '@/lib/project-llm/api/projectLlmClient';
import type { CertificationStatus, CertificationGateResult } from '@/lib/project-llm/types/canonicalWorkflowState';

interface CheckItem {
  id: string;
  name: string;
  category: string;
  duration: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED' | 'PENDING';
  details: string;
}

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
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [certificationData, setCertificationData] = useState<CertificationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingCertification, setIsLoadingCertification] = useState(false);

  // Fetch certification status from backend on mount or when active workflow changes
  useEffect(() => {
    if (!activeWorkflowId) return;

    const fetchCertification = async () => {
      setIsLoadingCertification(true);
      setError(null);
      try {
        const data = await projectLlmClient.getCertificationStatus(activeWorkflowId);
        setCertificationData(data);
        // Calculate progress based on gates
        const totalGates = data.gates.length;
        const passedGates = data.gates.filter(g => g.result === 'PASS').length;
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
  const checks: CheckItem[] = certificationData?.gates.map((gate, idx) => ({
    id: `c${idx + 1}`,
    name: gate.gate,
    category: 'Validation Gate',
    duration: '—',
    status: gate.result,
    details: gate.detail || (gate.result === 'PASS' ? 'Verified by backend' : gate.result === 'PENDING' ? 'Not yet verified' : 'Failed verification'),
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
      });

      // Automatically refresh certification / validation gates for this workflow
      try {
        const certData = await projectLlmClient.getCertificationStatus(activeWorkflowId);
        setCertificationData(certData);
        const totalGates = certData.gates.length;
        const passedGates = certData.gates.filter(g => g.result === 'PASS').length;
        setProgress(totalGates > 0 ? Math.round((passedGates / totalGates) * 100) : 0);
      } catch {
        // Certification might not be immediately available
      }
    } catch (err: any) {
      if (err instanceof ProjectLlmError) {
        setUploadError(err.message);
      } else {
        setUploadError(err?.message || 'Failed to upload candidate files');
      }
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
      const passedGates = data.gates.filter(g => g.result === 'PASS').length;
      setProgress(totalGates > 0 ? Math.round((passedGates / totalGates) * 100) : 0);
    } catch (err) {
      if (err instanceof ProjectLlmError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const targetFamily = certificationData?.targetFamily || state.familyName || 'Introduction';
  const targetVersion = certificationData?.targetVersion || state.targetVersion || 'I1';

  const expectedFiles = [
    { name: `${targetFamily}${targetVersion}Block.tsx`, desc: 'Component', icon: FileCode },
    { name: 'types.ts', desc: 'Type Definitions', icon: FileCode },
    { name: 'schema.json', desc: 'JSON Schema', icon: FileCode },
    { name: 'registry.ts', desc: 'Registry Registration', icon: FileCode },
    { name: 'renderer.tsx', desc: 'Tutorial Renderer', icon: FileCode },
    { name: 'composer.tsx', desc: 'Tutorial Composer UI', icon: FileCode },
    { name: `${targetFamily}${targetVersion}.test.tsx`, desc: 'Unit Tests', icon: FileCode },
    { name: 'README.md', desc: 'Documentation & Notes', icon: FileCode },
  ];

  const detectedFilesCount = expectedFiles.filter(f =>
    uploadedFiles.some(u =>
      u.name.toLowerCase() === f.name.toLowerCase() ||
      u.name.toLowerCase().endsWith(f.name.toLowerCase()) ||
      f.name.toLowerCase().includes(u.name.toLowerCase())
    )
  ).length;

  return (
    <div className="space-y-6 pb-16">
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
              Candidate Upload & Quality Validation
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium">
              Inspect candidate package for{' '}
              <span className="font-bold text-slate-800">{targetFamily} {targetVersion}</span>. Validation results are unavailable until the backend runs the repository-defined gates. This screen must not infer passing results from local UI state.
            </p>
          </div>

          <ProjectLlmStepper currentStep={5} />
        </div>
      </div>

      {/* Context Banner */}
      <ProjectLlmContextBanner />

      {/* No Workflow ID Warning */}
      {!activeWorkflowId && (
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
            <h4 className="text-sm font-bold text-slate-900 font-outfit">Error Loading Validation Data</h4>
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
                  <p className="text-[11px] text-slate-400">
                    ZIP bundle or individual component files
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
                  {isUploading ? 'Uploading candidate package...' : 'Drop candidate archive or files here'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supports <span className="font-mono font-medium">.zip</span>, <span className="font-mono font-medium">.tar.gz</span>, or raw <span className="font-mono font-medium">.tsx / .ts</span> files (Max 50MB)
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
                    {isUploading ? 'Uploading...' : 'Browse Files'}
                  </button>
                </div>
              </div>

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-3.5 rounded-xl border border-red-300 bg-red-50 text-red-800 text-xs flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Upload Failed</p>
                    <p className="mt-0.5 text-red-700">{uploadError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Active Uploaded File Pill */}
              {uploadResult ? (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileArchive size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <h5 className="text-xs font-bold text-slate-900 font-mono truncate max-w-[200px] sm:max-w-[280px]">
                        {uploadedFiles[0]?.name}
                        {uploadedFiles.length > 1 && ` (+${uploadedFiles.length - 1} more)`}
                      </h5>
                      <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={11} />
                        {uploadResult.totalSize} • {uploadResult.count} {uploadResult.count === 1 ? 'file' : 'files'} uploaded & bound
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
                    Uploaded
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
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Click Browse Files or drop candidate archive above
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Pending
                  </span>
                </div>
              )}

              {/* Required Files Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Required Files Checklist
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    detectedFilesCount === expectedFiles.length
                      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                      : detectedFilesCount > 0
                      ? 'text-amber-600 bg-amber-50 border-amber-200'
                      : 'text-slate-500 bg-slate-100 border-slate-200'
                  }`}>
                    {detectedFilesCount} of {expectedFiles.length} Detected
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {expectedFiles.map((f, i) => {
                    const isDetected = uploadedFiles.some(
                      u =>
                        u.name.toLowerCase() === f.name.toLowerCase() ||
                        u.name.toLowerCase().endsWith(f.name.toLowerCase()) ||
                        f.name.toLowerCase().includes(u.name.toLowerCase())
                    );
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
                          <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 border ${
                            isDetected
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-600'
                              : 'bg-slate-100 border-slate-300 text-slate-400'
                          }`}>
                            {isDetected ? (
                              <Check size={10} strokeWidth={3} />
                            ) : (
                              <Clock size={9} />
                            )}
                          </div>
                          <span className={`font-mono font-bold text-[11px] ${
                            isDetected ? 'text-slate-900' : 'text-slate-500'
                          }`}>
                            {f.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">{f.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Validation Progress & Gate Checklist (7 cols) */}
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
                    Autonomous Validation Gates
                  </h3>
                  <p className="text-xs text-slate-500">
                    11 strict gates • Zero-tolerance repository safety protocol
                  </p>
                </div>
              </div>

              <button
                onClick={handleRerun}
                disabled={isValidating}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-sm transition-all active:scale-95 disabled:opacity-60"
              >
                <RefreshCw size={13} className={isValidating ? 'animate-spin' : ''} />
                {isValidating ? 'Validating...' : 'Re-run Validation'}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/70 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 shrink-0">
                {progress}% Complete (11 / 11)
              </span>
            </div>

            {/* Validation Rows */}
            <div className="p-5 space-y-2.5 max-h-[460px] overflow-y-auto">
              {isLoadingCertification ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-pink-600" />
                  Loading validation gates...
                </div>
              ) : checks.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No validation gates available. Upload candidate files and run validation.
                </div>
              ) : (
                checks.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-6 w-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                        c.status === 'PASS' ? 'bg-emerald-50 border-emerald-300 text-emerald-600' :
                        c.status === 'FAIL' ? 'bg-red-50 border-red-300 text-red-600' :
                        c.status === 'SKIPPED' ? 'bg-slate-50 border-slate-300 text-slate-400' :
                        'bg-amber-50 border-amber-300 text-amber-600'
                      }`}>
                        {c.status === 'PASS' ? <Check size={13} strokeWidth={2.5} /> :
                         c.status === 'FAIL' ? <AlertCircle size={13} strokeWidth={2.5} /> :
                         c.status === 'SKIPPED' ? <Check size={13} strokeWidth={2.5} /> :
                         <Clock size={13} strokeWidth={2.5} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 font-outfit">
                            {c.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                            {c.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{c.details}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                      {c.duration !== '—' && (
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock size={11} />
                          {c.duration}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        c.status === 'PASS' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        c.status === 'FAIL' ? 'bg-red-100 text-red-800 border-red-200' :
                        c.status === 'SKIPPED' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Results Summary Card */}
      {certificationData && checks.length > 0 && (
        <div className={`rounded-2xl border p-5 sm:p-6 shadow-sm ${
          checks.every(c => c.status === 'PASS' || c.status === 'SKIPPED')
            ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white'
            : checks.some(c => c.status === 'FAIL')
            ? 'border-red-300 bg-gradient-to-r from-red-50/90 via-rose-50/50 to-white'
            : 'border-amber-300 bg-gradient-to-r from-amber-50/90 via-yellow-50/50 to-white'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-2xl text-white flex items-center justify-center shadow-md shrink-0 ${
                checks.every(c => c.status === 'PASS' || c.status === 'SKIPPED')
                  ? 'bg-emerald-500 shadow-emerald-500/20'
                  : checks.some(c => c.status === 'FAIL')
                  ? 'bg-red-500 shadow-red-500/20'
                  : 'bg-amber-500 shadow-amber-500/20'
              }`}>
                {checks.every(c => c.status === 'PASS' || c.status === 'SKIPPED') ? (
                  <CheckCircle2 size={26} strokeWidth={2.5} />
                ) : (
                  <AlertCircle size={26} strokeWidth={2.5} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 font-outfit">
                    {checks.every(c => c.status === 'PASS' || c.status === 'SKIPPED')
                      ? `Validation Successful — All ${checks.length} Quality Gates Passed`
                      : checks.some(c => c.status === 'FAIL')
                      ? 'Validation Failed — Gate Failures Detected'
                      : 'Validation Pending — Gates Not Yet Complete'}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    checks.every(c => c.status === 'PASS' || c.status === 'SKIPPED')
                      ? 'bg-emerald-200 text-emerald-900'
                      : checks.some(c => c.status === 'FAIL')
                      ? 'bg-red-200 text-red-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}>
                    {checks.every(c => c.status === 'PASS' || c.status === 'SKIPPED')
                      ? 'Ready for Placement'
                      : checks.some(c => c.status === 'FAIL')
                      ? 'Cannot Proceed'
                      : 'In Progress'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  {checks.every(c => c.status === 'PASS' || c.status === 'SKIPPED')
                    ? `The candidate package for ${state.familyName} ${state.targetVersion} satisfies all structural, pedagogical, and runtime constraints. Zero errors or warnings detected.`
                    : checks.some(c => c.status === 'FAIL')
                    ? `The candidate package has failed one or more quality gates. Review the failures above and correct the issues before proceeding.`
                    : `The validation is still in progress. Some gates have not yet completed verification.`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs">
                <span className="text-slate-400 font-medium">Total: </span>
                <span className="font-mono font-bold text-slate-800">{checks.length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs">
                <span className="text-slate-400 font-medium">Passed: </span>
                <span className="font-mono font-bold text-emerald-600">{checks.filter(c => c.status === 'PASS').length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-xs">
                <span className="text-slate-400 font-medium">Failed: </span>
                <span className="font-mono font-bold text-red-600">{checks.filter(c => c.status === 'FAIL').length}</span>
              </div>
            </div>
          </div>

          {/* Placement Preview Pills - only show if all passed */}
          {checks.every(c => c.status === 'PASS' || c.status === 'SKIPPED') && (
            <div className="mt-4 pt-4 border-t border-emerald-200/60 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">
                Placement Manifest Preview:
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                ADD (4 files)
              </span>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-lg border border-blue-200">
                UPDATE (2 files)
              </span>
              <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-lg border border-purple-200">
                EXTEND (1 file)
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                REUSE (8 shared components)
              </span>
            </div>
          )}
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
              Next Step: Integration & Certification
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Validation is complete! Proceed to Integration & Certification to review the exact repository placement manifest, execute runtime verification in live containers, and certify{' '}
              <span className="font-bold text-slate-900">{targetFamily} {targetVersion}</span> for immediate use in the Tutorial Composer.
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
          const allGatesPassed = checks.length > 0 && checks.every(c => c.status === 'PASS' || c.status === 'SKIPPED');
          return activeCandidateId && allGatesPassed ? (
            <Link
              href={`/tools/project-llm/integration-certification${activeWorkflowId ? `?workflowId=${activeWorkflowId}&candidateId=${activeCandidateId}` : ''}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-sm font-bold transition-all shadow-md shadow-pink-500/20 active:scale-95"
            >
              Proceed to Integration & Certification
              <ArrowRight size={16} />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-200 text-slate-400 text-sm font-bold cursor-not-allowed shadow-none"
              title={
                !activeCandidateId
                  ? 'Upload and validate a candidate package to unlock Integration & Certification'
                  : 'All validation gates must pass before proceeding to Integration & Certification'
              }
            >
              Proceed to Integration & Certification (Locked)
              <ArrowRight size={16} />
            </button>
          );
        })()}
      </div>
    </div>
  );
}
