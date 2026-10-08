'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Bot,
  ShieldCheck,
  GitCommit,
  GitBranch,
  Terminal,
  Search,
  Filter,
  CheckCircle2,
  FileCode,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Layers,
  ChevronDown,
  ChevronRight,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { useProjectLlm } from '../context/ProjectLlmContext';
import { ProjectLlmContextBanner } from '../components/ProjectLlmContextBanner';

type DetailTab = 'timeline' | 'agents' | 'evidence' | 'snapshot' | 'diff' | 'logs';

export default function WorkflowDetailsPage() {
  const { state } = useProjectLlm();
  const [activeTab, setActiveTab] = useState<DetailTab>('timeline');
  const [logFilter, setLogFilter] = useState<'all' | 'gate' | 'audit' | 'info'>('all');
  const [searchLog, setSearchLog] = useState('');

  const timelineEvents = [
    {
      time: '09:15:02',
      stage: 'Block Family Selection',
      desc: `Selected block family '${state.familyName}' (${state.familyId})`,
      agent: 'Human Designer',
      status: 'completed',
    },
    {
      time: '09:16:30',
      stage: 'Target Version Specification',
      desc: `Target version set to '${state.targetVersion}', purpose definition authored`,
      agent: 'Human Designer',
      status: 'completed',
    },
    {
      time: '09:18:14',
      stage: 'Compliance Brief Compilation',
      desc: 'Compiled 9 engineering contracts across ILS, LSNB, RSSB & Composer',
      agent: 'Specification Agent',
      status: 'completed',
    },
    {
      time: '09:20:00',
      stage: 'External AI Implementation Handoff',
      desc: 'Exported prompt bundle & schema contracts to external generation model',
      agent: 'External Model (Claude 3.7 / Gemini)',
      status: 'completed',
    },
    {
      time: '09:23:45',
      stage: 'Candidate Package Ingestion',
      desc: '8 of 8 required files received, extracted into isolated sandbox',
      agent: 'Ingestion Service',
      status: 'completed',
    },
    {
      time: '09:25:10',
      stage: 'Quality Gate Verification',
      desc: '11 of 11 autonomous quality gates verified; zero regressions found',
      agent: 'Verification Agent',
      status: 'completed',
    },
    {
      time: '09:28:12',
      stage: 'Repository Integration & Live Certification',
      desc: `Integrated ${state.targetVersion} into apps/skillhubcore; runtime container 200 OK`,
      agent: 'Integration & Gatekeeper Agent',
      status: 'completed',
    },
  ];

  const agents = [
    {
      name: 'Discovery Agent',
      role: 'Family Inspection & Existing Version Analysis',
      model: 'Internal Repo AST Parser',
      duration: '45ms',
      status: 'active',
      deliverable: `Parsed existing versions: ${state.existingVersions.join(', ')}`,
    },
    {
      name: 'Specification Agent',
      role: 'Compliance Contract & Brief Synthesizer',
      model: 'Claude 3.5 Sonnet / Gemini Pro',
      duration: '1.2s',
      status: 'active',
      deliverable: '9 compliance cards + structured markdown brief',
    },
    {
      name: 'Verification Agent',
      role: 'Quality Gate Enforcement & AST Validation',
      model: 'Rule Engine + TypeScript Compiler API',
      duration: '850ms',
      status: 'active',
      deliverable: '11 quality gate proofs + Vitest execution report',
    },
    {
      name: 'Integration Agent',
      role: 'Placement Manifest & File Tree Mutator',
      model: 'Safe FS Sandbox Worker',
      duration: '210ms',
      status: 'active',
      deliverable: '4 ADD, 2 UPDATE, 1 EXTEND file placement operations',
    },
    {
      name: 'Certification Gatekeeper',
      role: 'Evidence Graph Cryptographic Sealer',
      model: 'Project LLM Core Protocol',
      duration: '60ms',
      status: 'active',
      deliverable: `Certificate CERT-LLM-${state.targetVersion}-20261007`,
    },
  ];

  const evidenceNodes = [
    { id: 'ev_01', type: 'ILS Schema Proof', hash: 'sha256:e3b0c44298fc', gate: 'Gate 2', status: 'VALID' },
    { id: 'ev_02', type: 'LSNB Navigation Anchor', hash: 'sha256:8b1a9953c461', gate: 'Gate 3', status: 'VALID' },
    { id: 'ev_03', type: 'RSSB Responsive CSS Check', hash: 'sha256:cb8379ac2015', gate: 'Gate 4', status: 'VALID' },
    { id: 'ev_04', type: 'Composer Registry Proof', hash: 'sha256:4d709b1f0928', gate: 'Gate 5', status: 'VALID' },
    { id: 'ev_05', type: 'Runtime SSR Snapshot', hash: 'sha256:7a38b1f200c8', gate: 'Gate 6', status: 'VALID' },
    { id: 'ev_06', type: 'Playwright Visual Baseline', hash: 'sha256:5f4dcc3b5aa7', gate: 'Gate 10', status: 'VALID' },
  ];

  const logs = [
    { time: '09:15:02.104', level: 'INFO', msg: `Initializing workflow for family '${state.familyName}'` },
    { time: '09:15:02.140', level: 'AUDIT', msg: `Existing versions loaded: [${state.existingVersions.join(', ')}]` },
    { time: '09:16:30.400', level: 'INFO', msg: `Target version set to '${state.targetVersion}'` },
    { time: '09:18:14.220', level: 'GATE', msg: 'Compliance contract compilation: 9 rules verified' },
    { time: '09:23:45.890', level: 'INFO', msg: 'Candidate archive uploaded: 8 files detected' },
    { time: '09:25:10.012', level: 'GATE', msg: 'Running 11 autonomous quality gates...' },
    { time: '09:25:11.260', level: 'GATE', msg: 'Gate 1-11 PASS: 0 errors, 0 warnings, 100% test coverage' },
    { time: '09:28:12.440', level: 'AUDIT', msg: `Writing placement manifest for '${state.targetVersion}'` },
    { time: '09:28:13.110', level: 'INFO', msg: 'Live runtime container responded with HTTP 200 (24ms TTFB)' },
    { time: '09:28:13.500', level: 'AUDIT', msg: `Cryptographic certificate sealed: CERT-LLM-${state.targetVersion}` },
  ];

  const filteredLogs = logs.filter((l) => {
    if (logFilter !== 'all' && l.level.toLowerCase() !== logFilter.toLowerCase()) return false;
    if (searchLog && !l.msg.toLowerCase().includes(searchLog.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-5 sm:p-6 shadow-sm border-t border-white/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                <ShieldCheck size={12} />
                Audit & Governance
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">Autonomous Engineering Protocol</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
              Workflow & Evidence Details
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium">
              Immutable audit trail, evidence graph, internal agent executions, and repository change logs for{' '}
              <span className="font-bold text-slate-800">{state.familyName} {state.targetVersion}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/tools/project-llm/integration-certification"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm"
            >
              <ArrowLeft size={14} />
              Back to Certification
            </Link>

            <Link
              href="/tools/block-composer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl shadow-sm shadow-pink-500/20 hover:from-pink-700 hover:to-rose-700"
            >
              Open Composer
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Context Banner */}
      <ProjectLlmContextBanner />

      {/* Main Inspection Tabs */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-4 border-b border-slate-200/80 bg-slate-50/70 overflow-x-auto no-scrollbar">
          {[
            { id: 'timeline', label: 'Timeline & Milestones', icon: Clock },
            { id: 'agents', label: 'Internal Agents', icon: Bot },
            { id: 'evidence', label: 'Evidence Graph', icon: ShieldCheck },
            { id: 'snapshot', label: 'Snapshot Diff', icon: GitCommit },
            { id: 'diff', label: 'Repository Changes', icon: FileCode },
            { id: 'logs', label: 'Execution Logs', icon: Terminal },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as DetailTab)}
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

        {/* Content Area */}
        <div className="p-5 sm:p-6 bg-slate-50/20">
          {/* TAB 1: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-slate-900 font-outfit">
                End-to-End Workflow Milestones
              </h3>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-pink-200">
                {timelineEvents.map((ev, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute -left-[29px] top-1 h-4 w-4 rounded-full bg-pink-600 border-2 border-white shadow-sm" />
                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-900 font-outfit">
                          {ev.stage}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {ev.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{ev.desc}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-mono text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                          Actor: {ev.agent}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Completed
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: AGENTS */}
          {activeTab === 'agents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900 font-outfit">
                  Autonomous Internal Agent Fleet
                </h3>
                <span className="text-xs font-mono text-slate-500">5 Agents Orchestrated</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map((ag, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-pink-100 text-[#e11d48] flex items-center justify-center font-bold text-xs">
                          <Bot size={15} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 font-outfit">{ag.name}</h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {ag.duration}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{ag.role}</p>
                    <div className="pt-2 border-t border-slate-100 text-[11px] font-mono">
                      <span className="text-slate-400">Model: </span>
                      <span className="text-slate-700 font-bold">{ag.model}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-100 text-[11px] font-mono text-slate-700">
                      Deliverable: {ag.deliverable}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EVIDENCE GRAPH */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900 font-outfit">
                  Immutable Cryptographic Evidence Graph
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  All 6 Nodes Validated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {evidenceNodes.map((node) => (
                  <div key={node.id} className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">{node.id}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                        {node.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 font-outfit">{node.type}</h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">{node.hash}</p>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Verified via {node.gate}</span>
                      <CheckCircle2 size={12} className="text-emerald-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SNAPSHOT DIFF */}
          {activeTab === 'snapshot' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-outfit">
                Repository Tree Snapshot Comparison
              </h3>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto">
                <div className="text-slate-400">// Repository Tree Snapshot delta</div>
                <div className="text-slate-400">Base SHA: 8f4a21e4901b  --&gt;  Certified SHA: c9b1037fe82a</div>
                <div className="mt-2 text-emerald-400">+ apps/skillhubcore/src/components/blocks/introduction/IntroductionI7.tsx</div>
                <div className="text-emerald-400">+ apps/skillhubcore/src/components/blocks/introduction/types/i7.ts</div>
                <div className="text-emerald-400">+ apps/skillhubcore/src/components/blocks/introduction/__tests__/IntroductionI7.test.tsx</div>
                <div className="text-emerald-400">+ apps/skillhubcore/src/schemas/blocks/introduction-i7.schema.json</div>
                <div className="text-blue-400">~ apps/skillhubcore/src/components/blocks/introduction/index.ts (1 line added)</div>
                <div className="text-blue-400">~ apps/skillhubcore/src/registry/blockRegistry.ts (3 lines added)</div>
                <div className="text-purple-400">~ packages/shared/types/tutorialDocument.ts (1 union member added)</div>
              </div>
            </div>
          )}

          {/* TAB 5: REPOSITORY CHANGES */}
          {activeTab === 'diff' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-outfit">
                Detailed Code Change Diff
              </h3>
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-950 font-mono text-xs">
                <div className="p-3 bg-slate-900 border-b border-slate-800 text-slate-300 text-[11px] flex items-center justify-between">
                  <span>diff --git a/apps/skillhubcore/src/registry/blockRegistry.ts b/apps/skillhubcore/src/registry/blockRegistry.ts</span>
                  <span className="text-emerald-400">+3 lines</span>
                </div>
                <div className="p-4 space-y-1 text-slate-300">
                  <div className="text-slate-500">@@ -14,6 +14,9 @@ export const blockRegistry = [</div>
                  <div className="text-slate-400">   &#123; id: &apos;I5&apos;, name: &apos;Introduction I5&apos;, component: IntroductionI5 &#125;,</div>
                  <div className="text-slate-400">   &#123; id: &apos;I6&apos;, name: &apos;Introduction I6&apos;, component: IntroductionI6 &#125;,</div>
                  <div className="text-emerald-400 bg-emerald-950/40">+  &#123; id: &apos;I7&apos;, name: &apos;Introduction I7 - Enhanced Motivation&apos;, component: IntroductionI7 &#125;,</div>
                  <div className="text-slate-400">   &#123; id: &apos;O1&apos;, name: &apos;Objective O1&apos;, component: ObjectiveO1 &#125;,</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: EXECUTION LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search execution logs..."
                      value={searchLog}
                      onChange={(e) => setSearchLog(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-pink-500 w-56"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    {(['all', 'gate', 'audit', 'info'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setLogFilter(lvl)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${
                          logFilter === lvl
                            ? 'bg-pink-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-950 font-mono text-xs max-h-96 overflow-y-auto space-y-1.5">
                {filteredLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-slate-500 shrink-0 select-none">{log.time}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                        log.level === 'GATE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : log.level === 'AUDIT'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="text-slate-300">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
