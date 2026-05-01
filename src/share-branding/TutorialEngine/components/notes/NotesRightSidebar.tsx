import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

export function NotesRightSidebar({ data, isOpen, activeTab }: { data: SubtopicNotesViewData['rightSidebar']; isOpen: boolean; activeTab: string }) {
  const brand = useBrand();

  return (
    <aside 
      aria-label="Tools and statistics sidebar" 
      className={`absolute bottom-0 right-0 top-0 z-40 flex w-[350px] flex-col overflow-y-auto bg-white p-5 hide-scrollbar transition-transform duration-300 ${isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-none'} border border-slate-200`}
      tabIndex={0}
      role="region"
    >
      <div className="space-y-6">
        
        {/* Assignment Sidebar Content */}
        {activeTab === 'assignments' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* Assignment Info */}
            <section className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-6">
                <Icons.CalendarCheck size={18} className="text-rose-500" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Assignment Info</h2>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Difficulty', value: <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase">Medium</span> },
                  { label: 'Type', value: 'Practical' },
                  { label: 'Points', value: '+30 XP' },
                  { label: 'Submissions', value: '1 allowed' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px] font-bold pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Deadline */}
            <section className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-4">
                <Icons.Clock size={18} className="text-orange-500" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Deadline</h2>
              </div>
              <div className="space-y-3">
                <p className="text-[14px] font-black text-slate-800">29 Apr 2026, 11:59 PM</p>
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[10px] font-black text-rose-600 border border-rose-100">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  5d 14h 32m left
                </div>
              </div>
            </section>

            {/* Rewards */}
            <section className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-6">
                <Icons.Trophy size={18} className="text-amber-500" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Rewards</h2>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'XP Points', value: '+30 XP' },
                  { label: 'Streak Bonus', value: '+5 XP' },
                  { label: 'Badges', value: <span className="flex items-center gap-1"><Icons.Shield size={12} className="text-orange-500" /> Component Pro</span> }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px] font-bold">
                    <span className="flex items-center gap-2 text-slate-600"><Icons.CheckCircle2 size={14} className="text-orange-500" fill="currentColor" /> {item.label}</span>
                    <span className="text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Submit Assignment */}
            <section className="rounded-3xl bg-white p-6 shadow-xl space-y-6 border border-slate-200 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2">
                <Icons.UploadCloud size={18} className="text-primary-dark" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Submit Assignment</h2>
              </div>
              <div className="rounded-[24px] border-2 border-dashed border-rose-100 bg-rose-50/20 p-8 flex flex-col items-center justify-center gap-3 text-center transition-all hover:bg-rose-50 hover:border-rose-300 cursor-pointer group">
                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-rose-100 group-hover:scale-110 transition-transform">
                    <Icons.CloudUpload size={24} className="text-slate-400 group-hover:text-rose-500" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[12px] font-black text-slate-700">Upload your code file</p>
                    <p className="text-[10px] font-bold text-slate-400">.js, .ts (max 50KB)</p>
                 </div>
              </div>
              <button 
                className="w-full rounded-2xl py-4 text-sm font-black text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.primaryColor}dd)` }}
              >
                Submit Assignment
              </button>
              <p className="text-[10px] font-bold text-slate-400 text-center">You can submit only once</p>
            </section>

            {/* AI Hint Card */}
            <section className="rounded-[32px] bg-rose-50/50 p-8 space-y-6 relative overflow-hidden group border border-slate-200 shadow-xl transition-all duration-300 hover:-translate-y-1">
               <div className="flex items-center gap-3 relative z-10">
                  <Icons.Zap size={18} className="text-rose-500" fill="currentColor" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">AI Hint</h3>
               </div>
               <p className="text-[12px] font-bold text-slate-600 leading-relaxed relative z-10">
                 Stuck? Get a smart hint from AI Tutor without revealing the full solution.
               </p>
               <button className="flex items-center justify-between w-full rounded-2xl bg-[#ec4899] p-4 text-white shadow-lg transition-all hover:bg-[#db2777] active:scale-95 group">
                  <span className="text-xs font-black uppercase tracking-wider">Ask AI Tutor</span>
                  <Icons.ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </button>
               {/* Robot illustration placeholder */}
               <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Icons.Cpu size={120} className="text-rose-500" />
               </div>
            </section>

            {/* Helpful Resources */}
            <section className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200 transition-all duration-300 hover:-translate-y-1">
               <div className="flex items-center gap-2 mb-6">
                  <Icons.Link size={18} className="text-orange-600" />
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Helpful Resources</h2>
               </div>
               <div className="space-y-4">
                  {[
                    { label: 'Architecture Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules' },
                    { label: 'React Props Documentation', url: 'https://react.dev/learn/passing-props-to-a-component' },
                    { label: 'Modular Design Patterns', url: 'https://patterns.dev' }
                  ].map((res, i) => (
                    <a 
                      key={i} 
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full text-[12px] font-black text-orange-600 hover:text-orange-700 transition-colors group"
                    >
                       {res.label} <Icons.ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                  ))}
               </div>
            </section>
          </div>
        )}

        {/* Project Sidebar Content */}
        {activeTab === 'project' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* Your Progress */}
            <section className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Your Progress</h2>
              </div>
              <div className="flex items-center gap-6">
                 <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[4px] border-rose-50">
                    <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle
                        className="transition-all duration-1000 ease-out text-rose-500"
                        strokeWidth="8"
                        strokeDasharray={289}
                        strokeDashoffset={289 - (289 * 60) / 100}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="46"
                        cx="50"
                        cy="50"
                      />
                    </svg>
                    <div className="text-center">
                       <span className="text-sm font-black text-gray-900">60%</span>
                       <p className="text-[8px] font-bold text-slate-400 uppercase">Completed</p>
                    </div>
                 </div>
                 <div className="space-y-2 flex-1">
                    {[
                      { label: 'Read Instructions', done: true },
                      { label: 'Code Implementation', done: true },
                      { label: 'Test & Debug', done: false },
                      { label: 'Submit Project', done: false }
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] font-bold">
                         <div className={`h-1.5 w-1.5 rounded-full ${step.done ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                         <span className={step.done ? 'text-slate-600' : 'text-slate-400'}>{step.label}</span>
                         {step.done && <Icons.Check size={10} className="text-emerald-500 ml-auto" />}
                      </div>
                    ))}
                 </div>
              </div>
            </section>

            {/* Project Info */}
            <section className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-6">
                <Icons.Calendar size={18} className="text-rose-500" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Project Info</h2>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Difficulty', value: <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase">Intermediate</span> },
                  { label: 'Estimated Time', value: '5-7 hrs' },
                  { label: 'XP Reward', value: '+400 XP' },
                  { label: 'Submissions', value: '2 allowed' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px] font-bold pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Deadline */}
            <section className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-4">
                <Icons.Clock size={18} className="text-orange-500" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Deadline</h2>
              </div>
              <div className="space-y-3">
                <p className="text-[14px] font-black text-slate-800">30 Apr 2026, 11:59 PM</p>
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[10px] font-black text-rose-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  6d 14h 32m left
                </div>
              </div>
            </section>

            {/* Submit Project */}
            <section className="rounded-3xl bg-white p-6 shadow-xl space-y-6 border border-slate-200 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2">
                <Icons.UploadCloud size={18} className="text-primary-dark" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Submit Your Project</h2>
              </div>
              <div className="space-y-2">
                 <p className="text-[11px] font-bold text-slate-500">Upload your project files (.zip)</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Max size: 50MB</p>
              </div>
              <button 
                className="w-full rounded-2xl py-4 text-sm font-black text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.primaryColor}dd)` }}
              >
                Upload & Submit
              </button>
              <p className="text-[10px] font-bold text-slate-400 text-center">You can submit 2 more times</p>
            </section>

            {/* Need Help? */}
            <section className="rounded-[32px] bg-rose-50/50 p-8 space-y-6 relative overflow-hidden group border border-slate-200">
               <div className="flex items-center gap-3 relative z-10">
                  <Icons.HeartPulse size={18} className="text-rose-500" fill="currentColor" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Need Help?</h3>
               </div>
               <p className="text-[12px] font-bold text-slate-600 leading-relaxed relative z-10">
                 Ask AI Tutor or connect with your mentor for personalized guidance.
               </p>
               <div className="grid grid-cols-2 gap-2 relative z-10">
                  <button className="flex items-center justify-center gap-2 rounded-xl bg-[#ec4899] py-3 px-2 text-white shadow-lg transition-all hover:bg-[#db2777] active:scale-95">
                     <span className="text-[10px] font-black uppercase tracking-wider">Ask AI Tutor</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 px-2 text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 border border-slate-200">
                     <span className="text-[10px] font-black uppercase tracking-wider">Contact Mentor</span>
                  </button>
               </div>
               {/* Illustration */}
               <div className="absolute -right-2 -bottom-2 opacity-20 transform rotate-12">
                  <Icons.Bot size={80} className="text-rose-500" />
               </div>
            </section>

            {/* Badge */}
            <section className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200 flex flex-col items-center text-center space-y-4 transition-all duration-300 hover:-translate-y-1">
               <div className="flex items-center gap-2 w-full">
                  <Icons.Award size={18} className="text-purple-500" />
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Badge You'll Earn</h2>
               </div>
               <div className="relative">
                  <div className="h-24 w-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-200">
                     <Icons.Star size={40} className="text-amber-400" fill="currentColor" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center border border-purple-100">
                     <Icons.Lock size={12} className="text-purple-400" />
                  </div>
               </div>
               <div>
                  <h4 className="text-sm font-black text-slate-800">User Management Pro</h4>
                  <p className="text-[10px] font-bold text-slate-400">Complete this project to unlock</p>
               </div>
            </section>
          </div>
        )}

        {/* Quiz Sidebar Content */}
        {activeTab === 'quiz' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* Time Left */}
            <section className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200 flex flex-col items-center transition-all duration-300 hover:-translate-y-1">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 w-full text-left">Time Left</h2>
              <div className="relative h-32 w-32 flex items-center justify-center">
                 <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle className="text-slate-100" strokeWidth="6" stroke="currentColor" fill="transparent" r="44" cx="50" cy="50" />
                    <circle
                      className="transition-all duration-1000 ease-out text-rose-500"
                      strokeWidth="8"
                      strokeDasharray={276}
                      strokeDashoffset={276 - (276 * 68) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="44"
                      cx="50"
                      cy="50"
                    />
                 </svg>
                 <div className="text-center">
                    <span className="text-xl font-black text-slate-800">10:24</span>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">min : sec</p>
                 </div>
              </div>
            </section>

            {/* Question Navigator */}
            <section className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-6 transition-all duration-300 hover:-translate-y-1">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Question Navigator</h2>
              <div className="grid grid-cols-4 gap-2 text-[7px] font-black uppercase tracking-tighter">
                 <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Answered</div>
                 <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Current</div>
                 <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Marked</div>
                 <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-slate-200" /> Unanswered</div>
              </div>
              <div className="grid grid-cols-5 gap-3">
                 {[
                   { id: 1, status: 'answered' },
                   { id: 2, status: 'answered' },
                   { id: 3, status: 'answered' },
                   { id: 4, status: 'current' },
                   { id: 5, status: 'unanswered' },
                   { id: 6, status: 'marked' },
                   { id: 7, status: 'answered' },
                   { id: 8, status: 'unanswered' },
                   { id: 9, status: 'unanswered' },
                   { id: 10, status: 'unanswered' },
                 ].map((q) => (
                   <div 
                     key={q.id} 
                     className={`flex h-10 items-center justify-center rounded-xl text-sm font-black transition-all border ${
                       q.status === 'answered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                       q.status === 'current' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100 border-slate-200' :
                       q.status === 'marked' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                       'bg-white text-slate-400 border-slate-100'
                     }`}
                   >
                     {q.id}
                   </div>
                 ))}
              </div>
            </section>

            {/* AI Study Assistant */}
            <section className="rounded-[32px] bg-gradient-to-br from-rose-50 to-white p-8 space-y-6 relative overflow-hidden group border border-slate-200 shadow-xl transition-all duration-300 hover:-translate-y-1">
               <div className="flex items-center justify-between relative z-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm text-primary-dark">
                     <Icons.Bot size={22} />
                  </div>
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[8px] font-black uppercase text-rose-600">Beta</span>
               </div>
               <div className="space-y-2 relative z-10">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">AI Study Assistant</h3>
                  <p className="text-[12px] font-bold text-slate-600 leading-relaxed">
                    Need help on this topic? Our AI Tutor can explain Concepts, give hints, or solve doubts.
                  </p>
               </div>
               <button 
                 className="flex w-full items-center justify-between rounded-2xl p-4 text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                 style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.primaryColor}dd)` }}
               >
                  <span className="text-[11px] font-black uppercase tracking-wider">Ask AI Tutor</span>
                  <Icons.ArrowRight size={18} />
               </button>
            </section>

            {/* Performance Snapshot */}
            <section className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-6 transition-all duration-300 hover:-translate-y-1">
               <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Performance Snapshot</h2>
               <div className="flex items-center gap-6">
                  <div className="relative h-24 w-24 flex items-center justify-center">
                     <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                        <circle className="text-slate-50" strokeWidth="8" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
                        <circle
                          className="transition-all duration-1000 ease-out text-emerald-500"
                          strokeWidth="10"
                          strokeDasharray={264}
                          strokeDashoffset={264 - (264 * 72) / 100}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="42"
                          cx="50"
                          cy="50"
                        />
                     </svg>
                     <div className="text-center">
                        <span className="text-lg font-black text-slate-800">72%</span>
                        <p className="text-[6px] font-bold text-slate-400 uppercase leading-none">Overall Accuracy</p>
                     </div>
                  </div>
                  <div className="flex-1 space-y-3">
                     {[
                       { label: 'Correct', value: 13, color: 'text-emerald-500' },
                       { label: 'Incorrect', value: 5, color: 'text-rose-500' },
                       { label: 'Unattempted', value: 2, color: 'text-slate-400' }
                     ].map((stat, i) => (
                       <div key={i} className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">{stat.label}</span>
                          <span className={stat.color}>{stat.value}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </section>

            {/* Struggling Link */}
            <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 flex items-center gap-4 group cursor-pointer hover:bg-slate-50 transition-colors">
               <div className="flex-1 space-y-1">
                  <h3 className="text-[12px] font-black text-slate-800">Struggling with this topic?</h3>
                  <p className="text-[10px] font-bold text-slate-500">Review weak areas and get a personalized study plan.</p>
                  <div className="flex items-center gap-1.5 pt-2 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                     View Weak Topics <Icons.ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
               </div>
               <div className="relative h-16 w-16 transform transition-transform group-hover:scale-110 group-hover:rotate-6">
                  <Icons.Target size={48} className="text-rose-500/20" />
                  <Icons.Target size={32} className="absolute inset-0 m-auto text-rose-500" />
               </div>
            </section>
          </div>
        )}

        {/* Code Example Sidebar Content */}
        {activeTab === 'code-example' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* Code Explanation */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-4">
                <Icons.Lightbulb size={18} className="text-amber-500" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Code Explanation</h2>
              </div>
              <ol className="space-y-4">
                {[
                  'We create a functional component UserProfile that receives props.',
                  'The component returns a JSX structure with dynamic name and role.',
                  'We render the UserProfile inside a parent App component.',
                  'The data is passed down via props to achieve modularity.'
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-[12px] font-bold text-slate-600 leading-relaxed">
                    <span className="text-slate-400 font-mono mt-0.5">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>

            {/* Key Takeaways */}
            <section className="rounded-3xl border border-rose-100 bg-rose-50/20 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Icons.CheckCircle size={18} className="text-rose-500" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Key Takeaways</h2>
              </div>
              <ul className="space-y-3">
                {[
                  'Components are the building blocks of any UI.',
                  'Props allow data to flow from parent to child.',
                  'Composition promotes reusability and clean code.',
                  'JSX must return a single top-level element.'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[12px] font-bold text-slate-700 leading-relaxed">
                    <Icons.CheckCircle2 size={16} className="text-orange-500 shrink-0 mt-0.5" fill="currentColor" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Related Concepts */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-4">
                <Icons.Link2 size={18} className="text-orange-600" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Related Concepts</h2>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { title: 'Functional Components', icon: <Icons.FileText size={12} /> },
                  { title: 'Props vs State', icon: <Icons.BookOpen size={12} /> },
                  { title: 'Component Lifecycle', icon: <Icons.RefreshCw size={12} /> },
                  { title: 'Pure Components', icon: <Icons.ShieldCheck size={12} /> }
                ].map((concept, i) => (
                  <button key={i} className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50/30 px-4 py-2 text-[11px] font-black text-orange-700 hover:bg-orange-100 transition-colors group">
                    <span className="flex items-center gap-2">{concept.title} {concept.icon}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* AI Tutor Help Card (Promotional) */}
            <section className="relative overflow-hidden rounded-[32px] bg-white border border-slate-200 shadow-xl shadow-slate-200/50 p-8 space-y-6">
              <div className="flex justify-center relative">
                 <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 border border-orange-100 shadow-inner relative z-10">
                    <Icons.Bot size={40} className="text-orange-500" />
                 </div>
                 <div className="absolute right-12 -top-2 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm z-20 animate-pulse" />
                 {/* Robot Illustration Placeholder */}
                 <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Icons.Cpu size={120} />
                 </div>
              </div>
              <div className="text-center space-y-2">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">AI Tutor Help</h3>
                 <p className="text-[12px] font-medium text-slate-500 leading-relaxed">
                   Confused about Component Architecture? Ask AI Tutor for step-by-step explanation.
                 </p>
              </div>
              <button 
                className="group flex w-full items-center justify-between rounded-2xl p-4 text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.primaryColor}dd)` }}
              >
                 <span className="text-xs font-black uppercase tracking-wider">Ask AI Tutor</span>
                 <Icons.ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </section>
          </div>
        )}

        {/* AI Tutor Help Card (Standard / Deep Dive) */}
        {activeTab !== 'code-example' && activeTab !== 'layman' && (
          <section className="relative overflow-hidden rounded-[32px] bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Icons.Bot size={120} />
            </div>
            <div className="p-8 space-y-6 relative z-10">
              <div className="flex justify-center">
                 <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 border border-orange-100 shadow-inner">
                       <Icons.Bot size={40} className="text-orange-500" />
                    </div>
                    <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                 </div>
              </div>
              <div className="text-center space-y-2">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Have doubts?</h3>
                 <p className="text-[12px] font-medium text-slate-500 leading-relaxed">
                   Ask AI Tutor anything about Components and Asynchronous JS.
                 </p>
              </div>
              <button 
                className="group flex w-full items-center justify-between rounded-2xl p-4 text-white transition-transform active:scale-95"
                style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.primaryColor}dd)` }}
              >
                 <span className="text-xs font-black uppercase tracking-wider">Ask Now</span>
                 <Icons.ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </section>
        )}
        
        {/* Layman Sidebar Content (Appended) */}
        {activeTab === 'layman' && data.laymanSidebar && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* Quick Summary */}
            <section className="rounded-3xl border border-orange-100 bg-orange-50/30 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Icons.ClipboardList size={18} className="text-orange-600" aria-hidden="true" />
                <h2 className="text-sm font-black text-orange-900">Quick Summary</h2>
              </div>
              <ul className="space-y-3">
                {data.laymanSidebar.quickSummary.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[12px] font-bold text-slate-700 leading-snug">
                    <Icons.CheckCircle2 size={16} className="text-orange-600 shrink-0 mt-0.5" fill="currentColor" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Key Terms */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-4">
                <Icons.BookMarked size={18} style={{ color: brand.primaryColor }} aria-hidden="true" />
                <h2 className="text-sm font-black text-slate-800">Key Terms</h2>
              </div>
              <div className="space-y-4">
                {data.laymanSidebar.keyTerms.map((item, i) => (
                  <div key={i} className="grid grid-cols-[80px_1fr] gap-2 border-b border-gray-50 pb-2 last:border-0">
                    <span className="text-[12px] font-black" style={{ color: brand.primaryColor }}>{item.term}</span>
                    <span className="text-[11px] font-bold text-slate-600">{item.definition}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Reading Time */}
            <section className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50">
                <Icons.Clock size={20} className="text-slate-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500">Estimated Reading Time</p>
                <p className="text-sm font-black text-slate-800">{data.laymanSidebar.readingTime}</p>
              </div>
            </section>

            {/* Think About It */}
            <section className="rounded-3xl border border-orange-100 bg-orange-50/50 p-5 border-dashed">
              <div className="flex items-center gap-2 mb-3">
                <Icons.Lightbulb size={18} className="text-orange-600 fill-orange-200" aria-hidden="true" />
                <h2 className="text-sm font-black text-orange-900">Think About It</h2>
              </div>
              <p className="text-[12px] font-bold text-slate-700 leading-relaxed italic">
                "{data.laymanSidebar.thinkAboutIt}"
              </p>
            </section>

            {/* Next Button */}
            <button 
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Next: Real-Life Analogy <Icons.ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* AI Tutor Chat */}
        <section className="rounded-2xl border shadow-sm flex flex-col h-[320px]" style={{ borderColor: `${brand.primaryColor}33`, backgroundColor: `${brand.primaryColor}05` }}>
          <div className="flex items-center gap-2 border-b p-3" style={{ borderColor: `${brand.primaryColor}22` }}>
            <Icons.Bot size={16} className="text-primary-dark" aria-hidden="true" />
            <h2 className="text-[13px] font-bold text-primary-dark">{data.aiTutor.title}</h2>
          </div>
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar"
            tabIndex={0}
            role="region"
            aria-label="AI Tutor Chat Messages"
          >
            {data.aiTutor.messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`rounded-2xl px-3 py-2 text-[12px] font-medium leading-relaxed max-w-[90%] shadow-sm ${msg.sender === 'user' ? 'rounded-tr-sm text-gray-800 bg-white' : 'rounded-tl-sm text-gray-800 bg-white border'}`}
                  style={msg.sender === 'user' ? { backgroundColor: `${brand.primaryColor}15` } : { borderColor: `${brand.primaryColor}22` }}
                >
                  {msg.text}
                </div>
                <div className="mt-1 text-[9px] font-bold text-slate-500 flex items-center gap-1">
                  {msg.time} {msg.sender === 'user' && <Icons.CheckCheck size={10} className="text-primary-dark" aria-hidden="true" />}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-3 bg-white rounded-b-2xl" style={{ borderColor: `${brand.primaryColor}22` }}>
            <div className="relative">
              <input 
                type="text" 
                aria-label="Ask AI Tutor"
                placeholder={data.aiTutor.inputPlaceholder} 
                className="w-full rounded-xl border py-2.5 pl-3 pr-10 text-[12px] font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 shadow-sm"
                style={{ borderColor: `${brand.primaryColor}33`, '--tw-ring-color': brand.primaryColor } as any}
              />
              <button className="absolute right-2 top-1.5 p-1 rounded-md transition-colors text-primary-dark" aria-label="Send message">
                <Icons.Send size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        {/* Your Progress */}
        <section>
          <h2 className="mb-4 text-xs font-bold text-slate-500 relative flex items-center gap-2">
            <span className="bg-gray-200 h-px flex-1"></span>
            Your Progress
            <span className="bg-gray-200 h-px flex-1"></span>
          </h2>
          <div className="flex items-center gap-4 mb-4">
             <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] border-slate-200">
                <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-100 transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="46"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeDasharray={289}
                    strokeDashoffset={289 - (289 * data.courseProgress.percentage) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="46"
                    cx="50"
                    cy="50"
                    style={{ color: brand.primaryColor }}
                  />
                </svg>
                <span className="text-sm font-black text-gray-900">{data.courseProgress.percentage}%</span>
             </div>
             <div className="flex flex-col">
               <span className="text-sm font-bold text-gray-900">{data.courseProgress.courseName}</span>
               <span className="text-xs font-medium text-slate-600">{data.courseProgress.label}</span>
             </div>
          </div>
          <button 
            className="w-full rounded-xl border py-2.5 text-xs font-bold transition-colors hover:bg-gray-50 text-primary-dark"
            style={{ borderColor: `${brand.primaryColor}44`, backgroundColor: `${brand.primaryColor}05` }}
          >
            View Full Progress
          </button>
        </section>

        {/* XP */}
        <section>
          <h2 className="mb-4 text-xs font-bold text-slate-500 relative flex items-center gap-2">
            <span className="bg-gray-200 h-px flex-1"></span>
            XP from this Subtopic
            <span className="bg-gray-200 h-px flex-1"></span>
          </h2>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-4">
             <span className="text-lg font-black text-emerald-700">+{data.xpStats.earned} XP</span>
             <span className="text-xs font-bold text-slate-600 flex items-center gap-1">Total XP: {data.xpStats.total} <Icons.Star size={12} aria-hidden="true" /></span>
          </div>
        </section>

        {/* Related Subtopics */}
        <section>
          <h2 className="mb-4 text-[13px] font-bold text-gray-900">Related Subtopics</h2>
          <div className="space-y-2">
            {data.relatedSubtopics.map(sub => (
              <button key={sub.id} className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-gray-50 transition-colors text-left">
                 <span className="text-xs font-bold text-slate-700">{sub.title}</span>
                 {sub.status === 'next' ? (
                   <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 group-hover:text-slate-600 transition-colors">Next <Icons.ChevronRight size={12} aria-hidden="true" /></span>
                 ) : (
                   <Icons.ChevronRight size={14} className="text-slate-500" aria-hidden="true" />
                 )}
              </button>
            ))}
          </div>
        </section>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
           <button className="flex-1 flex justify-center items-center gap-1.5 rounded-lg border border-gray-200 py-2 text-[11px] font-bold text-slate-600 hover:bg-gray-50 transition-colors">
             <Icons.Bookmark size={14} aria-hidden="true" /> Add to Revision
           </button>
           <button className="flex-1 flex justify-center items-center gap-1.5 rounded-lg border border-gray-200 py-2 text-[11px] font-bold text-slate-600 hover:bg-gray-50 transition-colors">
             <Icons.Share2 size={14} aria-hidden="true" /> Share
           </button>
        </div>

      </div>
    </aside>
  );
}
