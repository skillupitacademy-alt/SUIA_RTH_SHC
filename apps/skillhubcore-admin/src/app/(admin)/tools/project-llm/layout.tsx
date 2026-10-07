'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight, Search, Bell, User } from 'lucide-react';
import { ProjectLlmProvider } from './context/ProjectLlmContext';

const routeTitleMap: Record<string, string> = {
  '/tools/project-llm': 'Dashboard',
  '/tools/project-llm/create': 'Create Block',
  '/tools/project-llm/compliance-brief': 'Compliance Brief',
  '/tools/project-llm/external-ai-handoff': 'External AI Handoff',
  '/tools/project-llm/candidate-upload': 'Candidate Upload',
  '/tools/project-llm/integration-certification': 'Integration & Certification',
  '/tools/project-llm/workflow-details': 'Workflow Details',
};

export default function ProjectLlmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentTitle = routeTitleMap[pathname] || 'Project LLM';

  return (
    <ProjectLlmProvider>
      <div className="space-y-5">
        {/* Top Breadcrumb & Quick Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Breadcrumb path */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
              <Home size={14} className="text-slate-400" />
              <span>AI Content Workspace</span>
            </Link>
            <ChevronRight size={13} className="text-slate-400" />
            <Link href="/tools/project-llm" className="hover:text-slate-900 transition-colors">
              Project LLM
            </Link>
            <ChevronRight size={13} className="text-slate-400" />
            <span className="font-bold text-slate-900">{currentTitle}</span>
          </nav>

          {/* Quick Search & User Profile */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search blocks, versions, candidates..."
                className="w-full rounded-xl border border-slate-200/90 bg-white py-1.5 pl-9 pr-3 text-xs placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-pink-500"
              />
            </div>
            <div className="hidden md:flex items-center gap-3 text-slate-400">
              <button
                type="button"
                className="h-8 w-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 relative shadow-2xs"
                aria-label="Notifications"
              >
                <Bell size={14} />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-pink-500" />
              </button>
              <div className="flex items-center gap-2 pl-1 cursor-pointer">
                <span className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  AD
                </span>
                <span className="text-xs font-bold text-slate-800">Admin User</span>
                <ChevronRight size={13} className="rotate-90 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Surface Content */}
        {children}
      </div>
    </ProjectLlmProvider>
  );
}
