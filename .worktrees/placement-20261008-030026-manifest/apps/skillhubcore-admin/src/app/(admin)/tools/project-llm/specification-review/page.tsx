'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Code,
  Check,
  XCircle,
  FileCheck,
  Lock,
} from 'lucide-react';

export default function SpecificationReviewPage() {
  const searchParams = useSearchParams();
  const familyId = searchParams?.get('family') || 'I';
  const versionId = searchParams?.get('version') || 'I7';
  const sources = searchParams?.get('sources')?.split(',') || ['I1', 'I2', 'I5'];

  const [approved, setApproved] = useState(false);
  const [activeSection, setActiveSection] = useState<'edu' | 'contract' | 'repo' | 'criteria'>('edu');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 sm:p-8 shadow-xl border-t border-white/60 -translate-y-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e11d48] bg-pink-50 border border-pink-200 px-2 py-0.5 rounded">
                SURFACE 09
              </span>
              <span className="text-xs font-semibold text-slate-400">•</span>
              <span className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                GOVERNANCE: HUMAN APPROVAL REQUIRED
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
              Specification Review: Introduction {versionId}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Synthesized derived specification from intra-family sources{' '}
              <span className="font-mono font-bold text-slate-800">{sources.join(' + ')}</span>. AI planning does not constitute architectural approval.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400">Snapshot:</span>
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
              #SNAP-7F3A9E
            </span>
          </div>
        </div>

        {/* Governance Alert Banner */}
        <div className="mt-6 p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Governance Gate:</strong> Specification is frozen and ready for human inspection. Self-approval is blocked.
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase bg-amber-200/80 px-2 py-0.5 rounded">
            AI PLAN ≠ APPROVAL
          </span>
        </div>
      </div>

      {/* Main Spec Inspection Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar">
          {[
            { id: 'edu', label: '1. Educational Specification' },
            { id: 'contract', label: '2. Engineering Contract' },
            { id: 'repo', label: '3. Repository Requirements' },
            { id: 'criteria', label: '4. Acceptance Criteria & Evidence' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Section Content */}
        {activeSection === 'edu' && (
          <div className="space-y-4 text-xs text-slate-700">
            <h3 className="text-base font-bold text-slate-900 font-outfit">
              Educational Pedagogical Plan for {versionId}
            </h3>
            <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-100">
              <p>
                <strong>Target Learning Intent:</strong> Introduce learner to lesson domain, establish why it matters through an industry case scenario, and provide a clear motivation bridge into technical execution.
              </p>
              <p>
                <strong>Component Assembly:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><code>Topic orientation</code> sourced from <strong>I1</strong></li>
                <li><code>Problem framing & need assessment</code> sourced from <strong>I2</strong></li>
                <li><code>Real-world industry context & learning transition</code> sourced from <strong>I5</strong></li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'contract' && (
          <div className="space-y-4 text-xs text-slate-700">
            <h3 className="text-base font-bold text-slate-900 font-outfit">
              TypeScript / React Engineering Contract
            </h3>
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto shadow-inner">
{`export interface IntroductionI7Props extends UBRCStandardProps {
  version: 'I7';
  topic: string;
  domain: string;
  problemStatement: string;
  needAssessment: string;
  realWorldScenario: {
    companyContext: string;
    productionChallenge: string;
  };
  transitionNote: string;
}
// Enforces UBRC brand independence, passive ILS boundary, LSNB/RSSB consumer safe.`}
            </pre>
          </div>
        )}

        {activeSection === 'repo' && (
          <div className="space-y-4 text-xs text-slate-700">
            <h3 className="text-base font-bold text-slate-900 font-outfit">
              Repository Placement Requirements
            </h3>
            <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-900">Placement Invariant:</p>
              <p>
                Candidate must <strong>EXTEND</strong> existing <code>packages/ui/src/tutorial/blocks/IntroductionBlock.tsx</code>. Do NOT create duplicate IntroductionBlock components.
              </p>
              <p className="font-bold text-slate-900 mt-2">Target Registry:</p>
              <p>
                <code>packages/types/src/tutorial-rich-document/registries/introduction-versions.ts</code>
              </p>
            </div>
          </div>
        )}

        {activeSection === 'criteria' && (
          <div className="space-y-4 text-xs text-slate-700">
            <h3 className="text-base font-bold text-slate-900 font-outfit">
              Acceptance Criteria & Evidence Chain
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'E-102', claim: 'Registry resolves I7', status: 'VERIFIED' },
                { id: 'E-108', claim: 'Renderer compiles without error', status: 'VERIFIED' },
                { id: 'E-113', claim: 'All 3 Browsers Pass DOM test', status: 'READY IN PILOT' },
              ].map((ev) => (
                <div key={ev.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded">
                      {ev.id}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                      {ev.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-800">{ev.claim}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approval Actions */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500">
              {approved ? 'Approved by Human Reviewer' : 'Awaiting HAA Human Sign-Off'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => alert('Changes requested. Returned to brief builder.')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Request Changes
            </button>
            <button
              type="button"
              onClick={() => setApproved(true)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                approved
                  ? 'bg-emerald-600 shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-pink-500 to-orange-500 shadow-pink-500/25 hover:scale-[1.02] active:scale-95'
              }`}
            >
              {approved ? '✓ Specification Approved' : 'Approve Specification (Human Gate)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
