"use client";

import React, { useState, createContext, useContext, type ReactNode } from 'react';
import Link from 'next/link';
import { 
  Home, ShieldCheck, MessageSquare, Box, Settings, CheckSquare, 
  BookOpen, ClipboardList, Briefcase, Users, Layout, FileText, 
  UsersRound, Shield, Activity, HeartPulse, GraduationCap, PlaySquare,
  Menu, Search, Bell, Mail, HelpCircle, ChevronRight, Network, PanelRight
} from 'lucide-react';

export const ShellContext = createContext({
  isRightSidebarOpen: true,
  toggleRightSidebar: () => {}
});

export default function ClientShell({ children }: { children: ReactNode }) {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  return (
    <ShellContext.Provider value={{ isRightSidebarOpen, toggleRightSidebar: () => setIsRightSidebarOpen(!isRightSidebarOpen) }}>
      <div className="flex h-screen bg-[#f4f7fa] font-sans text-slate-800 overflow-hidden relative w-full">
        
        {/* Left Sidebar Backdrop */}
        {isLeftSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsLeftSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar (Overlay) */}
        <aside 
          className={`fixed top-0 left-0 bottom-0 z-50 bg-[#111827] text-slate-300 flex flex-col w-[280px] overflow-y-auto hide-scrollbar transition-transform duration-300 shadow-2xl ${
            isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">Governance & Core</h2>
              <nav className="space-y-1">
                {[
                  { icon: ShieldCheck, label: 'Constitutional Center' },
                  { icon: MessageSquare, label: 'Prompt Governance' },
                  { icon: Box, label: 'Architecture Governance' },
                  { icon: Settings, label: 'Brand & Deployment' },
                  { icon: Settings, label: 'System Settings' },
                  { icon: CheckSquare, label: 'Audit & Compliance' }
                ].map((item, i) => (
                  <Link key={i} href="#" className="flex items-center justify-between px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
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
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">Engines (Core Services)</h2>
              <nav className="space-y-1">
                {[
                  { icon: BookOpen, label: 'Tutorial Engine', color: 'text-pink-500' },
                  { icon: ClipboardList, label: 'Exam Engine', color: 'text-orange-500' },
                  { icon: Briefcase, label: 'Placement Engine', color: 'text-pink-500' },
                  { icon: Users, label: 'Faculty Engine', color: 'text-orange-500' },
                  { icon: Briefcase, label: 'Internship Engine', color: 'text-pink-500' }
                ].map((item, i) => (
                  <Link key={i} href="#" className="flex items-center justify-between px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-1 rounded bg-slate-800/50 shrink-0 ${item.color}`}><item.icon size={14} /></div>
                      <span className="whitespace-nowrap truncate">{item.label}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-500 shrink-0" />
                  </Link>
                ))}
              </nav>
            </div>

            {/* Platform Management */}
            <div>
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">Platform Management</h2>
              <nav className="space-y-1">
                {[
                  { icon: Layout, label: 'Domains & Subtopics' },
                  { icon: FileText, label: 'Content Management' },
                  { icon: UsersRound, label: 'Users & Roles' },
                  { icon: Shield, label: 'Teams & Permissions' },
                  { icon: Activity, label: 'Activity Logs' },
                  { icon: HeartPulse, label: 'System Health' }
                ].map((item, i) => (
                  <Link key={i} href="#" className="flex items-center justify-between px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <item.icon size={18} className="shrink-0" />
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

        {/* Main Content (Full Width since sidebars are overlays) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
          {/* Header */}
          <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm transition-all">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-lg hover:bg-slate-100"
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
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-lg">
                <Bell size={20} />
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[9px] font-bold text-white border border-white">12</span>
              </button>
              <button className="relative text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-lg">
                <Mail size={20} />
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[9px] font-bold text-white border border-white">8</span>
              </button>
              <button className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-lg">
                <HelpCircle size={20} />
              </button>
              
              {/* Right Sidebar Toggle */}
              <button 
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className={`transition-colors p-2 rounded-lg border ${isRightSidebarOpen ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-100'}`}
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
          <main className="flex-1 overflow-hidden bg-[#f8fafc] flex relative">
            {children}
          </main>
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
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
