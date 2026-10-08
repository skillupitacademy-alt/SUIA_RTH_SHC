'use client';

import React from 'react';
import {
  FileText, Download, Copy, FileDown, FileUp, Globe, History, XCircle, Trash2,
  LineChart, BookOpen, ClipboardList, Briefcase, UserCog, LayoutList,
  BarChart3, Layout, Sparkles
} from 'lucide-react';

interface RightSidebarProps {
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: (open: boolean) => void;
  rightSidebarContent: React.ReactNode;
  rightSidebarWidth: string;
}

export function RightSidebar({
  isRightSidebarOpen,
  setIsRightSidebarOpen,
  rightSidebarContent,
  rightSidebarWidth,
}: RightSidebarProps) {
  return (
    <>
      {/* Right Sidebar Backdrop */}
      {isRightSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-sm transition-opacity w-full h-full border-none p-0 m-0"
          onClick={() => setIsRightSidebarOpen(false)}
          aria-label="Close Right Sidebar"
        />
      )}

      {/* Right Sidebar Overlay */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 bg-white border-l border-slate-200 shadow-2xl flex flex-col overflow-y-auto hide-scrollbar transition-transform duration-300 ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        style={{ width: rightSidebarWidth || '360px' }}
      >
        {rightSidebarContent ? (
          rightSidebarContent
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-slate-900 font-outfit">Dashboard Tools</h2>
            </div>

            <div className="p-6 space-y-8 flex-1">
              {/* Conditional Widgets for Generation & Architecture */}
              {false && (
                <>
                  {/* Generation Overview */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 font-outfit">Generation Overview</h3>
                      <span className="text-xs font-bold text-slate-400 uppercase">Today</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Prompts", value: "12", change: "+33%", color: "text-emerald-500" },
                        { label: "AI Drafts", value: "18", change: "+25%", color: "text-emerald-500" },
                        { label: "Approved", value: "9", change: "+28%", color: "text-emerald-500" },
                        { label: "Published", value: "6", change: "+20%", color: "text-emerald-500" },
                      ].map((stat, i) => (
                        <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase">{stat.label}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-bold text-slate-900">{stat.value}</span>
                            <span className={`text-xs font-bold ${stat.color}`}>{stat.change}</span>
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
                            <p className="text-xs font-bold text-slate-500">{step.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Layman Prompt Exports */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 font-outfit">Prompt Exports</h3>
                      <button className="text-xs font-bold text-pink-600 hover:underline">View All</button>
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

              {/* Specialized Widgets for Architecture */}
              {false && (
                <>
                  {/* Architecture Overview */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 font-outfit">Architecture Overview</h3>
                      <span className="text-pink-600 font-black text-xs">v2.1</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                      {[
                        { label: 'Architecture Name', value: 'Beginner First Universal Model' },
                        { label: 'Applied Domains', value: '9 Domains' },
                        { label: 'Total Components', value: '8 Universal Components' },
                        { label: 'Total Adaptation Packs', value: '6 Packs' },
                        { label: 'Renderer Mappings', value: '18 Mappings' },
                        { label: 'Learner Psychology', value: 'Beginner Confidence Model' },
                        { label: 'Status', value: 'Active', isStatus: true },
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-400">{row.label}</span>
                          {row.isStatus ? (
                            <span className="text-emerald-500 font-bold">Active</span>
                          ) : (
                            <span className="font-bold text-slate-700 text-right">{row.value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Renderer Mapping Engine */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 font-outfit">Renderer Mapping Engine</h3>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
                      <div className="flex justify-between text-xs font-black text-slate-400 uppercase px-1">
                        <span>Subsection</span>
                        <span>Renderer</span>
                      </div>
                      {[
                        { type: 'Simple Overview', renderer: 'Text + Icon Card' },
                        { type: 'Everyday Analogy', renderer: 'Analogy Card' },
                        { type: 'Why It Exists', renderer: 'Benefit Card' },
                        { type: 'Simple Use Cases', renderer: 'Use Case Grid' },
                        { type: 'Beginner Breakdown', renderer: 'Accordion List' },
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-50/50 p-2 rounded-lg text-xs font-bold">
                          <span className="text-slate-600">{row.type}</span>
                          <span className="text-slate-900">{row.renderer}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Quick Actions */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 font-outfit">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Clone Architecture', icon: Copy, color: 'text-purple-600', border: 'border-purple-100', bg: 'bg-purple-50/50' },
                        { label: 'Export Architecture', icon: FileDown, color: 'text-pink-600', border: 'border-pink-100', bg: 'bg-pink-50/50' },
                        { label: 'Import Architecture', icon: FileUp, color: 'text-orange-600', border: 'border-orange-100', bg: 'bg-orange-50/50' },
                        { label: 'Preview Full Layman', icon: Layout, color: 'text-blue-600', border: 'border-blue-100', bg: 'bg-blue-50/50' },
                        { label: 'Apply to Domain', icon: Globe, color: 'text-emerald-600', border: 'border-emerald-100', bg: 'bg-emerald-50/50' },
                        { label: 'Create New Version', icon: History, color: 'text-indigo-600', border: 'border-indigo-100', bg: 'bg-indigo-50/50' },
                        { label: 'Deactivate', icon: XCircle, color: 'text-rose-600', border: 'border-rose-100', bg: 'bg-rose-50/50' },
                        { label: 'Delete Architecture', icon: Trash2, color: 'text-slate-600', border: 'border-slate-100', bg: 'bg-slate-50/50' },
                      ].map((action, i) => (
                        <button
                          key={i}
                          className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border ${action.border} ${action.bg} ${action.color} transition-all hover:scale-[1.02] active:scale-95 group text-center shadow-sm`}
                        >
                          <action.icon size={18} className="shrink-0" />
                          <span className="text-[10px] font-bold leading-tight">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Beginner Psychology Model */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 font-outfit">Beginner Psychology Model</h3>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                      {[
                        { label: 'Fear Reduction', value: 'High', color: 'bg-blue-500' },
                        { label: 'Clarity Focus', value: 'Very High', color: 'bg-emerald-500' },
                        { label: 'Analogy Usage', value: 'High', color: 'bg-orange-500' },
                        { label: 'Real World Connection', value: 'High', color: 'bg-indigo-500' },
                        { label: 'Cognitive Load', value: 'Low', color: 'bg-pink-500' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.color}`}></div>
                            <span className="text-slate-600">{item.label}</span>
                          </div>
                          <span className={item.value === 'Low' ? 'text-pink-600' : 'text-emerald-600'}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* Default Dashboard Tools (Visible on other pages) */}
              {true && (
                <>
                  {/* Platform Status */}
                  <div className="space-y-4">
                    <h2 className="text-base font-bold text-slate-800 font-outfit">System Overview</h2>
                    <div className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-2xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform cursor-pointer">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                        <span className="text-sm font-semibold text-slate-700">Platform Status</span>
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">All Systems Operational</span>
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
                          <span className="text-xs font-bold text-slate-700 leading-tight group-hover:text-slate-900 transition-colors">
                            {action.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
