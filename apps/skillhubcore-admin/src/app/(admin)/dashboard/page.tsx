"use client";

import React, { useContext } from 'react';
import Link from 'next/link';
import { 
  Users, ClipboardList, BookOpen, Briefcase, Calendar, ChevronDown, 
  ArrowUp, Activity, FileText, FileEdit, Bot, CheckCircle2, Archive,
  Sparkles, Globe, LayoutList, BarChart3, LineChart, BookType,
  ClipboardCheck, UserCog, X
} from 'lucide-react';
import { ShellContext } from '../ClientShell';

export default function DashboardPage() {
  const { isRightSidebarOpen, toggleRightSidebar } = useContext(ShellContext);

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-8 custom-scrollbar">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-outfit tracking-tight">
              Welcome back, Super Admin! <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-slate-500 mt-1">Here's what's happening across your educational ecosystem.</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-lg shadow-sm cursor-pointer hover:border-slate-300 transition-colors">
            <Calendar size={18} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">15 May 2025, Thursday</span>
            <ChevronDown size={16} className="text-slate-400 ml-2" />
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: 'Total Users', value: '128,540', increase: '12.8%', icon: Users, color: 'bg-pink-500' },
            { label: 'Active Learners', value: '98,765', increase: '15.6%', icon: ClipboardCheck, color: 'bg-orange-500' },
            { label: 'Total Courses', value: '2,356', increase: '10.3%', icon: BookOpen, color: 'bg-pink-500' },
            { label: 'Exams Conducted', value: '1,245', increase: '11.2%', icon: ClipboardList, color: 'bg-orange-500' },
            { label: 'Placements', value: '3,542', increase: '14.7%', icon: Briefcase, color: 'bg-pink-500' },
            { label: 'Internships', value: '1,862', increase: '13.9%', icon: Briefcase, color: 'bg-orange-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-2xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 ${stat.color}`}>
                  <stat.icon size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                  <p className="text-xl font-bold text-slate-900 font-outfit tracking-tight">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <span className="flex items-center text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">
                  <ArrowUp size={12} className="mr-0.5" />
                  {stat.increase}
                </span>
                <span>vs last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Core Engines & Services (Now full width) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800 font-outfit">Core Engines & Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              { title: 'Tutorial Engine', desc: 'Manage all learning content and educational structure', metric: '2,356', metricLabel: 'Courses', btnColor: 'bg-pink-500 hover:bg-pink-600', icon: BookType, iconColor: 'text-pink-500' },
              { title: 'Exam Engine', desc: 'Create, manage and evaluate exams & assessments', metric: '1,245', metricLabel: 'Exams', btnColor: 'bg-orange-500 hover:bg-orange-600', icon: ClipboardList, iconColor: 'text-orange-500' },
              { title: 'Placement Engine', desc: 'Manage placements, drives and recruiter activities', metric: '3,542', metricLabel: 'Placements', btnColor: 'bg-pink-500 hover:bg-pink-600', icon: Briefcase, iconColor: 'text-pink-500' },
              { title: 'Faculty Engine', desc: 'Manage faculty, approvals, workload & access', metric: '428', metricLabel: 'Faculty', btnColor: 'bg-orange-500 hover:bg-orange-600', icon: UserCog, iconColor: 'text-orange-500' },
              { title: 'Internship Engine', desc: 'Manage internships, offers and student applications', metric: '1,862', metricLabel: 'Internships', btnColor: 'bg-pink-500 hover:bg-pink-600', icon: Briefcase, iconColor: 'text-pink-500' },
            ].map((engine, i) => (
              <div key={i} className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-2xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform cursor-pointer flex flex-col items-center text-center">
                <engine.icon size={36} className={`mb-4 ${engine.iconColor}`} />
                <h3 className="font-bold text-slate-900 mb-2">{engine.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-6 flex-1 px-1">{engine.desc}</p>
                <div className="w-full flex items-center justify-between mt-auto">
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 leading-none">{engine.metric}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{engine.metricLabel}</p>
                  </div>
                  <button className={`${engine.btnColor} text-white text-xs font-semibold px-4 py-1.5 rounded-md shadow-sm transition-colors`}>
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Content Workflow */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800 font-outfit">Content Workflow</h2>
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-2xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform cursor-pointer h-[calc(100%-2rem)]">
              <div className="space-y-5">
                {[
                  { label: 'Pending Review', value: '156', icon: FileText, bg: 'bg-pink-100', text: 'text-pink-600' },
                  { label: 'Draft Content', value: '320', icon: FileEdit, bg: 'bg-orange-100', text: 'text-orange-600' },
                  { label: 'AI Generated', value: '1,248', icon: Bot, bg: 'bg-pink-100', text: 'text-pink-600' },
                  { label: 'Published', value: '48,562', icon: CheckCircle2, bg: 'bg-emerald-100', text: 'text-emerald-600' },
                  { label: 'Archived', value: '74', icon: Archive, bg: 'bg-slate-100', text: 'text-slate-600' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-600">
                      <item.icon size={18} className="text-slate-400" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <span className={`${item.bg} ${item.text} text-xs font-bold px-2.5 py-1 rounded-md`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content by Section (All Topics) */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800 font-outfit">Content by Section</h2>
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-2xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform cursor-pointer h-[calc(100%-2rem)] flex flex-col xl:flex-row items-center justify-center gap-6">
              <div className="relative w-36 h-36 shrink-0">
                <div className="w-full h-full rounded-full" style={{
                  background: 'conic-gradient(#ec4899 0% 15%, #f97316 15% 30%, #eab308 30% 40%, #3b82f6 40% 55%, #14b8a6 55% 65%, #6366f1 65% 75%, #8b5cf6 75% 85%, #d946ef 85% 92%, #f43f5e 92% 100%)'
                }}></div>
                <div className="absolute inset-[25%] bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-500 font-medium">Total</span>
                  <span className="text-xs font-bold text-slate-900 leading-none mt-0.5">52,360</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-[11px] font-medium text-slate-600 w-full xl:w-auto">
                {[
                  { label: 'Layman', color: 'bg-pink-500' },
                  { label: 'Notes', color: 'bg-orange-500' },
                  { label: 'Visual Explanation', color: 'bg-red-500' },
                  { label: 'Real-Life', color: 'bg-blue-500' },
                  { label: 'Technical', color: 'bg-teal-500' },
                  { label: 'Code Examples', color: 'bg-indigo-500' },
                  { label: 'Practice Tasks', color: 'bg-purple-500' },
                  { label: 'Assignments', color: 'bg-fuchsia-500' },
                  { label: 'Projects', color: 'bg-rose-500' },
                  { label: 'Quiz', color: 'bg-yellow-500' },
                  { label: 'Summary', color: 'bg-orange-400' },
                  { label: 'Interview', color: 'bg-pink-400' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${item.color}`}></span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className="text-slate-900 font-semibold">6,842</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800 font-outfit">Recent Activities</h2>
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-2xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform cursor-pointer h-[calc(100%-2rem)] flex flex-col">
              <div className="space-y-5 flex-1">
                {[
                  { icon: BookOpen, title: "New course 'React Advanced Topics'", desc: "created under Frontend Development", time: "2 mins ago", color: "bg-pink-500" },
                  { icon: ClipboardList, title: "Exam 'JavaScript Fundamentals'", desc: "published successfully", time: "15 mins ago", color: "bg-orange-500" },
                  { icon: Briefcase, title: "New placement drive by TCS", desc: "added for B.Tech 2025 batch", time: "1 hour ago", color: "bg-pink-500" },
                  { icon: UserCog, title: "Faculty member 'John Doe'", desc: "approved and activated", time: "2 hours ago", color: "bg-orange-500" },
                  { icon: BookType, title: "AI generated content for 'Python Loops'", desc: "added and pending review", time: "3 hours ago", color: "bg-pink-500" },
                ].map((activity, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white ${activity.color} shadow-sm mt-0.5`}>
                      <activity.icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{activity.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{activity.desc}</p>
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 shrink-0 whitespace-nowrap">{activity.time}</div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-center text-xs font-bold text-pink-600 hover:text-pink-700 transition-colors">
                View All Activities
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500 pb-4">
          <div>© 2025 SkillHubCore. All rights reserved.</div>
          <div>Version 1.0.0 &nbsp;|&nbsp; Build 2025.05.15</div>
        </footer>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes wave {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg); }
            50% { transform: rotate(10deg); }
            75% { transform: rotate(-5deg); }
          }
          .animate-wave {
            transform-origin: 70% 70%;
            animation: wave 2s infinite ease-in-out;
          }
        `}} />
      </div>

      {/* Right Sidebar Backdrop */}
      {isRightSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-sm transition-opacity"
          onClick={() => toggleRightSidebar()}
        />
      )}

      {/* Right Sidebar Overlay */}
      <aside 
        className={`fixed top-0 right-0 bottom-0 z-50 w-[360px] bg-white border-l border-slate-200 shadow-2xl flex flex-col overflow-y-auto hide-scrollbar transition-transform duration-300 ${
          isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 backdrop-blur-xl">
          <h2 className="text-lg font-bold text-slate-900 font-outfit">Dashboard Tools</h2>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* System Overview */}
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
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-2xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform cursor-pointer grid grid-cols-3 gap-3">
              {[
                { label: 'Add New Course', icon: BookOpen, color: 'text-pink-500' },
                { label: 'Create New Exam', icon: ClipboardList, color: 'text-orange-500' },
                { label: 'Add Placement Drive', icon: Briefcase, color: 'text-pink-500' },
                { label: 'Add Internship', icon: Briefcase, color: 'text-orange-500' },
                { label: 'Manage Faculty', icon: UserCog, color: 'text-pink-500' },
                { label: 'AI Content Studio', icon: Sparkles, color: 'text-orange-500' },
                { label: 'Domain Manager', icon: Globe, color: 'text-pink-500' },
                { label: 'Subtopic Manager', icon: LayoutList, color: 'text-orange-500' },
                { label: 'Generate Report', icon: BarChart3, color: 'text-pink-500' },
              ].map((action, i) => (
                <button key={i} className="flex flex-col items-center justify-center text-center p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 bg-slate-50 group-hover:bg-white group-hover:shadow-sm transition-all ${action.color}`}>
                    <action.icon size={20} />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
