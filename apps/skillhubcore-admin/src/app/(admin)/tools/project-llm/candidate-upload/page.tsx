'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  CheckCircle2,
  FileCheck,
  Check,
  Play,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  FileCode,
  ShieldCheck,
  AlertCircle,
  FileArchive,
  Layers,
  Sparkles,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useProjectLlm } from '../context/ProjectLlmContext';
import { ProjectLlmStepper } from '../components/ProjectLlmStepper';
import { ProjectLlmContextBanner } from '../components/ProjectLlmContextBanner';

interface CheckItem {
  id: string;
  name: string;
  category: string;
  duration: string;
  status: 'passed' | 'pending' | 'running';
  details: string;
}

export default function CandidateUploadPage() {
  const { state } = useProjectLlm();
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(100);

  const checks: CheckItem[] = [
    {
      id: 'c1',
      name: 'File Structure & Placement Integrity',
      category: 'Placement Manifest',
      duration: '42ms',
      status: 'passed',
      details: 'All 8 required files present in candidate package root',
    },
    {
      id: 'c2',
      name: 'ILS Instructional Learning Structure',
      category: 'Pedagogy',
      duration: '85ms',
      status: 'passed',
      details: 'Instructional sequencing adheres to Hook → Motivation → Roadmap',
    },
    {
      id: 'c3',
      name: 'LSNB Learning Structure & Navigation',
      category: 'Schema',
      duration: '63ms',
      status: 'passed',
      details: `Unique UID and step metadata anchor configured for ${state.targetVersion}`,
    },
    {
      id: 'c4',
      name: 'RSSB Rendering Structure & Style',
      category: 'Style & UI',
      duration: '110ms',
      status: 'passed',
      details: 'Strict Tailwind token usage; 0 inline styles; 100% responsive',
    },
    {
      id: 'c5',
      name: 'Tutorial Composer Integration Contract',
      category: 'Authoring',
      duration: '94ms',
      status: 'passed',
      details: 'Block registry decorator verified; inspector controls valid',
    },
    {
      id: 'c6',
      name: 'Runtime Compatibility & Next.js SSR',
      category: 'Runtime',
      duration: '150ms',
      status: 'passed',
      details: 'Zero hydration mismatch; error boundary wrapper active',
    },
    {
      id: 'c7',
      name: 'Brand Independence Neutrality',
      category: 'Neutrality',
      duration: '38ms',
      status: 'passed',
      details: 'Zero hardcoded SUIA logos or vendor strings',
    },
    {
      id: 'c8',
      name: 'Theme Compatibility (Light / Dark)',
      category: 'Tokens',
      duration: '72ms',
      status: 'passed',
      details: 'High contrast WCAG 2.1 AA certified across both themes',
    },
    {
      id: 'c9',
      name: 'Dependency Safety & Isolation Scan',
      category: 'Security',
      duration: '130ms',
      status: 'passed',
      details: '0 external npm dependencies added; 0 vulnerabilities found',
    },
    {
      id: 'c10',
      name: 'Automated Test Suite Execution',
      category: 'Unit Testing',
      duration: '420ms',
      status: 'passed',
      details: '14 of 14 unit tests passed with 100% branch coverage',
    },
    {
      id: 'c11',
      name: 'Evidence Graph Manifest Cryptographic Signature',
      category: 'Audit & Gate',
      duration: '55ms',
      status: 'passed',
      details: 'SHA-256 hash snapshot sealed into project evidence graph',
    },
  ];

  const handleRerun = () => {
    setIsValidating(true);
    setProgress(20);
    setTimeout(() => setProgress(60), 400);
    setTimeout(() => {
      setProgress(100);
      setIsValidating(false);
    }, 900);
  };

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
              <span className="font-bold text-slate-800">{state.familyName} {state.targetVersion}</span>. All 11 autonomous quality gates must pass before proceeding to repository integration.
            </p>
          </div>

          <ProjectLlmStepper currentStep={5} />
        </div>
      </div>

      {/* Context Banner */}
      <ProjectLlmContextBanner />

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
              {/* Dropzone */}
              <div className="border-2 border-dashed border-pink-300 bg-pink-50/30 hover:bg-pink-50/60 rounded-xl p-6 text-center transition-all cursor-pointer group">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-pink-200 text-pink-600 shadow-sm mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <FileArchive size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-900 font-outfit">
                  Drop candidate archive here
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supports <span className="font-mono font-medium">.zip</span>, <span className="font-mono font-medium">.tar.gz</span>, or raw <span className="font-mono font-medium">.tsx</span> files (Max 50MB)
                </p>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-pink-700 bg-white border border-pink-300 shadow-2xs hover:bg-pink-50">
                    Browse Files
                  </span>
                </div>
              </div>

              {/* Active Uploaded File Pill */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileArchive size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 font-mono">
                      {state.familyName.toLowerCase()}_{state.targetVersion.toLowerCase()}_candidate_v1.zip
                    </h5>
                    <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={11} />
                      3.4 MB • Package Verified & Extracted
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Ready
                </span>
              </div>

              {/* Required Files Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Required Files Checklist
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    8 of 8 Detected
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {[
                    { name: `${state.familyName}${state.targetVersion}.tsx`, desc: 'Component', icon: FileCode },
                    { name: 'types.ts', desc: 'Type Definitions', icon: FileCode },
                    { name: 'schema.json', desc: 'JSON Schema', icon: FileCode },
                    { name: 'registry.ts', desc: 'Registry Registration', icon: FileCode },
                    { name: 'renderer.tsx', desc: 'Tutorial Renderer', icon: FileCode },
                    { name: 'composer.tsx', desc: 'Tutorial Composer UI', icon: FileCode },
                    { name: `${state.familyName}${state.targetVersion}.test.tsx`, desc: 'Unit Tests', icon: FileCode },
                    { name: 'README.md', desc: 'Documentation & Notes', icon: FileCode },
                  ].map((f, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check size={10} strokeWidth={3} />
                        </div>
                        <span className="font-mono text-slate-800 font-bold text-[11px]">
                          {f.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">{f.desc}</span>
                    </div>
                  ))}
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
              {checks.map((c, idx) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={13} strokeWidth={2.5} />
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
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock size={11} />
                      {c.duration}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      PASS
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Results Summary Card */}
      <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <CheckCircle2 size={26} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 font-outfit">
                  Validation Successful — All 11 Quality Gates Passed
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                  Ready for Placement
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                The candidate package for <span className="font-bold text-slate-800">{state.familyName} {state.targetVersion}</span> satisfies all structural, pedagogical, and runtime constraints. Zero errors or warnings detected.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs">
              <span className="text-slate-400 font-medium">Duration: </span>
              <span className="font-mono font-bold text-slate-800">1.25s</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs">
              <span className="text-slate-400 font-medium">Errors: </span>
              <span className="font-mono font-bold text-emerald-600">0</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs">
              <span className="text-slate-400 font-medium">Coverage: </span>
              <span className="font-mono font-bold text-emerald-600">100%</span>
            </div>
          </div>
        </div>

        {/* Placement Preview Pills */}
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
      </div>

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
              <span className="font-bold text-slate-900">{state.familyName} {state.targetVersion}</span> for immediate use in the Tutorial Composer.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Nav */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href="/tools/project-llm/external-ai-handoff"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to External AI Handoff
        </Link>

        <Link
          href="/tools/project-llm/integration-certification"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-sm font-bold transition-all shadow-md shadow-pink-500/20 active:scale-95"
        >
          Proceed to Integration & Certification
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
