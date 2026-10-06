'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FileCheck,
  FileInput,
  FileText,
  GitBranch,
  Layers,
  ListChecks,
  Play,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Workflow,
  AlertTriangle,
  Flame,
  Check,
  XCircle,
} from 'lucide-react';
import { PROJECT_LLM_REPOSITORY_INTELLIGENCE } from '@/lib/project-llm';
import { CreationBriefPanel } from './components/CreationBriefPanel';

interface ControlPlaneStat {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  valueColor: string;
  badge: string;
  badgeColor: string;
}

interface RecentWorkItem {
  id: string;
  title: string;
  type: string;
  status: string;
  statusType: 'success' | 'warning' | 'danger' | 'info';
  family: string;
  version: string;
  hash: string;
  details: string;
  actionText: string;
  actionHref?: string;
  checks: string[];
}

export default function ProjectLlmControlPlaneDashboard() {
  const { corpus, runtime } = PROJECT_LLM_REPOSITORY_INTELLIGENCE;
  const [activeTab, setActiveTab] = useState<'overview' | 'pipelines' | 'brief-builder'>('overview');
  const [pipelineFilter, setPipelineFilter] = useState<'all' | 'approval' | 'active'>('all');

  // Control Plane KPIs
  const controlPlaneStats: ControlPlaneStat[] = [
    {
      label: 'Active Workflows',
      value: 4,
      subtext: '1 running • 3 queued in DAG',
      icon: GitBranch,
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200/60',
      valueColor: 'text-indigo-600',
      badge: 'IN FLIGHT',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      label: 'Awaiting Approval',
      value: 2,
      subtext: 'Human gate blocked • Self-approval blocked',
      icon: ShieldAlert,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
      valueColor: 'text-amber-600',
      badge: 'HUMAN GATE',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      label: 'Certification Blocked',
      value: 1,
      subtext: 'Missing evidence ID • Gate 12 blocked',
      icon: AlertTriangle,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-200/60',
      valueColor: 'text-rose-600',
      badge: 'BLOCKED',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      label: 'Evidence Frozen',
      value: 7,
      subtext: 'Deterministic SHA-256 ledgers',
      icon: FileCheck,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
      valueColor: 'text-emerald-600',
      badge: 'IMMUTABLE',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  // Corpus & Runtime Stats
  const corpusStats: ControlPlaneStat[] = [
    {
      label: 'Corpus Families',
      value: corpus.status.families,
      subtext: 'Canonical educational families',
      icon: Layers,
      iconBg: 'bg-indigo-50 text-indigo-600',
      valueColor: 'text-indigo-600',
      badge: 'REGISTRY',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      label: 'Documented Versions',
      value: corpus.status.documentedVersions,
      subtext: 'Intra-family versions registered',
      icon: FileText,
      iconBg: 'bg-purple-50 text-purple-600',
      valueColor: 'text-purple-600',
      badge: 'TAXONOMY',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      label: 'Verified Runtime',
      value: runtime.status.verifiedImplementations,
      subtext: 'I1, C1, D1 verified in runtime',
      icon: BadgeCheck,
      iconBg: 'bg-emerald-50 text-emerald-600',
      valueColor: 'text-emerald-600',
      badge: 'ACTIVE LIVE',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: 'Planned Families',
      value: runtime.status.plannedFamilies,
      subtext: 'Pending Phase 2 & 3 implementation',
      icon: Clock,
      iconBg: 'bg-orange-50 text-orange-600',
      valueColor: 'text-orange-600',
      badge: 'ROADMAP',
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    },
  ];

  // Recent Work Pipeline Items
  const recentWorkItems: RecentWorkItem[] = [
    {
      id: 'WF-00142',
      title: 'Introduction I2 → Candidate Intake',
      type: 'CANDIDATE INTAKE',
      status: 'Candidate Reviewing',
      statusType: 'warning',
      family: 'Introduction (I)',
      version: 'I2 (Problem → Need → Topic)',
      hash: 'SHA: 7f3a9e21...89c',
      details: 'React/TS candidate artifacts uploaded. Zero duplicate canonical artifacts detected. Extends IntroductionBlock.',
      actionText: 'Review Candidate',
      checks: ['UBRC Safe', 'ILS Passive', 'LSNB/RSSB Proof', 'No Duplicate Artifact'],
    },
    {
      id: 'WF-00143',
      title: 'Definition D3 → Specification Generation',
      type: 'NEW VERSION SPEC',
      status: 'Awaiting Human Approval',
      statusType: 'info',
      family: 'Definition (D)',
      version: 'D3 (Technical Sandbox Definition)',
      hash: 'SNAP: snap-93794f',
      details: 'Deterministic specification package generated. Contracts attached. Awaiting human HAA Gate-1 approval.',
      actionText: 'Inspect Spec',
      checks: ['Contract Valid', 'Brand Independent', 'Evidence E-102 Attached'],
    },
    {
      id: 'WF-00144',
      title: 'Introduction I7 → Intra-Family Mix & Match',
      type: 'INTRA-FAMILY DERIVATION',
      status: 'Spec Ready',
      statusType: 'info',
      family: 'Introduction (I)',
      version: 'I7 (Derived from I1 + I2 + I5)',
      hash: 'SPEC: spec-i7-mix',
      details: 'Selected Topic Orientation (I1) + Problem Framing (I2) + Real-world Context (I5). 100% same family.',
      actionText: 'View Derivation',
      checks: ['Same Family Only', 'Semantic Compatibility', 'Renderer Safe'],
    },
    {
      id: 'WF-00145',
      title: 'Runtime Verification → Playwright Evidence',
      type: 'RUNTIME & BROWSER',
      status: 'All 3 Browsers PASS',
      statusType: 'success',
      family: 'Introduction (I)',
      version: 'I1 Reference Baseline',
      hash: 'COMMIT: 93794f63',
      details: 'Chromium, Firefox, and WebKit pass without console errors or layout shift. DOM verified in SkillHubCore.',
      actionText: 'Inspect Ledger',
      checks: ['Chromium PASS', 'Firefox PASS', 'WebKit PASS', 'Evidence E-113'],
    },
  ];

  // 23 GUI Surfaces Navigation Architecture Map
  const guiSurfaces = [
    {
      section: 'Block Library',
      description: 'Canonical registry, version hierarchy, and relationship matrix',
      badge: 'SURFACES 02-04',
      items: [
        { title: 'Block Family Registry', href: '#registry', desc: 'Canonical registry of all families & production statuses' },
        { title: 'Family → Version Explorer', href: '#explorer', desc: 'Explore I1-I6 versions, engineering contracts, and patterns' },
        { title: 'Composition & Relationship Matrix', href: '#matrix', desc: 'Predecessor, successor, and alternative relationship rules' },
      ],
    },
    {
      section: 'Create & Derive',
      description: 'Operation gateway, intra-family derivation, and qualifications',
      badge: 'SURFACES 05-09',
      items: [
        { title: 'Operation Selection', href: '#create', desc: 'Select Family first: New Version, Qualify, or Mix & Match' },
        { title: 'New Version Specification', href: '#spec-builder', desc: 'Creation brief builder with contracts and acceptance criteria' },
        { title: 'Mix & Match Builder', href: '#mix-match', desc: 'Intra-family only: derive I7 from I1+I2+I5 components' },
        { title: 'Qualify Existing Version', href: '#qualify', desc: 'Determine if enhancement qualifies I2 or requires new version' },
        { title: 'Specification Review & Approval', href: '#spec-review', desc: 'Human gate: AI plan ≠ human approval' },
      ],
    },
    {
      section: 'Candidate Lifecycle',
      description: 'External AI handoff, intake, canonical check, and placement',
      badge: 'SURFACES 10-14',
      items: [
        { title: 'External AI Handoff Package', href: '#handoff', desc: 'Export specification, contracts, and repository facts for AI' },
        { title: 'Candidate Intake & Classification', href: '#candidate-intake', desc: 'Upload zip/files, calculate SHA-256, classify ADD/EXTEND' },
        { title: 'Canonical Comparison Engine', href: '#comparison', desc: 'Compare candidate against canonical IntroductionBlock' },
        { title: 'Placement Manifest', href: '#placement', desc: 'Strict manifest: prevent duplicate component artifacts' },
        { title: 'Integration Snapshot', href: '#integration', desc: 'Post-placement discovery and immutable evidence freeze' },
      ],
    },
    {
      section: 'Governance & Runs',
      description: 'Human approval authority, self-approval blocking, and DAG runs',
      badge: 'SURFACES 15-17',
      items: [
        { title: 'Approval Console', href: '#approvals', desc: 'Self-approval blocked, manifest change detection, HAA authority' },
        { title: 'Agent Runs DAG', href: '#dag', desc: 'Interactive execution graph from Audit → Spec → Intake → Cert' },
        { title: 'Task & Workflow Detail', href: '#workflow-detail', desc: 'Machine inputs, outputs, evidence IDs, and error states' },
      ],
    },
    {
      section: 'Certification & Evidence',
      description: '13 quality gates, evidence chain, and runtime verification',
      badge: 'SURFACES 18-22',
      items: [
        { title: 'Certification Gates (1-13)', href: '#gates', desc: 'Contract, ILS, LSNB, RSSB, UBRC, Renderer, Brand, Composer' },
        { title: 'Evidence Explorer', href: '#evidence', desc: 'Trace: claim → entity → evidenceId → evidence → source file' },
        { title: 'Runtime & Browser Verification', href: '#browser', desc: 'Chromium, Firefox, WebKit DOM inspection & console verification' },
        { title: 'Composer Verification', href: '#composer-verify', desc: 'Verify block constructs cleanly inside TutorialDocument' },
        { title: 'Final Certification', href: '#final-cert', desc: 'HAA Human certification authority signoff' },
      ],
    },
    {
      section: 'Composer Handoff',
      description: 'Downstream handoff to existing product Tutorial Composer',
      badge: 'SURFACE 23',
      items: [
        { title: 'Certified Block Handoff', href: '/tools/tutorial-block-composer', desc: 'Pass certified block to TutorialDocument.blocks[] downstream' },
      ],
    },
  ];

  // Lifecycle Gates Array
  const lifecycleGates = [
    { num: 'G1', label: 'Repository Audit', status: 'PASS', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { num: 'G2', label: 'Specification Brief', status: 'PASS', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { num: 'G3', label: 'External AI Package', status: 'PASS', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { num: 'G4', label: 'Candidate Placement', status: 'IN REVIEW', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { num: 'G5', label: 'Certification Gates', status: 'BLOCKED (1)', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { num: 'G6', label: 'Composer Handoff', status: 'PENDING', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Control Plane Master Header Card */}
      <section className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 sm:p-8 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            {/* Metadata Tags Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-pink-50 border border-pink-200 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#e11d48]">
                <BrainCircuit size={13} />
                PROJECT LLM
              </span>
              <span className="text-xs font-semibold text-slate-400">•</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700 font-mono">
                CONTROL PLANE OVERVIEW
              </span>
              <span className="text-xs font-semibold text-slate-400">•</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 font-mono">
                BRANCH: m2-project-ai-foundation
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit tracking-tight">
              Project LLM Control Plane Home
            </h1>
            <p className="text-sm font-medium text-slate-500 max-w-3xl leading-relaxed">
              Engineering control plane for educational block creation, intra-family derivation, deterministic candidate intake, evidence freezing, and HAA certification authority.
            </p>

            {/* Quick Action Button Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('brief-builder')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Sparkles size={15} />
                <span>Create Block Spec</span>
                <ArrowRight size={13} />
              </button>

              <button
                onClick={() => { setActiveTab('pipelines'); setPipelineFilter('active'); }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <FileInput size={15} className="text-indigo-600" />
                <span>Review Candidates (1)</span>
              </button>

              <button
                onClick={() => { setActiveTab('pipelines'); setPipelineFilter('approval'); }}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-xs font-bold text-amber-800 shadow-sm hover:bg-amber-100/70 transition-all"
              >
                <ShieldAlert size={15} className="text-amber-600" />
                <span>Awaiting Approvals (2)</span>
              </button>

              <Link
                href="/tools/tutorial-block-composer"
                className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50/50 px-4 py-2.5 text-xs font-bold text-pink-700 shadow-sm hover:bg-pink-100/60 transition-all"
              >
                <Layers size={15} className="text-[#e11d48]" />
                <span>Downstream Composer</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>

          {/* Repo & Snapshot Telemetry Card */}
          <div className="lg:w-[380px] shrink-0 rounded-xl border border-slate-200/80 bg-slate-50/60 backdrop-blur-sm p-4 shadow-inner space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
              <span className="text-[10px] uppercase font-bold text-slate-400">Control Plane Telemetry</span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">Active Run</span>
              <span className="font-bold text-slate-800">#WF-00142 (I2 Pilot)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">Commit SHA</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">93794f63</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">Snapshot Authority</span>
              <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">#SNAP-7F3A9E</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">Human Authority</span>
              <span className="font-bold text-pink-700">HAA Gate-1 Enforced</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Overview & 23-Surface Hub
          </button>
          <button
            onClick={() => setActiveTab('pipelines')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pipelines'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Live Pipelines & Feed</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-bold">4</span>
          </button>
          <button
            onClick={() => setActiveTab('brief-builder')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'brief-builder'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Creation Brief Tool
          </button>
        </div>
      </section>

      {/* 2. Control Plane KPI Cards (Active Workflows, Approvals, Blocked, Evidence) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 font-outfit">Control Plane Status</h2>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">FastAPI Telemetry</span>
          </div>
          <span className="text-xs font-mono text-slate-400">Refreshed 2m ago</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {controlPlaneStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 shadow-xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">{stat.label}</p>
                    </div>
                    <p className={`mt-1 text-3xl font-black font-outfit ${stat.valueColor}`}>{stat.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ${stat.iconBg}`}>
                    <Icon size={22} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium truncate">{stat.subtext}</span>
                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase ${stat.badgeColor}`}>
                    {stat.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Corpus & Runtime Intelligence Cards (18 / 133 / 3 / 14) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 font-outfit">Corpus & Runtime Taxonomy</h2>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Canonical Registries</span>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-400">18 Families • 133 Versions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {corpusStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 shadow-xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">{stat.label}</p>
                    <p className={`mt-1 text-2xl font-black font-outfit ${stat.valueColor}`}>{stat.value}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg}`}>
                    <Icon size={20} />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-medium">{stat.subtext}</p>
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase ${stat.badgeColor}`}>
                    {stat.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Sequenced Workflow Lifecycle Gates (DAG Health) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 font-outfit">Workflow Lifecycle Gates</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Deterministic sequence from repository audit to downstream composer handoff.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg text-[11px] font-mono text-slate-600 font-semibold">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>AI Plan ≠ Approval</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {lifecycleGates.map((gate, index) => (
            <div
              key={gate.num}
              className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-4 shadow-lg border-t border-white/60 -translate-y-1 hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-white bg-gradient-to-br from-slate-700 to-slate-900 shadow-sm font-mono">
                  {gate.num}
                </span>
                <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase ${gate.color}`}>
                  {gate.status}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold text-slate-900 font-outfit leading-tight">{gate.label}</p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                <span>Stage {index + 1} of 6</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Conditional Tabs Content: Overview / Pipelines / Brief Builder */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Recent Work Pipeline (From Wireframe) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 font-outfit">Active Pipeline & Recent Work</h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Live block creation, specification review, candidate intake, and browser verification tasks.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('pipelines')}
                className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1"
              >
                <span>View All In DAG</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recentWorkItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl border-t border-white/60 -translate-y-1 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {item.id}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase">
                          {item.type}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border uppercase ${
                        item.statusType === 'warning'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : item.statusType === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 font-outfit">{item.title}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.details}</p>

                    {/* Proof Checks Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.checks.map((check) => (
                        <span
                          key={check}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                        >
                          <Check size={11} className="text-emerald-500" />
                          <span>{check}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">{item.hash}</span>
                    <button className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 hover:translate-x-0.5 transition-all">
                      <span>{item.actionText}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Complete 23 GUI Surfaces Directory (The Full Project LLM Architecture) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 font-outfit">Project LLM Control Plane Architecture</h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Complete 23 GUI surfaces inventory across 6 operational zones.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-pink-50 text-[#e11d48] border border-pink-200 px-2.5 py-1 rounded-md">
                23 SURFACES INVENTORY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {guiSurfaces.map((zone) => (
                <div
                  key={zone.section}
                  className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 shadow-xl border-t border-white/60 flex flex-col justify-between -translate-y-1 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h3 className="text-base font-bold text-slate-900 font-outfit">{zone.section}</h3>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {zone.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{zone.description}</p>

                    <div className="space-y-2 pt-1">
                      {zone.items.map((surf) => (
                        <div
                          key={surf.title}
                          className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 hover:bg-white hover:border-pink-200/80 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 font-outfit">{surf.title}</span>
                            <ChevronRight size={12} className="text-slate-400" />
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">{surf.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Architecture Boundary Callouts (Mix & Match vs Composer) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Intra-Family Rule Card */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-pink-50/50 p-6 shadow-xl border-t border-white/60 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-950 font-outfit">
                    Intra-Family Mix & Match Boundary
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Project LLM Mix & Match operates <strong>strictly intra-family</strong>. For example, select compatible components from <code>I1 + I2 + I5</code> to derive new version <code>I7</code>.
                </p>
                <div className="rounded-xl border border-indigo-200/70 bg-white p-3 font-mono text-xs space-y-1.5 shadow-sm">
                  <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <Check size={13} className="text-emerald-600 shrink-0" />
                    <span>ALLOWED: Introduction (I1 + I2 + I5) → Introduction I7</span>
                  </div>
                  <div className="text-rose-600 font-bold flex items-center gap-1.5">
                    <XCircle size={13} className="text-rose-500 shrink-0" />
                    <span>BLOCKED: Introduction I2 + Objective O2 + Code C1 (Composer Layer)</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-indigo-100/60 flex items-center justify-between text-xs font-semibold text-indigo-700">
                <span>FastAPI Domain Validation Enforced</span>
                <span className="font-mono text-[11px]">Surface 07</span>
              </div>
            </div>

            {/* Downstream Composer Boundary Card */}
            <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50/70 via-white to-orange-50/50 p-6 shadow-xl border-t border-white/60 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-[#e11d48]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-pink-950 font-outfit">
                    Downstream Product Composer Handoff
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Project LLM certifies standalone blocks. The existing Tutorial Composer remains the product runtime surface that composes certified blocks across families into <code>TutorialDocument.blocks[]</code>.
                </p>
                <div className="rounded-xl border border-pink-200/70 bg-white p-3 font-mono text-xs space-y-1 shadow-sm text-slate-700">
                  <p className="text-[11px] font-bold text-slate-900">Tutorial Document Execution Flow:</p>
                  <p className="text-slate-600">Introduction I7 + Definition D3 + Code C2 → TutorialBlockRenderer</p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-pink-100/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">/tools/tutorial-block-composer</span>
                <Link
                  href="/tools/tutorial-block-composer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-105 transition-all"
                >
                  <span>Open Composer</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Pipelines & Filter View */}
      {activeTab === 'pipelines' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800 font-outfit">Workflow Pipelines Management</h2>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">4 TOTAL</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPipelineFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  pipelineFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All (4)
              </button>
              <button
                onClick={() => setPipelineFilter('approval')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  pipelineFilter === 'approval' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Awaiting Approval (2)
              </button>
              <button
                onClick={() => setPipelineFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  pipelineFilter === 'active' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                In Review (1)
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {recentWorkItems
              .filter((item) => {
                if (pipelineFilter === 'approval') return item.status.includes('Awaiting') || item.status.includes('Reviewing');
                if (pipelineFilter === 'active') return item.statusType === 'warning';
                return true;
              })
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl border-t border-white/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {item.id}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase">
                        {item.type}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">•</span>
                      <span className="text-xs font-mono font-bold text-slate-500">{item.family}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 font-outfit">{item.title}</h3>
                    <p className="text-xs text-slate-500">{item.details}</p>
                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                      <span className="text-slate-400">{item.hash}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-600 font-bold">{item.checks.join(' • ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all">
                      Inspect DAG
                    </button>
                    <button className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md hover:scale-105 active:scale-95 transition-all">
                      {item.actionText}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 7. Creation Brief Builder Panel */}
      {activeTab === 'brief-builder' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-outfit">Creation Brief Generator</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Generate prompt package and engineering specifications for external AI authoring.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Back to Overview
            </button>
          </div>
          <CreationBriefPanel />
        </div>
      )}
    </div>
  );
}
