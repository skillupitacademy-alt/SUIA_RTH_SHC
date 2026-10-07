'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Database,
  GitBranch,
  GitCommit,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ChevronRight,
  MoreHorizontal,
  Box,
  Users,
  ShieldCheck,
  Clock,
  RotateCw,
  Zap,
  FileText,
  Upload,
  BookOpen,
  Activity,
  Layers,
  Sparkles,
  Target,
  Code,
  Image as ImageIcon,
  Columns,
  Play,
  Brain,
  AlertTriangle,
  Award,
  ExternalLink,
} from 'lucide-react';

export default function ProjectLlmDashboardPage() {
  const [copiedCommit, setCopiedCommit] = useState(false);

  const handleCopyCommit = () => {
    navigator.clipboard.writeText('9b7f4c2e3');
    setCopiedCommit(true);
    setTimeout(() => setCopiedCommit(false), 2000);
  };

  return (
    <div className="space-y-5 pb-16 font-sans">
      {/* 1. Hero Card */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        {/* Ambient Top Right Glow */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-64 w-80 bg-gradient-to-br from-pink-200/40 via-purple-200/30 to-transparent blur-2xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Left: Branding & Subtitle */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e11d48] to-[#f43f5e] text-white shadow-md shadow-pink-500/20 shrink-0">
              <Database size={28} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
                  Project <span className="text-[#e11d48]">LLM</span>
                </h1>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 font-outfit mt-0.5">
                Engineering Control Plane for Educational Blocks
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl font-medium">
                Define requirements, verify implementations, integrate and certify blocks for Tutorial Composer.
              </p>
            </div>
          </div>

          {/* Right: Telemetry Pills & Snapshot status */}
          <div className="flex flex-col items-start xl:items-end gap-3 shrink-0">
            {/* Top row of pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Repository Pill */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs">
                <Database size={14} className="text-slate-500" />
                <div className="leading-tight">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Repository</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">SUIA_RTH_SHC</span>
                </div>
              </div>

              {/* Branch Pill */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs">
                <GitBranch size={14} className="text-slate-500" />
                <div className="leading-tight">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Branch</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">m2-project-ai-foundation</span>
                </div>
              </div>

              {/* Commit Pill */}
              <button
                onClick={handleCopyCommit}
                className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs hover:border-slate-300 transition-colors text-left"
              >
                <GitCommit size={14} className="text-slate-500" />
                <div className="leading-tight">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Commit</span>
                  <span className="text-xs font-bold text-slate-800 font-mono flex items-center gap-1">
                    9b7f4c2e3
                    {copiedCommit ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-slate-400" />}
                  </span>
                </div>
              </button>
            </div>

            {/* Bottom meta line */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="text-slate-400">Last Snapshot</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                SNAP-20261005-001
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-mono text-[11px]">2026-10-05 14:23</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 text-[11px]">482 files</span>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Healthy
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4 Metric Cards Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: In Progress */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20 shrink-0">
              <Box size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-outfit leading-none">3</p>
              <h3 className="text-xs font-bold text-slate-900 font-outfit mt-1">In Progress</h3>
              <p className="text-[11px] text-slate-400 font-medium">Candidates under validation</p>
            </div>
          </div>
          <Link
            href="/tools/project-llm/candidate-upload"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors shadow-2xs"
          >
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Card 2: Awaiting Approval */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20 shrink-0">
              <Users size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-outfit leading-none">2</p>
              <h3 className="text-xs font-bold text-slate-900 font-outfit mt-1">Awaiting Approval</h3>
              <p className="text-[11px] text-slate-400 font-medium">Human approval required</p>
            </div>
          </div>
          <Link
            href="/tools/project-llm/workflow-details"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors shadow-2xs"
          >
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Card 3: Certified */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-outfit leading-none">5</p>
              <h3 className="text-xs font-bold text-slate-900 font-outfit mt-1">Certified</h3>
              <p className="text-[11px] text-slate-400 font-medium">Available in Tutorial Composer</p>
            </div>
          </div>
          <Link
            href="/tools/project-llm/integration-certification"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Card 4: Blocked */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20 shrink-0">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-outfit leading-none">1</p>
              <h3 className="text-xs font-bold text-slate-900 font-outfit mt-1">Blocked</h3>
              <p className="text-[11px] text-slate-400 font-medium">Action required</p>
            </div>
          </div>
          <Link
            href="/tools/project-llm/candidate-upload"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors shadow-2xs"
          >
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* 3. Middle Row: 3 Action Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Create Educational Block (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 border border-pink-200 text-[#e11d48] shadow-2xs">
                <Box size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-outfit">
                Create Educational Block
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Create a new block version by selecting a family and generating a compliance brief.
            </p>
          </div>

          <div className="mt-6">
            <Link
              href="/tools/project-llm/create"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-orange-500 hover:from-pink-700 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-pink-500/20 transition-all active:scale-[0.98]"
            >
              <span>+ Create New Block</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Middle Card: Continue Previous Work (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shadow-2xs">
              <RotateCw size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-outfit">
                Continue Previous Work
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Pick up recently worked candidates.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              {
                title: 'Introduction I7',
                status: 'Validation',
                statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
                iconColor: 'bg-pink-100 text-pink-600',
                href: '/tools/project-llm/candidate-upload',
              },
              {
                title: 'Objective O5',
                status: 'Awaiting Approval',
                statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
                iconColor: 'bg-orange-100 text-orange-600',
                href: '/tools/project-llm/workflow-details',
              },
              {
                title: 'Code C4',
                status: 'Design in Progress',
                statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
                iconColor: 'bg-blue-100 text-blue-600',
                href: '/tools/project-llm/external-ai-handoff',
              },
              {
                title: 'Summary S3',
                status: 'External AI Implementation',
                statusColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
                iconColor: 'bg-emerald-100 text-emerald-600',
                href: '/tools/project-llm/external-ai-handoff',
              },
            ].map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/80 group"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-7 w-7 rounded-lg ${item.iconColor} flex items-center justify-center shrink-0`}>
                    <FileText size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-800 font-outfit group-hover:text-pink-600 transition-colors">
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.statusColor}`}>
                    {item.status}
                  </span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Card: Quick Actions (3 cols) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 border border-pink-200 text-[#e11d48] shadow-2xs">
              <Zap size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-outfit">
              Quick Actions
            </h3>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Create Block', icon: Box, iconColor: 'text-pink-600', href: '/tools/project-llm/create' },
              { label: 'View Compliance Checklist', icon: FileText, iconColor: 'text-blue-600', href: '/tools/project-llm/compliance-brief' },
              { label: 'Upload Candidate', icon: Upload, iconColor: 'text-purple-600', href: '/tools/project-llm/candidate-upload' },
              { label: 'Open Tutorial Composer', icon: BookOpen, iconColor: 'text-indigo-600', href: '/tools/tutorial-block-composer' },
            ].map((qa, i) => {
              const Icon = qa.icon;
              return (
                <Link
                  key={i}
                  href={qa.href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <Icon size={16} className={`${qa.iconColor} shrink-0`} />
                  <span className="text-xs font-bold text-slate-800 font-outfit group-hover:text-pink-600 transition-colors">
                    {qa.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Row 3: Recent Candidate Blocks & Certification Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Candidate Blocks Table (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 border border-pink-200 text-[#e11d48] shadow-2xs">
                  <Box size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-outfit">
                    Recent Candidate Blocks
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Latest activity across all candidates.
                  </p>
                </div>
              </div>

              <Link
                href="/tools/project-llm/candidate-upload"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View All &gt;
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-semibold">Block / Version</th>
                    <th className="pb-3 font-semibold">Purpose</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Last Updated</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    {
                      name: 'Introduction I7',
                      purpose: 'Enhanced topic introduction',
                      status: 'Validation',
                      statusBadge: 'bg-blue-50 text-blue-700 border-blue-200',
                      updated: '2026-10-05 14:23',
                      iconBg: 'bg-pink-100 text-pink-600',
                    },
                    {
                      name: 'Objective O5',
                      purpose: 'Interactive learning objective',
                      status: 'Awaiting Approval',
                      statusBadge: 'bg-amber-50 text-amber-700 border-amber-200',
                      updated: '2026-10-05 13:50',
                      iconBg: 'bg-orange-100 text-orange-600',
                    },
                    {
                      name: 'Code C4',
                      purpose: 'Hands-on code example',
                      status: 'Design in Progress',
                      statusBadge: 'bg-purple-50 text-purple-700 border-purple-200',
                      updated: '2026-10-05 12:10',
                      iconBg: 'bg-blue-100 text-blue-600',
                    },
                    {
                      name: 'Summary S3',
                      purpose: 'Key takeaways summary',
                      status: 'Certified',
                      statusBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      updated: '2026-10-05 11:45',
                      iconBg: 'bg-emerald-100 text-emerald-600',
                    },
                    {
                      name: 'Quiz Q2',
                      purpose: 'Knowledge check quiz',
                      status: 'Certified',
                      statusBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      updated: '2026-10-04 16:30',
                      iconBg: 'bg-teal-100 text-teal-600',
                    },
                    {
                      name: 'Exercise E3',
                      purpose: 'Hands-on exercise',
                      status: 'Blocked',
                      statusBadge: 'text-rose-600 font-bold',
                      isBlocked: true,
                      updated: '2026-10-04 10:12',
                      iconBg: 'bg-rose-100 text-rose-600',
                    },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-6 w-6 rounded-md ${row.iconBg} flex items-center justify-center shrink-0`}>
                            <FileText size={12} />
                          </div>
                          <span className="font-bold text-slate-800 font-outfit">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-500 max-w-[200px] truncate">{row.purpose}</td>
                      <td className="py-3">
                        {row.isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-600">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            Blocked
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.statusBadge}`}>
                            {row.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">{row.updated}</td>
                      <td className="py-3 text-right">
                        <button className="text-slate-400 hover:text-slate-600 p-1">
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Certification Overview Donut (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-200 text-orange-600 shadow-2xs">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-outfit">
                  Certification Overview
                </h3>
              </div>
              <Link
                href="/tools/project-llm/integration-certification"
                className="px-2.5 py-1 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View Details
              </Link>
            </div>

            {/* Donut Chart & Legend */}
            <div className="flex items-center justify-between gap-4 py-3">
              {/* SVG Donut */}
              <div className="relative h-36 w-36 shrink-0 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="11" fill="none" />
                  {/* Green segment (5 of 6 = ~83%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#10b981"
                    strokeWidth="11"
                    strokeDasharray="238.76"
                    strokeDashoffset="45"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Blue mini segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#3b82f6"
                    strokeWidth="11"
                    strokeDasharray="238.76"
                    strokeDashoffset="220"
                    fill="none"
                  />
                </svg>
                {/* Center Text */}
                <div className="absolute text-center">
                  <p className="text-2xl font-black text-slate-900 font-outfit">5 / 6</p>
                  <p className="text-[10px] font-bold text-slate-400 font-outfit">Blocks Certified</p>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2.5 flex-1 pl-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Certified
                  </span>
                  <span className="font-bold text-slate-900 font-mono">5</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    In Progress
                  </span>
                  <span className="font-bold text-slate-900 font-mono">3</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Awaiting Approval
                  </span>
                  <span className="font-bold text-slate-900 font-mono">2</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Blocked
                  </span>
                  <span className="font-bold text-slate-900 font-mono">1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Total Line */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Total Candidates</span>
            <span className="text-sm font-black text-slate-900 font-mono">11</span>
          </div>
        </div>
      </section>

      {/* 5. Row 4: Project Health, Block Families, Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Project Health (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-2xs">
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-outfit">
                    Project Health
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    System status and repository health.
                  </p>
                </div>
              </div>
              <button className="px-2.5 py-1 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                View Details
              </button>
            </div>

            <div className="space-y-3.5">
              {[
                { label: 'Repository', status: 'Healthy', val: 'SUIA_RTH_SHC' },
                { label: 'Snapshot Service', status: 'Healthy', val: 'Last: 2026-10-05 14:23' },
                { label: 'Evidence Service', status: 'Healthy', val: 'All artifacts available' },
                { label: 'API Services', status: 'Healthy', val: 'All agents operational' },
              ].map((h, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-800 font-outfit">{h.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {h.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono max-w-[120px] truncate">{h.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Block Families Grid (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600 shadow-2xs">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-outfit">
                    Block Families
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Available educational block families in Tutorial Composer.
                  </p>
                </div>
              </div>
              <Link
                href="/tools/project-llm/create"
                className="px-2.5 py-1 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View All
              </Link>
            </div>

            {/* 2 Rows of 5 Cards */}
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { name: 'Introduction', count: 6, icon: BookOpen, color: 'bg-pink-50 text-pink-600 border-pink-200' },
                { name: 'Objective', count: 4, icon: Target, color: 'bg-orange-50 text-orange-600 border-orange-200' },
                { name: 'Definition', count: 5, icon: FileText, color: 'bg-blue-50 text-blue-600 border-blue-200' },
                { name: 'Code', count: 6, icon: Code, color: 'bg-purple-50 text-purple-600 border-purple-200' },
                { name: 'Visual', count: 5, icon: ImageIcon, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
                { name: 'Comparison', count: 4, icon: Columns, color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
                { name: 'Execution', count: 4, icon: Play, color: 'bg-amber-50 text-amber-600 border-amber-200' },
                { name: 'Memory', count: 4, icon: Brain, color: 'bg-rose-50 text-rose-600 border-rose-200' },
                { name: 'Mistake', count: 4, icon: AlertTriangle, color: 'bg-red-50 text-red-600 border-red-200' },
                { name: 'Best Practice', count: 4, icon: Award, color: 'bg-teal-50 text-teal-600 border-teal-200' },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <Link
                    key={i}
                    href="/tools/project-llm/create"
                    className={`p-2 rounded-xl border ${f.color} flex flex-col items-center justify-between hover:scale-105 transition-transform group`}
                  >
                    <Icon size={14} className="mb-1" />
                    <span className="text-[10px] font-bold text-slate-800 truncate w-full block">
                      {f.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold mt-0.5">
                      {f.count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity (3 cols) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 border border-purple-200 text-purple-600 shadow-2xs">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-outfit">
                    Recent Activity
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Latest system and workflow events.
                  </p>
                </div>
              </div>
              <button className="px-2.5 py-1 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {[
                { text: 'Candidate Introduction I7 uploaded', time: '14:23', dot: 'bg-emerald-500' },
                { text: 'Validation completed for Objective O5', time: '13:50', dot: 'bg-blue-500' },
                { text: 'Human approval requested for Code C4', time: '12:10', dot: 'bg-rose-500' },
                { text: 'Block Summary S3 certified', time: '11:45', dot: 'bg-emerald-500' },
                { text: 'Repository snapshot created', time: '10:32', dot: 'bg-blue-500' },
                { text: 'Runtime verification completed for Quiz Q2', time: '10:12', dot: 'bg-emerald-500' },
              ].map((ev, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-xs">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className={`h-2 w-2 rounded-full ${ev.dot} shrink-0 mt-1`} />
                    <span className="text-slate-700 font-medium text-[11px] leading-tight truncate">
                      {ev.text}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{ev.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
