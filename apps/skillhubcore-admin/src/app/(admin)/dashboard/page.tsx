"use client";

import React, { useContext, useEffect } from 'react';
import { 
  Users, ClipboardList, BookOpen, Briefcase,
  ArrowUp, FileText, FileEdit, Bot, CheckCircle2, Archive,
  BookType, ClipboardCheck, UserCog
} from 'lucide-react';
import { ShellContext } from '../ShellContext';

export default function DashboardPage() {
  const { setHeaderTitle, setHeaderSubtitle } = useContext(ShellContext);

  useEffect(() => {
    setHeaderTitle('Admin Dashboard');
    setHeaderSubtitle("Here's what's happening across your educational ecosystem.");
    return () => {
      setHeaderTitle('');
      setHeaderSubtitle('');
    };
  }, [setHeaderSubtitle, setHeaderTitle]);

  return (
    <div className="space-y-8">
      


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
                <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 font-outfit tracking-tight">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-slate-500">
              <span className="flex items-center text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowUp size={14} className="mr-0.5" />
                {stat.increase}
              </span>
              <span>vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Core Engines & Services (Now full width) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 font-outfit">Core Engines & Services</h2>
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
              <h3 className="text-base font-bold text-slate-900 mb-2">{engine.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1 px-1">{engine.desc}</p>
              <div className="w-full flex items-center justify-between mt-auto">
                <div className="text-left">
                  <p className="text-base font-bold text-slate-900 leading-none">{engine.metric}</p>
                  <p className="text-sm text-slate-500 mt-1">{engine.metricLabel}</p>
                </div>
                <button className={`${engine.btnColor} text-white text-sm font-semibold px-4 py-1.5 rounded-md shadow-sm transition-colors`}>
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
          <h2 className="text-lg font-bold text-slate-800 font-outfit">Content Workflow</h2>
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
                    <item.icon size={20} className="text-slate-400" />
                    <span className="text-base font-medium">{item.label}</span>
                  </div>
                  <span className={`${item.bg} ${item.text} text-sm font-bold px-2.5 py-1 rounded-md`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content by Section (All Topics) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 font-outfit">Content by Section</h2>
          <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-2xl border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform cursor-pointer h-[calc(100%-2rem)] flex flex-col xl:flex-row items-center justify-center gap-6">
            <div className="relative w-36 h-36 shrink-0">
              <div className="w-full h-full rounded-full" style={{
                background: 'conic-gradient(#ec4899 0% 15%, #f97316 15% 30%, #eab308 30% 40%, #3b82f6 40% 55%, #14b8a6 55% 65%, #6366f1 65% 75%, #8b5cf6 75% 85%, #d946ef 85% 92%, #f43f5e 92% 100%)'
              }}></div>
              <div className="absolute inset-[25%] bg-white rounded-full flex flex-col items-center justify-center">
                <span className="text-sm text-slate-500 font-medium">Total</span>
                <span className="text-sm font-bold text-slate-900 leading-none mt-0.5">52,360</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm font-medium text-slate-600 w-full xl:w-auto">
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
                  <span className="text-slate-900 font-bold">6,842</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 font-outfit">Recent Activities</h2>
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
                    <activity.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-slate-800 leading-tight truncate">{activity.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{activity.desc}</p>
                  </div>
                  <div className="text-sm font-medium text-slate-400 shrink-0 whitespace-nowrap">{activity.time}</div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-center text-sm font-bold text-pink-600 hover:text-pink-700 transition-colors">
              View All Activities
            </button>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-slate-500 pb-4">
        <div>© 2025 SkillHubCore. All rights reserved.</div>
        <div>Version 1.0.0 &nbsp;|&nbsp; Build 2025.05.15</div>
      </footer>

      <style>{`
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
      `}</style>
    </div>
  );
}
