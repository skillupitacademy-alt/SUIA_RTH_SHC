'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BrainCircuit,
  Layers,
  Search,
  Sparkles,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  Workflow,
  ExternalLink,
  Sliders,
  FileInput,
  FileCheck,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/tools/project-llm' },
  { label: 'Family Registry', href: '/tools/project-llm/registry', badge: '18' },
  { label: 'Version Explorer', href: '/tools/project-llm/explorer' },
  { label: 'Relationship Matrix', href: '/tools/project-llm/matrix' },
  { label: 'Create Block', href: '/tools/project-llm/create' },
  { label: 'Mix & Match', href: '/tools/project-llm/mix-match', badge: 'Intra' },
  { label: 'Candidate Intake', href: '/tools/project-llm/candidate-intake' },
  { label: 'Approvals', href: '/tools/project-llm/approvals', badge: '2' },
  { label: 'Agent DAG', href: '/tools/project-llm/dag' },
  { label: 'Certification Gates', href: '/tools/project-llm/gates', badge: '13' },
  { label: 'Evidence Explorer', href: '/tools/project-llm/evidence' },
];

export default function ProjectLlmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Top Sticky Sub-Navigation Bar */}
      <div className="sticky top-0 z-20 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-2.5 shadow-md flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md shadow-pink-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden xl:flex items-center gap-2 shrink-0 pr-1">
          <Link
            href="/tools/tutorial-block-composer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-pink-600 hover:bg-pink-50 border border-slate-200/70 transition-all"
          >
            <Layers size={13} className="text-[#e11d48]" />
            <span>Downstream Composer</span>
            <ExternalLink size={11} />
          </Link>
        </div>
      </div>

      {/* Main Surface Content */}
      <div>{children}</div>
    </div>
  );
}
