'use client';

import React from 'react';
import Link from 'next/link';
import {
  Network,
  Home,
  ShieldCheck,
  MessageSquare,
  Box,
  Settings,
  CheckSquare,
  BookOpen,
  ClipboardList,
  Users,
  Briefcase,
  LayoutGrid,
  FileText,
  Compass,
  Layout,
  Edit,
  GraduationCap,
  PlaySquare,
  ChevronRight,
  FolderTree,
  Award,
  BadgeCheck,
} from 'lucide-react';

interface LeftSidebarProps {
  isLeftSidebarOpen: boolean;
  setIsLeftSidebarOpen: (open: boolean) => void;
  pathname: string;
}

export function LeftSidebar({ isLeftSidebarOpen, setIsLeftSidebarOpen, pathname }: LeftSidebarProps) {
  return (
    <>
      {/* Left Sidebar Backdrop */}
      {isLeftSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity w-full h-full border-none p-0 m-0"
          onClick={() => setIsLeftSidebarOpen(false)}
          aria-label="Close Left Sidebar"
        />
      )}

      {/* Left Sidebar (Overlay) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 bg-[#111827] text-slate-300 flex flex-col w-[280px] overflow-y-auto hide-scrollbar transition-transform duration-300 shadow-2xl ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="p-6 pb-4 w-[280px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg shrink-0">
              <Network size={24} />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-xl font-bold text-white tracking-tight leading-tight whitespace-nowrap">SkillHubCore</h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5 whitespace-nowrap">Admin Dashboard</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 w-[280px]">
          <Link href="/dashboard" className="flex items-center gap-3 bg-[#e11d48] text-white px-4 py-3 rounded-lg font-medium shadow-[0_4px_14px_0_rgba(225,29,72,0.39)]">
            <Home size={20} className="shrink-0" />
            <span className="whitespace-nowrap">Dashboard</span>
          </Link>
        </div>

        <div className="flex-1 px-4 py-4 space-y-6 w-[280px]">
          {/* Governance & Core */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">Governance & Core</h2>
            <nav className="space-y-1">
              {[
                { icon: FolderTree, label: 'Educational Hierarchy', href: '/questions' },
                { icon: ShieldCheck, label: 'Constitutional Center', href: '#' },
                { icon: MessageSquare, label: 'Prompt Governance', href: '#' },
                { icon: Box, label: 'Architecture Governance', href: '#' },
                { icon: Settings, label: 'Brand & Deployment', href: '#' },
                { icon: Settings, label: 'System Settings', href: '#' },
                { icon: CheckSquare, label: 'Audit & Compliance', href: '#' }
              ].map((item, i) => (
                <Link key={i} href={item.href || '#'} className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors focus:ring-2 focus:ring-pink-500 outline-none ${pathname === item.href ? 'bg-slate-800 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <item.icon size={18} className="shrink-0" />
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 shrink-0" />
                </Link>
              ))}
            </nav>
          </div>

          {/* Engines */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">Engines (Core Services)</h2>
            <nav className="space-y-1">
              {[
                { icon: BookOpen, label: 'Tutorial Engine', color: 'text-pink-400' },
                { icon: ClipboardList, label: 'Exam Engine', color: 'text-orange-400' },
                { icon: Briefcase, label: 'Placement Engine', color: 'text-pink-400' },
                { icon: Users, label: 'Faculty Engine', color: 'text-orange-400' },
                { icon: Briefcase, label: 'Internship Engine', color: 'text-pink-400' }
              ].map((item, i) => (
                <Link key={i} href="#" className="flex items-center justify-between px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:ring-2 focus:ring-pink-500 outline-none">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-1 rounded bg-slate-800/50 shrink-0 ${item.color}`}><item.icon size={14} /></div>
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 shrink-0" />
                </Link>
              ))}
            </nav>
          </div>

          {/* Content Intelligence */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">Content Intelligence</h2>
            <nav className="space-y-1">
              {[
                { icon: FileText, label: 'Import Content', href: '/content-intelligence/import', color: 'text-pink-400' },
                { icon: Compass, label: 'Content Analysis', href: '/content-intelligence/analysis', color: 'text-pink-400' },
                { icon: Box, label: 'Block Suggestions', href: '/content-intelligence/block-suggestions', color: 'text-slate-400' },
                { icon: Layout, label: 'Presentation Ideas', href: '/content-intelligence/presentation-ideas', color: 'text-slate-400' },
                { icon: CheckSquare, label: 'Review & Approve', href: '/content-intelligence/review-approve', color: 'text-pink-400' },
                { icon: ShieldCheck, label: 'Quality Check', href: '/content-intelligence/quality-check', color: 'text-slate-400' },
              ].map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors focus:ring-2 focus:ring-pink-500 outline-none ${
                    pathname === item.href
                      ? 'bg-pink-900/30 text-pink-400 font-bold border border-pink-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-1 rounded bg-slate-800/50 shrink-0 ${item.color}`}><item.icon size={14} /></div>
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 shrink-0" />
                </Link>
              ))}
            </nav>
          </div>

          {/* Content Generation */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">Content Generation</h2>
            <nav className="space-y-1">
              {[
                { icon: LayoutGrid, label: 'Overview', href: '#' },
                { icon: FileText, label: 'Notes Generation', href: '#', color: 'text-orange-400' },
                { icon: Compass, label: 'Technical Generation', href: '#', color: 'text-pink-400' }
              ].map((item, i) => (
                <Link key={i} href={item.href} className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors focus:ring-2 focus:ring-pink-500 outline-none ${pathname === item.href ? 'bg-slate-800 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-1 rounded bg-slate-800/50 shrink-0 ${item.color || 'text-slate-400'}`}><item.icon size={14} /></div>
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 shrink-0" />
                </Link>
              ))}
            </nav>
          </div>
          
          {/* AI Content Workspace Tools */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">AI Content Workspace</h2>
            <nav className="space-y-1">
              {[
                { icon: Edit, label: 'Granular Content Manager', href: '/tools/content-manager', color: 'text-sky-400' }
              ].map((item, i) => (
                <Link key={i} href={item.href} className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors focus:ring-2 focus:ring-pink-500 outline-none ${pathname === item.href ? 'bg-slate-800 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-1 rounded bg-slate-800/50 shrink-0 ${item.color || 'text-slate-400'}`}><item.icon size={14} /></div>
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 shrink-0" />
                </Link>
              ))}
            </nav>
          </div>

          {/* Certificates */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">Certificates</h2>
            <nav className="space-y-1">
              {[
                { icon: Award, label: 'Certificate Generator', href: '/certificate-generator', color: 'text-emerald-400' },
                { icon: BadgeCheck, label: 'Certificate Preview', href: '/certificate-preview', color: 'text-sky-400' }
              ].map((item, i) => (
                <Link key={i} href={item.href} className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors focus:ring-2 focus:ring-pink-500 outline-none ${pathname === item.href ? 'bg-slate-800 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-1 rounded bg-slate-800/50 shrink-0 ${item.color}`}><item.icon size={14} /></div>
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 shrink-0" />
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Links */}
        <div className="p-4 space-y-2 mt-auto border-t border-slate-800 w-[280px]">
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-pink-500 hover:bg-slate-800 rounded-lg transition-colors">
            <GraduationCap size={20} className="shrink-0" />
            <span className="whitespace-nowrap">SkillUp IT Academy</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-orange-500 hover:bg-slate-800 rounded-lg transition-colors">
            <PlaySquare size={20} className="shrink-0" />
            <span className="whitespace-nowrap">Real Tutorial Hub (RTH)</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
