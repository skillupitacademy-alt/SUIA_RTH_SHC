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

export const metadata = {
  title: 'Project LLM | SkillHubCore Admin',
  description: 'Project-specific workbench for educational block creation and certification.',
};

const workflowStages = [
  { label: 'Request', value: 'New block intent', status: 'Ready' },
  { label: 'Brief', value: 'External AI package', status: 'Ready' },
  { label: 'Prototype', value: 'HTML/CSS/JS/JSON', status: 'Human gate' },
  { label: 'Candidate', value: 'React/TypeScript', status: 'Manual intake' },
  { label: 'Review', value: 'UBRC/ILS/LSNB/RSSB', status: 'Planned' },
  { label: 'Evidence', value: 'Certification package', status: 'Planned' },
];

const agentLanes = [
  {
    title: 'Repository Intelligence',
    icon: GitBranch,
    items: ['18-family corpus', 'Family/version matrix', 'Reference patterns'],
  },
  {
    title: 'Creation Brief',
    icon: FileText,
    items: ['I1 to I2 pilot', 'Brand-independent rules', 'External AI prompt'],
  },
  {
    title: 'Candidate Intake',
    icon: FileInput,
    items: ['Approved GUI evidence', 'React/TS candidate', 'Artifact checklist'],
  },
  {
    title: 'Compliance Review',
    icon: ListChecks,
    items: ['UBRC identity', 'Composer fit', 'Runtime boundaries'],
  },
  {
    title: 'Validation Evidence',
    icon: ClipboardCheck,
    items: ['Tests', 'SkillUp/RTH proof', 'ILS/LSNB/RSSB checks'],
  },
  {
    title: 'Certification',
    icon: BadgeCheck,
    items: ['HAA decision', 'Conditions', 'Final evidence record'],
  },
];

const guardrails = [
  ['Stack', 'Node.js + TypeScript + React'],
  ['Phase 1 target', 'Introduction I2 pilot'],
  ['Reference', 'Introduction I1'],
  ['External AI', 'Manual handoff only'],
  ['Repository mutation', 'Human-approved only'],
  ['Certification', 'HAA only'],
];

export default function ProjectLlmWorkbenchPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-md border border-pink-200 bg-pink-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#e11d48]">
                <BrainCircuit size={14} />
                Project LLM
              </span>
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                Phase 1 Shell
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Educational block creation workbench
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                Project LLM coordinates external AI block creation, candidate review, integration planning, validation evidence, and HAA certification for Tutorial Composer blocks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[420px]">
            {guardrails.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                <p className="mt-1 text-xs font-bold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-6">
        {workflowStages.map((stage, index) => (
          <div key={stage.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white">
                {index + 1}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {stage.status}
              </span>
            </div>
            <h2 className="mt-4 text-sm font-black text-slate-950">{stage.label}</h2>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{stage.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">Workflow Agents</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Bounded execution lanes for the Project LLM implementation.
              </p>
            </div>
            <Bot className="text-pink-500" size={24} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {agentLanes.map((lane) => {
              const Icon = lane.icon;
              return (
                <div key={lane.title} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-pink-600 shadow-sm">
                      <Icon size={18} />
                    </span>
                    <h3 className="text-sm font-black text-slate-900">{lane.title}</h3>
                  </div>
                  <div className="mt-3 space-y-2">
                    {lane.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <ShieldCheck size={13} className="text-emerald-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg">
                <Layers size={20} />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-950">Phase 1 Pilot</h2>
                <p className="text-xs font-semibold text-slate-500">Introduction I1 to I2</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ['I1', 'Reference implementation'],
                ['I2', 'First Project LLM workflow candidate'],
                ['Composer', 'Canonical authoring path'],
                ['Runtime', 'UBRC visible, ILS passive, LSNB/RSSB consumer-safe'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
                  <span className="text-right text-xs font-bold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 via-white to-orange-50 p-6 shadow-xl">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-pink-600" />
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-950">Next Slice</h2>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
              Create the typed workflow contracts, static repository intelligence, and creation brief builder for the Introduction I2 pilot.
            </p>
            <Link
              href="/tools/tutorial-page-content"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-slate-800"
            >
              <span>Open Composer Context</span>
              <ArrowRight size={14} />
            </Link>
          </section>
        </div>
      </section>
    </div>
  );
}
