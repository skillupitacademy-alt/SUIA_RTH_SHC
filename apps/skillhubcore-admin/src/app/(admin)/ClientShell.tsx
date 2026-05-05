"use client";

import React, { useState, createContext, useContext, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Home, ShieldCheck, MessageSquare, Box, Settings, CheckSquare,
  BookOpen, ClipboardList, Briefcase, Users, Layout, FileText,
  UsersRound, Shield, Activity, HeartPulse, GraduationCap, PlaySquare,
  Menu, Search, Bell, Mail, HelpCircle, ChevronRight, Network, PanelRight,
  Download, Sparkles, History, CheckCircle2, BarChart3, Star, LineChart,
  UserCog, LayoutGrid, Cpu, Compass, Globe, LayoutList
} from 'lucide-react';
import { usePathname } from 'next/navigation';

export const ShellContext = createContext({
  isRightSidebarOpen: true,
  toggleRightSidebar: () => { }
});

export default function ClientShell({ children }: { children: ReactNode }) {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <ShellContext.Provider value={{ isRightSidebarOpen, toggleRightSidebar: () => setIsRightSidebarOpen(!isRightSidebarOpen) }}>
      <div className="flex h-screen bg-[#f4f7fa] font-sans text-slate-800 overflow-hidden relative w-full">

        {/* Skip to Content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] bg-pink-600 text-white px-4 py-2 rounded-lg font-bold shadow-xl"
        >
          Skip to Content
        </a>

        {/* Left Sidebar Backdrop */}
        {isLeftSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsLeftSidebarOpen(false)}
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
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5 whitespace-nowrap">Admin Dashboard</p>
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
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">Governance & Core</h2>
              <nav className="space-y-1">
                {[
                  { icon: ShieldCheck, label: 'Constitutional Center' },
                  { icon: MessageSquare, label: 'Prompt Governance' },
                  { icon: Box, label: 'Architecture Governance' },
                  { icon: Settings, label: 'Brand & Deployment' },
                  { icon: Settings, label: 'System Settings' },
                  { icon: CheckSquare, label: 'Audit & Compliance' }
                ].map((item, i) => (
                  <Link key={i} href="#" className="flex items-center justify-between px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:ring-2 focus:ring-pink-500 outline-none">
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
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">Engines (Core Services)</h2>
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

            {/* Content Generation */}
            <div>
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">Content Generation</h2>
              <nav className="space-y-1">
                {[
                  { icon: LayoutGrid, label: 'Overview', href: '#' },
                  { icon: Cpu, label: 'Layman Generation', href: '/content-generation/layman', color: 'text-pink-400' },
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

            {/* Platform Management */}
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

        {/* Main Content (Full Width since sidebars are overlays) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
          {/* Header */}
          <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm transition-all">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-lg hover:bg-slate-100 focus:ring-2 focus:ring-pink-500 outline-none"
                aria-label="Toggle Left Sidebar"
              >
                <Menu size={20} />
              </button>
              <div className="font-outfit text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500">
                SkillHubCore
              </div>
              <div className="relative hidden md:block w-96 ml-4">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                  aria-label="Search platform"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                className="relative text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                aria-label="View notifications"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[9px] font-bold text-white border border-white">12</span>
              </button>
              <button
                className="relative text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                aria-label="View messages"
              >
                <Mail size={20} />
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[9px] font-bold text-white border border-white">8</span>
              </button>
              <button
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                aria-label="Get help"
              >
                <HelpCircle size={20} />
              </button>

              {/* Right Sidebar Toggle */}
              <button
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className={`transition-colors p-2 rounded-lg border focus:ring-2 focus:ring-pink-500 outline-none ${isRightSidebarOpen ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-100'}`}
                aria-label="Toggle Dashboard Tools"
                title="Toggle Right Sidebar"
              >
                <PanelRight size={20} />
              </button>

              <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
              <button className="flex items-center gap-3 text-left pl-1">
                <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden border border-slate-200 shrink-0">
                  <img src="https://i.pravatar.cc/150?u=superadmin" alt="Super Admin" className="h-full w-full object-cover" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-slate-800 leading-none">Super Admin</p>
                  <p className="text-xs text-slate-500 mt-1">Administrator</p>
                </div>
              </button>
            </div>
          </header>

          {/* Page Content Container */}
          <main id="main-content" className="flex-1 overflow-y-auto bg-[#f4f7fa] custom-scrollbar focus:outline-none" tabIndex={-1}>
            <div className="max-w-[1600px] mx-auto p-6 md:p-8">
              {children}
            </div>
          </main>
        </div>

        {/* Right Sidebar Backdrop */}
        {isRightSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-sm transition-opacity"
            onClick={() => setIsRightSidebarOpen(false)}
          />
        )}

        {/* Right Sidebar Overlay */}
        <aside
          className={`fixed top-0 right-0 bottom-0 z-50 w-[360px] bg-white border-l border-slate-200 shadow-2xl flex flex-col overflow-y-auto hide-scrollbar transition-transform duration-300 ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-slate-900 font-outfit">Dashboard Tools</h2>
          </div>

          <div className="p-6 space-y-8 flex-1">
            {/* Conditional Widgets for Layman Generation & Architecture */}
            {(pathname === '/content-generation/layman' || pathname === '/content-generation/layman-architecture') && (
              <>
                {/* Generation Overview */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 font-outfit">Generation Overview</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Today</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Prompts", value: "12", change: "+33%", color: "text-emerald-500" },
                      { label: "AI Drafts", value: "18", change: "+25%", color: "text-emerald-500" },
                      { label: "Approved", value: "9", change: "+28%", color: "text-emerald-500" },
                      { label: "Published", value: "6", change: "+20%", color: "text-emerald-500" },
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold text-slate-900">{stat.value}</span>
                          <span className={`text-[8px] font-bold ${stat.color}`}>{stat.change}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Workflow Status */}
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 font-outfit">Workflow Status</h3>
                  <div className="relative pt-2 pb-2 px-1">
                    <div className="absolute top-[18px] left-0 w-full h-[2px] bg-slate-100"></div>
                    <div className="absolute top-[18px] left-0 w-[75%] h-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500"></div>
                    <div className="flex justify-between relative">
                      {[
                        { label: "Draft", color: "bg-pink-500" },
                        { label: "Review", color: "bg-purple-500" },
                        { label: "Approve", color: "bg-orange-500" },
                        { label: "Pub", color: "bg-slate-200" }
                      ].map((step, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${step.color}`}></div>
                          <p className="text-[9px] font-bold text-slate-500">{step.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Layman Prompt Exports */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 font-outfit">Prompt Exports</h3>
                    <button className="text-[10px] font-bold text-pink-600 hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "js-basics_prompt.txt", time: "2 mins ago" },
                      { name: "variables_prompt.txt", time: "15 mins ago" },
                      { name: "functions_prompt.json", time: "1 hour ago" },
                    ].map((file, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors group cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-slate-700 truncate">{file.name}</p>
                          <p className="text-[9px] text-slate-400 font-medium">{file.time}</p>
                        </div>
                        <Download size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Default Dashboard Tools (Visible on other pages) */}
            {pathname !== '/content-generation/layman' && pathname !== '/content-generation/layman-architecture' && (
              <>
                {/* Platform Status */}
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-slate-800 font-outfit">System Overview</h2>
                  <div className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-2xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform cursor-pointer">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                      <span className="text-sm font-semibold text-slate-700">Platform Status</span>
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">All Systems Operational</span>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: 'Uptime', value: '99.98%' },
                        { label: 'Total Domains', value: '24' },
                        { label: 'Total Subtopics', value: '6,842' },
                        { label: 'Content Items', value: '52,360' },
                        { label: 'AI Generated Content', value: '18,752' },
                      ].map((stat, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">{stat.label}</span>
                          <span className="text-sm font-bold text-slate-900">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-6 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-pink-100 bg-pink-50 text-pink-600 text-sm font-semibold hover:bg-pink-100 transition-colors">
                      <LineChart size={18} />
                      View System Health
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-slate-800 font-outfit">Quick Actions</h2>

                  {/* SVG Gradients for Icons */}
                  <svg width="0" height="0" className="absolute">
                    <defs>
                      <linearGradient id="icon-pink-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#be185d" />
                      </linearGradient>
                      <linearGradient id="icon-orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Add New Course', icon: BookOpen, grad: 'url(#icon-pink-grad)' },
                      { label: 'Create New Exam', icon: ClipboardList, grad: 'url(#icon-orange-grad)' },
                      { label: 'Add Placement Drive', icon: Briefcase, grad: 'url(#icon-pink-grad)' },
                      { label: 'Add Internship', icon: Briefcase, grad: 'url(#icon-orange-grad)' },
                      { label: 'Manage Faculty', icon: UserCog, grad: 'url(#icon-pink-grad)' },
                      { label: 'AI Content Studio', icon: Sparkles, grad: 'url(#icon-orange-grad)' },
                      { label: 'Domain Manager', icon: Globe, grad: 'url(#icon-pink-grad)' },
                      { label: 'Subtopic Manager', icon: LayoutList, grad: 'url(#icon-orange-grad)' },
                      { label: 'Generate Report', icon: BarChart3, grad: 'url(#icon-pink-grad)' },
                    ].map((action, i) => (
                      <button
                        key={i}
                        className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"
                      >
                        <div className="mb-3 transition-transform duration-300 group-hover:scale-110">
                          <action.icon
                            size={32}
                            style={{ stroke: action.grad }}
                            strokeWidth={2.5}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 leading-tight group-hover:text-slate-900 transition-colors">
                          {action.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>


        <style dangerouslySetInnerHTML={{
          __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.3);
            border-radius: 20px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.5);
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}} />
      </div>
    </ShellContext.Provider>
  );
}
