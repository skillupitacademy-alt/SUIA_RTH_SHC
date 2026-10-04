import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BrainCircuit,
  ClipboardCheck,
  FileInput,
  FileText,
  GitBranch,
  Layers,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PROJECT_LLM_REPOSITORY_INTELLIGENCE } from '@/lib/project-llm';

export const metadata = {
  title: 'Project LLM | SkillHubCore Admin',
  description: 'Project-specific workbench for educational block creation and certification.',
};

const workflowStages = [
  { label: 'Request', value: 'New block intent', status: 'Ready', statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Brief', value: 'External AI package', status: 'Ready', statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Prototype', value: 'HTML/CSS/JS/JSON', status: 'Human gate', statusColor: 'bg-pink-50 text-pink-700 border-pink-200' },
  { label: 'Candidate', value: 'React/TypeScript', status: 'Manual intake', statusColor: 'bg-orange-50 text-orange-700 border-orange-200' },
  { label: 'Review', value: 'UBRC/ILS/LSNB/RSSB', status: 'Planned', statusColor: 'bg-slate-100 text-slate-700 border-slate-200' },
  { label: 'Evidence', value: 'Certification package', status: 'Planned', statusColor: 'bg-slate-100 text-slate-700 border-slate-200' },
];

interface AgentLane {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  badge: string;
  badgeColor: string;
  buttonColor: string;
  items: string[];
}

const agentLanes: AgentLane[] = [
  {
    id: 'repo-intel',
    title: 'Repository Intelligence',
    icon: GitBranch,
    iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-indigo-500/25',
    badge: '18-BLOCK CORPUS',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    items: ['18 families, 132 versions', '3 verified, 1 incomplete, 15 planned', 'Reference patterns: I1, C1, D1'],
  },
  {
    id: 'creation-brief',
    title: 'Creation Brief',
    icon: FileText,
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-pink-500/25',
    badge: 'PROMPT GENERATOR',
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
    buttonColor: 'bg-[#e11d48] hover:bg-[#be123c] text-white',
    items: ['Introduction I1 to I2 pilot', 'Brand-independent rules', 'External AI prompt package'],
  },
  {
    id: 'candidate-intake',
    title: 'Candidate Intake',
    icon: FileInput,
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-orange-500/25',
    badge: 'REACT / TS INTAKE',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    buttonColor: 'bg-orange-600 hover:bg-orange-700 text-white',
    items: ['Approved GUI prototype proof', 'React/TS candidate artifacts', 'Candidate intake checklist'],
  },
  {
    id: 'compliance-review',
    title: 'Compliance Review',
    icon: ListChecks,
    iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-purple-500/25',
    badge: 'UBRC / RUNTIME',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    buttonColor: 'bg-purple-600 hover:bg-purple-700 text-white',
    items: ['UBRC identity compliance', 'Tutorial Composer fit', 'Runtime passive boundaries'],
  },
  {
    id: 'validation-evidence',
    title: 'Validation Evidence',
    icon: ClipboardCheck,
    iconBg: 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-teal-500/25',
    badge: 'TEST & TELEMETRY',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    items: ['Unit and integration tests', 'SkillUp & RTH brand proof', 'ILS, LSNB & RSSB safe checks'],
  },
  {
    id: 'certification',
    title: 'Certification',
    icon: BadgeCheck,
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25',
    badge: 'HAA GATE-1',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    buttonColor: 'bg-amber-600 hover:bg-amber-700 text-white',
    items: ['HAA authority review', 'Conditional approval checks', 'Final evidence ledger'],
  },
];

const guardrails = [
  ['Stack', 'Node.js + TS + React'],
  ['Phase 1 target', 'Introduction I2 pilot'],
  ['Reference', 'Introduction I1'],
  ['External AI', 'Manual handoff only'],
  ['Repository mutation', 'Human-approved only'],
  ['Certification', 'HAA only'],
];

export default function ProjectLlmWorkbenchPage() {
  const { corpus, runtime } = PROJECT_LLM_REPOSITORY_INTELLIGENCE;
  
  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <section className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 sm:p-8 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-pink-50 border border-pink-200 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#e11d48]">
                <BrainCircuit size={13} />
                PROJECT LLM
              </span>
              <span className="text-xs font-semibold text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500">Tutorial Engine Suite</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700">
                PHASE 1 WORKBENCH
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit tracking-tight">
              Educational block creation workbench
            </h1>
            <p className="text-sm font-medium text-slate-500 max-w-3xl leading-relaxed">
              Project LLM coordinates external AI block creation, candidate review, integration planning, validation evidence, and HAA certification for Tutorial Composer blocks.
            </p>
            <div className="pt-2">
              <Link
                href="/tools/tutorial-block-composer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Layers size={15} />
                <span>Open Block Composer</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Guardrails Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 lg:w-[440px] shrink-0">
            {guardrails.map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-3 shadow-md hover:shadow-lg transition-all"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">{label}</p>
                <p className="mt-1 text-xs font-bold text-slate-800 font-outfit leading-tight">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Stages Row (Matching Dashboard / Composer Stat Elevation) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 font-outfit">Project LLM Intelligence</h2>
          <span className="text-xs font-mono font-semibold text-slate-400">Corpus & Runtime</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Corpus Families</p>
                <p className="mt-1 text-2xl font-black text-slate-900 font-outfit">{corpus.status.families}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Layers size={20} />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 font-medium">Educational block families</p>
          </div>
          
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Documented Versions</p>
                <p className="mt-1 text-2xl font-black text-slate-900 font-outfit">{corpus.status.documentedVersions}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <FileText size={20} />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 font-medium">Across all families</p>
          </div>
          
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Verified Runtime</p>
                <p className="mt-1 text-2xl font-black text-emerald-600 font-outfit">{runtime.status.verifiedImplementations}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <BadgeCheck size={20} />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 font-medium">I1, C1, D1 implementations</p>
          </div>
          
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Planned Families</p>
                <p className="mt-1 text-2xl font-black text-orange-600 font-outfit">{runtime.status.plannedFamilies}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <GitBranch size={20} />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 font-medium">Not yet implemented</p>
          </div>
        </div>
      </div>

      {/* Workflow Stages Row (Matching Dashboard / Composer Stat Elevation) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 font-outfit">Workflow Lifecycle Stages</h2>
          <span className="text-xs font-mono font-semibold text-slate-400">6 Sequenced Gates</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {workflowStages.map((stage, index) => (
            <div
              key={stage.label}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 shadow-xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black text-white shadow-md ${
                    index % 2 === 0
                      ? 'bg-gradient-to-br from-pink-500 to-rose-600 shadow-pink-500/25'
                      : 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/25'
                  }`}
                >
                  {index + 1}
                </span>
                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase font-mono ${stage.statusColor}`}>
                  {stage.status}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 font-outfit tracking-tight group-hover:text-pink-600 transition-colors">
                  {stage.label}
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
                  {stage.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid of Workflow Agent Operation Cards (100% Match with Composer OPERATION_CARDS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 font-outfit">Workflow Execution Lanes</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Bounded execution agents for the Project LLM implementation.
            </p>
          </div>
          <Bot className="text-pink-500" size={24} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agentLanes.map((lane) => {
            const Icon = lane.icon;
            return (
              <div
                key={lane.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl border-t border-white/60 -translate-y-1 hover:border-pink-300/80 hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <div className="space-y-4">
                  {/* Top Row: Icon Badge & Status Tag */}
                  <div className="flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${lane.iconBg}`}>
                      <Icon size={24} />
                    </div>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase font-mono transition-colors ${lane.badgeColor}`}>
                      {lane.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-outfit tracking-tight group-hover:text-pink-600 transition-colors">
                      {lane.title}
                    </h3>
                  </div>

                  {/* Items Checklist */}
                  <div className="space-y-2 pt-1">
                    {lane.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="mt-6 pt-4 border-t border-slate-100/90 flex items-center justify-between">
                  <span className="text-[11px] font-mono font-medium text-slate-400">
                    lane.{lane.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-all duration-200 group-hover:scale-105 active:scale-95 ${lane.buttonColor}`}
                  >
                    <span>Inspect</span>
                    <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Phase 1 Pilot & Next Slice Architecture Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phase 1 Pilot Card */}
        <section className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 sm:p-7 shadow-xl border-t border-white/60 -translate-y-1 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/25">
                <Layers size={22} />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-outfit tracking-tight">Phase 1 Pilot Contract</h3>
                <p className="text-xs font-semibold text-slate-500">Introduction I1 Reference to I2 Pilot</p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {[
                ['I1 Target', 'Reference implementation'],
                ['I2 Pilot', 'First Project LLM workflow candidate'],
                ['Composer', 'Canonical authoring path'],
                ['Runtime', 'UBRC visible, ILS passive, LSNB/RSSB consumer-safe'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 backdrop-blur-sm px-4 py-3 hover:bg-white hover:shadow-sm transition-all"
                >
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-pink-600 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded">
                    {label}
                  </span>
                  <span className="text-right text-xs font-bold text-slate-800 font-outfit">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Architectural Concept Info Banner (100% Match with Composer line 198) */}
        <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-pink-50/50 p-6 sm:p-7 shadow-xl border-t border-white/60 -translate-y-1 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-950 font-outfit">
                Gate-1 Next Slice Architecture
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Create the typed workflow contracts, static repository intelligence, and creation brief builder for the Introduction I2 pilot. All artifacts conform to the 18-block corpus registry and runtime boundaries.
            </p>

            <div className="grid grid-cols-3 gap-2.5 pt-2 font-mono text-[11px]">
              <div className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-3 text-center shadow-md">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target</p>
                <p className="mt-1 font-bold text-slate-800 font-outfit text-xs">I2 Pilot</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-3 text-center shadow-md">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Boundary</p>
                <p className="mt-1 font-bold text-slate-800 font-outfit text-xs">UBRC/ILS Safe</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-3 text-center shadow-md">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approval</p>
                <p className="mt-1 font-bold text-slate-800 font-outfit text-xs">HAA Gate-1</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-indigo-100/60 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">/tools/tutorial-page-content</span>
            <Link
              href="/tools/tutorial-page-content"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <span>Open Composer Context</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
