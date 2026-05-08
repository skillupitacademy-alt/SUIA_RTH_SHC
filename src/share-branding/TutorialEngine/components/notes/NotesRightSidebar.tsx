import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

export function NotesRightSidebar({ 
  data, 
  isOpen, 
  activeTab, 
  quizData,
  currentQuestionIndex = 0,
  onQuestionChange
}: { 
  data: SubtopicNotesViewData['rightSidebar']; 
  isOpen: boolean; 
  activeTab: string;
  quizData?: {
    title: string;
    description: string;
    totalQuestions: number;
    duration: string;
    xp: number;
    questions: Array<{
      id: string;
      questionNumber: number;
      type: string;
      points: number;
      question: string;
      code?: string;
      options: Array<{
        id: string;
        text: string;
      }>;
      correctAnswer: string;
      explanation: string;
    }>;
  };
  currentQuestionIndex?: number;
  onQuestionChange?: (index: number) => void;
}) {
  const brand = useBrand();

  return (
    <aside 
      aria-label="Tools and statistics sidebar" 
      className={`fixed bottom-0 right-0 top-16 z-40 flex w-[78vw] flex-col overflow-y-auto bg-white p-4 hide-scrollbar transition-transform duration-300 min-[520px]:w-[350px] sm:p-5 ${isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-none'}`}
      tabIndex={0}
      role="region"
    >
      <div className="space-y-6">
        
        {/* Assignment Sidebar Content */}
        {activeTab === 'assignments' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* Assignment Info */}
            <section aria-label="Assignment information" className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-t border-white/60">
              <div className="flex items-center gap-2 mb-6">
                <Icons.CalendarCheck size={18} className="text-rose-950" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Assignment Info</h2>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Difficulty', value: <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-950 text-[10px] font-bold uppercase border border-amber-200">Medium</span> },
                  { label: 'Type', value: 'Practical' },
                  { label: 'Points', value: '+30 XP' },
                  { label: 'Submissions', value: '1 allowed' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px] font-medium pb-2 last:pb-0">
                    <span className="text-slate-800">{item.label}</span>
                    <span className="text-slate-950 font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Deadline */}
            <section aria-label="Assignment deadline" className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-t border-white/60">
              <div className="flex items-center gap-2 mb-4">
                <Icons.Clock size={18} className="text-orange-950" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Deadline</h2>
              </div>
              <div className="space-y-3">
                <p className="text-[14px] font-bold text-slate-950">29 Apr 2026, 11:59 PM</p>
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[10px] font-bold text-rose-950 border border-rose-200">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                  5d 14h 32m left
                </div>
              </div>
            </section>

            {/* Rewards */}
            <section aria-label="Assignment rewards" className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-t border-white/60">
              <div className="flex items-center gap-2 mb-6">
                <Icons.Trophy size={18} className="text-amber-950" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Rewards</h2>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'XP Points', value: '+30 XP' },
                  { label: 'Streak Bonus', value: '+5 XP' },
                  { label: 'Badges', value: <span className="flex items-center gap-1"><Icons.Shield size={12} className="text-orange-950" /> Component Pro</span> }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px] font-medium">
                    <span className="flex items-center gap-2 text-slate-800"><Icons.CheckCircle2 size={14} className="text-orange-950" fill="currentColor" aria-hidden="true" /> {item.label}</span>
                    <span className="text-slate-950 font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Submit Assignment */}
            <section aria-label="Assignment submission" className="rounded-3xl bg-white p-6 shadow-xl space-y-6 transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-center gap-2">
                <Icons.UploadCloud size={18} className="text-primary-dark" aria-hidden="true" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Submit Assignment</h2>
              </div>
              <div className="rounded-[24px] bg-rose-50/40 backdrop-blur-md p-8 flex flex-col items-center justify-center gap-3 text-center transition-all -translate-y-1 hover:-translate-y-3 hover:bg-rose-100/60 border-t border-white/60 cursor-pointer group shadow-2xl" role="button" aria-label="Upload assignment file">
                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-transform border border-rose-100">
                    <Icons.CloudUpload size={24} className="text-slate-700 group-hover:text-rose-900" aria-hidden="true" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[12px] font-bold text-slate-900">Upload your code file</p>
                    <p className="text-[10px] font-bold text-slate-700 uppercase">.js, .ts (max 50KB)</p>
                 </div>
              </div>
              <button 
                className="w-full rounded-2xl py-4 text-sm font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.primaryColor}dd)` }}
              >
                Submit Assignment
              </button>
              <p className="text-[10px] font-bold text-slate-800 text-center">You can submit only once</p>
            </section>



            {/* Helpful Resources */}
            <section className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-t border-white/60">
               <div className="flex items-center gap-2 mb-6">
                  <Icons.Link size={18} className="text-orange-950" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Helpful Resources</h2>
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
                      className="flex items-center justify-between w-full text-[12px] font-bold text-orange-950 hover:text-orange-800 transition-colors group"
                    >
                       {res.label} <Icons.ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
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
            <section className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-t border-white/60">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Your Progress</h2>
              </div>
              <div className="flex min-w-0 flex-col gap-4 min-[360px]:flex-row min-[360px]:items-center min-[360px]:gap-6">
                 <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full">
                    <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle
                        className="transition-all duration-1000 ease-out text-rose-950"
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
                       <span className="text-sm font-bold text-slate-950">60%</span>
                       <p className="text-[8px] font-bold text-slate-800 uppercase">Completed</p>
                    </div>
                 </div>
                 <div className="min-w-0 flex-1 space-y-2">
                    {[
                      { label: 'Read Instructions', done: true },
                      { label: 'Code Implementation', done: true },
                      { label: 'Test & Debug', done: false },
                      { label: 'Submit Project', done: false }
                    ].map((step, i) => (
                      <div key={i} className="flex min-w-0 items-center gap-2 text-[10px] font-bold">
                         <div className={`h-1.5 w-1.5 rounded-full ${step.done ? 'bg-emerald-600' : 'bg-slate-300'}`} aria-hidden="true" />
                         <span className={`min-w-0 break-words ${step.done ? 'text-slate-900' : 'text-slate-800'}`}>{step.label}</span>
                         {step.done && <Icons.Check size={10} className="text-emerald-800 ml-auto" aria-hidden="true" />}
                      </div>
                    ))}
                 </div>
              </div>
            </section>

            {/* Project Info */}
            <section className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-t border-white/60">
              <div className="flex items-center gap-2 mb-6">
                <Icons.Calendar size={18} className="text-rose-950" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Project Info</h2>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Difficulty', value: <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-950 text-[10px] font-bold uppercase border border-amber-200">Intermediate</span> },
                  { label: 'Estimated Time', value: '5-7 hrs' },
                  { label: 'XP Reward', value: '+400 XP' },
                  { label: 'Submissions', value: '2 allowed' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px] font-medium pb-2 last:pb-0">
                    <span className="text-slate-800">{item.label}</span>
                    <span className="text-slate-950 font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Deadline */}
            <section aria-label="Project deadline" className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-t border-white/60">
              <div className="flex items-center gap-2 mb-4">
                <Icons.Clock size={18} className="text-orange-950" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Deadline</h2>
              </div>
              <div className="space-y-3">
                <p className="text-[14px] font-bold text-slate-950">30 Apr 2026, 11:59 PM</p>
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[10px] font-bold text-rose-950 border border-rose-200">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                  6d 14h 32m left
                </div>
              </div>
            </section>

            {/* Submit Project */}
            <section className="rounded-3xl bg-white p-6 shadow-xl space-y-6 transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-center gap-2">
                <Icons.UploadCloud size={18} className="text-primary-dark" aria-hidden="true" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Submit Your Project</h2>
              </div>
              <div className="space-y-2">
                 <p className="text-[11px] font-bold text-slate-900">Upload your project files (.zip)</p>
                 <p className="text-[10px] font-bold text-slate-700 uppercase">Max size: 50MB</p>
              </div>
              <button 
                className="w-full rounded-2xl py-4 text-sm font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.primaryColor}dd)` }}
              >
                Upload & Submit
              </button>
              <p className="text-[10px] font-bold text-slate-800 text-center">You can submit 2 more times</p>
            </section>



            {/* Badge */}
            <section className="rounded-3xl bg-white p-6 shadow-xl flex flex-col items-center text-center space-y-4 transition-all duration-300 hover:-translate-y-1 border border-slate-100">
               <div className="flex items-center gap-2 w-full">
                  <Icons.Award size={18} className="text-purple-600" aria-hidden="true" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Badge You'll Earn</h2>
               </div>
               <div className="relative">
                  <div className="h-24 w-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-200">
                     <Icons.Star size={40} className="text-amber-400" fill="currentColor" aria-hidden="true" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center border border-purple-100">
                     <Icons.Lock size={12} className="text-purple-600" aria-hidden="true" />
                  </div>
               </div>
               <div>
                  <h4 className="text-sm font-bold text-slate-950">User Management Pro</h4>
                  <p className="text-[10px] font-medium text-slate-800">Complete this project to unlock</p>
               </div>
            </section>
          </div>
        )}

        {/* Quiz Sidebar Content */}
        {activeTab === 'quiz' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* Time Left */}
            <section className="rounded-3xl bg-white p-6 shadow-xl flex flex-col items-center transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 w-full text-left">Time Left</h2>
              <div className="relative h-32 w-32 flex items-center justify-center">
                 <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle className="text-slate-100" strokeWidth="6" stroke="currentColor" fill="transparent" r="44" cx="50" cy="50" />
                    <circle
                      className="transition-all duration-1000 ease-out text-rose-950"
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
                    <span className="text-xl font-bold text-slate-950">10:24</span>
                    <p className="text-[8px] font-bold text-slate-800 uppercase tracking-widest">min : sec</p>
                 </div>
              </div>
            </section>

            {/* Question Navigator */}
            <section className="rounded-3xl bg-white p-6 shadow-xl space-y-6 transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Question Navigator</h2>
              <div className="grid grid-cols-4 gap-2 text-[7px] font-bold uppercase tracking-tighter">
                 <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-700" /> Answered</div>
                 <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-rose-950" /> Current</div>
                 <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Marked</div>
                 <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Unanswered</div>
              </div>
              <div className="grid grid-cols-5 gap-3">
                 {(quizData?.questions || [
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
                 ]).map((q, index) => (
                   <button 
                     key={quizData?.questions ? q.id : q.id} 
                     onClick={() => {
                       if (quizData?.questions && onQuestionChange) {
                         onQuestionChange(index);
                       }
                     }}
                     className={`flex h-10 items-center justify-center rounded-xl text-sm font-bold transition-all hover:scale-105 ${
                       // For real quiz data, use currentQuestionIndex to determine current question
                       quizData?.questions 
                         ? (index === currentQuestionIndex ? 'bg-rose-950 shadow-rose-200 text-white' : 'bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200')
                         : (
                           q.status === 'answered' ? 'bg-emerald-100 text-emerald-950 border border-emerald-200' :
                           q.status === 'current' ? 'bg-rose-950 shadow-rose-200 text-white' :
                           q.status === 'marked' ? 'bg-amber-100 text-amber-950 border border-amber-200' :
                           'bg-slate-100 text-slate-900 border border-slate-200'
                         )
                     }`}
                   >
                     {quizData?.questions ? (index + 1) : q.id}
                   </button>
                 ))}
              </div>
              {quizData?.questions && (
                <div className="text-xs text-slate-600 text-center">
                  {quizData.questions.length} questions total
                </div>
              )}
            </section>



            {/* Performance Snapshot */}
            <section className="rounded-3xl bg-white p-6 shadow-xl space-y-6 transition-all duration-300 hover:-translate-y-1 border border-slate-100">
               <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Performance Snapshot</h2>
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
                        <span className="text-lg font-bold text-slate-800">72%</span>
                        <p className="text-[8px] font-bold text-slate-500 uppercase leading-none">Accuracy</p>
                     </div>
                  </div>
                  <div className="flex-1 space-y-3">
                     {[
                       { label: 'Correct', value: 13, color: 'text-emerald-700' },
                       { label: 'Incorrect', value: 5, color: 'text-rose-950' },
                       { label: 'Unattempted', value: 2, color: 'text-slate-700' }
                     ].map((stat, i) => (
                       <div key={i} className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-800">{stat.label}</span>
                          <span className={stat.color}>{stat.value}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </section>

            {/* Struggling Link */}
            <section className="rounded-3xl bg-white p-6 shadow-sm flex items-center gap-4 group cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100">
               <div className="flex-1 space-y-1">
                  <h3 className="text-[12px] font-bold text-slate-900">Struggling with this topic?</h3>
                  <p className="text-[10px] font-medium text-slate-800">Review weak areas and get a personalized study plan.</p>
                  <div className="flex items-center gap-1.5 pt-2 text-[10px] font-bold text-rose-950 uppercase tracking-widest">
                     View Weak Topics <Icons.ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </div>
               </div>
               <div className="relative h-16 w-16 transform transition-transform group-hover:scale-110 group-hover:rotate-6">
                  <Icons.Target size={48} className="text-rose-950/20" aria-hidden="true" />
                  <Icons.Target size={32} className="absolute inset-0 m-auto text-rose-950" aria-hidden="true" />
               </div>
            </section>
          </div>
        )}

        {/* Code Example Sidebar Content */}
        {activeTab === 'code-example' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* Code Explanation */}
            <section className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-t border-white/60">
              <div className="flex items-center gap-2 mb-4">
                <Icons.Lightbulb size={18} className="text-amber-950" aria-hidden="true" />
                <h2 className="text-sm font-bold text-slate-950 uppercase tracking-widest">Code Explanation</h2>
              </div>
              <ol className="space-y-4">
                {[
                  'We create a functional component UserProfile that receives props.',
                  'The component returns a JSX structure with dynamic name and role.',
                  'We render the UserProfile inside a parent App component.',
                  'The data is passed down via props to achieve modularity.'
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-[12px] font-medium text-slate-800 leading-relaxed">
                    <span className="text-slate-600 font-mono mt-0.5">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>

            {/* Key Takeaways */}
            <section className="rounded-3xl bg-rose-50/20 p-6 shadow-sm border border-rose-100/50">
              <div className="flex items-center gap-2 mb-4">
                <Icons.CheckCircle size={18} className="text-rose-950" aria-hidden="true" />
                <h2 className="text-sm font-bold text-slate-950 uppercase tracking-widest">Key Takeaways</h2>
              </div>
              <ul className="space-y-3">
                {[
                  'Components are the building blocks of any UI.',
                  'Props allow data to flow from parent to child.',
                  'Composition promotes reusability and clean code.',
                  'JSX must return a single top-level element.'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[12px] font-medium text-slate-800 leading-relaxed">
                    <Icons.CheckCircle2 size={16} className="text-orange-950 shrink-0 mt-0.5" fill="currentColor" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Related Concepts */}
            <section className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-t border-white/60">
              <div className="flex items-center gap-2 mb-4">
                <Icons.Link2 size={18} className="text-orange-950" aria-hidden="true" />
                <h2 className="text-sm font-bold text-slate-950 uppercase tracking-widest">Related Concepts</h2>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { title: 'Functional Components', icon: <Icons.FileText size={12} /> },
                  { title: 'Props vs State', icon: <Icons.BookOpen size={12} /> },
                  { title: 'Component Lifecycle', icon: <Icons.RefreshCw size={12} /> },
                  { title: 'Pure Components', icon: <Icons.ShieldCheck size={12} /> }
                ].map((concept, i) => (
                  <button key={i} className="flex items-center justify-between rounded-xl bg-orange-50/50 px-4 py-2 text-[11px] font-bold text-orange-950 hover:bg-orange-100 transition-colors group border border-orange-100/50">
                    <span className="flex items-center gap-2">{concept.title} {concept.icon}</span>
                  </button>
                ))}
              </div>
            </section>


          </div>
        )}


        
        {/* Layman Sidebar Content (Appended) */}
        {activeTab === 'layman' && data.laymanSidebar && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* Quick Summary */}
            <section className="rounded-3xl bg-orange-50/30 p-5 shadow-sm border border-orange-100/50">
              <div className="flex items-center gap-2 mb-4">
                <Icons.ClipboardList size={18} className="text-orange-950" aria-hidden="true" />
                <h2 className="text-sm font-bold text-orange-950 uppercase tracking-widest">Quick Summary</h2>
              </div>
              <ul className="space-y-3">
                {data.laymanSidebar.quickSummary.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[12px] font-medium text-slate-800 leading-snug">
                    <Icons.CheckCircle2 size={16} className="text-orange-950 shrink-0 mt-0.5" fill="currentColor" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Key Terms */}
            <section className="rounded-3xl bg-white p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Icons.BookMarked size={18} style={{ color: brand.primaryColor }} aria-hidden="true" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Key Terms</h2>
              </div>
              <div className="space-y-4">
                {data.laymanSidebar.keyTerms.map((item, i) => (
                  <div key={i} className="grid grid-cols-[80px_1fr] gap-2 pb-2 last:pb-0">
                    <span className="text-[12px] font-bold" style={{ color: brand.primaryColor }}>{item.term}</span>
                    <span className="text-[11px] font-medium text-slate-800">{item.definition}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Reading Time */}
            <section className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
                <Icons.Clock size={20} className="text-slate-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Estimated Reading Time</p>
                <p className="text-sm font-bold text-slate-950">{data.laymanSidebar.readingTime}</p>
              </div>
            </section>

            {/* Think About It */}
            <section className="rounded-3xl bg-orange-50/50 p-5 border-dashed border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <Icons.Lightbulb size={18} className="text-orange-950 fill-orange-200" aria-hidden="true" />
                <h2 className="text-sm font-bold text-orange-950 uppercase tracking-widest">Think About It</h2>
              </div>
              <p className="text-[12px] font-medium text-slate-900 leading-relaxed italic">
                "{data.laymanSidebar.thinkAboutIt}"
              </p>
            </section>


          </div>
        )}

        {/* Tutor Chat */}
        <section className="rounded-2xl shadow-sm flex flex-col h-[320px]" style={{ backgroundColor: `${brand.primaryColor}05` }}>
          <div className="flex items-center gap-2 p-3">
            <Icons.Bot size={16} className="text-primary-dark" aria-hidden="true" />
            <h2 className="text-[13px] font-bold text-primary-dark">{data.aiTutor.title}</h2>
          </div>
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar"
            tabIndex={0}
            role="region"
            aria-label={`${brand.tutorLabel} chat messages`}
          >
            {data.aiTutor.messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`rounded-2xl px-3 py-2 text-[12px] font-medium leading-relaxed max-w-[90%] shadow-sm ${msg.sender === 'user' ? 'rounded-tr-sm text-slate-950 bg-white' : 'rounded-tl-sm text-slate-950 bg-white'}`}
                  style={msg.sender === 'user' ? { backgroundColor: `${brand.primaryColor}15` } : {}}
                >
                  {msg.text}
                </div>
                <div className="mt-1 text-[9px] font-bold text-slate-800 flex items-center gap-1">
                  {msg.time} {msg.sender === 'user' && <Icons.CheckCheck size={10} className="text-primary-dark" aria-hidden="true" />}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-white rounded-b-2xl">
            <div className="relative">
              <input 
                type="text" 
                aria-label={`Ask ${brand.tutorLabel}`}
                placeholder={data.aiTutor.inputPlaceholder} 
                className="w-full rounded-xl py-2.5 pl-3 pr-10 text-[12px] font-medium placeholder:text-slate-800 focus:outline-none focus:ring-2 shadow-sm border"
                style={{ borderColor: `${brand.primaryColor}33`, '--tw-ring-color': brand.primaryColor } as any}
              />
              <button className="absolute right-2 top-1.5 p-1 rounded-md transition-colors text-primary-dark" aria-label="Send message">
                <Icons.Send size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        {activeTab !== 'layman' && activeTab !== 'real-life' && activeTab !== 'technical-deep-dive' && activeTab !== 'code-example' && activeTab !== 'assignments' && activeTab !== 'project' && activeTab !== 'quiz' && (
          <>
        {/* Your Progress */}
        <section>
          <h2 className="mb-4 text-xs font-bold text-slate-800 relative flex items-center gap-2">
            <span className="bg-slate-200 h-px flex-1"></span>
            Your Progress
            <span className="bg-slate-200 h-px flex-1"></span>
          </h2>
          <div className="flex items-center gap-4 mb-4">
             <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
                <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    className="text-slate-100 transition-all duration-1000 ease-out"
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
                <span className="text-sm font-bold text-slate-950">{data.courseProgress.percentage}%</span>
             </div>
             <div className="flex flex-col">
               <span className="text-sm font-bold text-slate-950">{data.courseProgress.courseName}</span>
               <span className="text-xs font-medium text-slate-800">{data.courseProgress.label}</span>
             </div>
          </div>
          <button 
            className="w-full rounded-xl py-2.5 text-xs font-bold transition-colors hover:bg-slate-50 text-primary-dark border"
            style={{ borderColor: `${brand.primaryColor}44`, backgroundColor: `${brand.primaryColor}05` }}
          >
            View Full Progress
          </button>
        </section>

        {/* XP */}
        <section>
          <h2 className="mb-4 text-xs font-bold text-slate-800 relative flex items-center gap-2">
            <span className="bg-slate-200 h-px flex-1"></span>
            XP from this Subtopic
            <span className="bg-slate-200 h-px flex-1"></span>
          </h2>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-100">
             <span className="text-lg font-bold text-emerald-800">+{data.xpStats.earned} XP</span>
             <span className="text-xs font-bold text-slate-800 flex items-center gap-1">Total XP: {data.xpStats.total} <Icons.Star size={12} aria-hidden="true" /></span>
          </div>
        </section>

        {/* Related Subtopics */}
        <section>
          <h2 className="mb-4 text-[13px] font-bold text-slate-950 uppercase tracking-widest">Related Subtopics</h2>
          <div className="space-y-2">
            {data.relatedSubtopics.map(sub => (
              <button key={sub.id} className="flex w-full items-center justify-between rounded-xl p-3 hover:bg-slate-50 transition-colors text-left border border-transparent hover:border-slate-200">
                 <span className="text-xs font-bold text-slate-800">{sub.title}</span>
                 {sub.status === 'next' ? (
                   <span className="text-[10px] font-bold text-slate-800 flex items-center gap-1 group-hover:text-slate-950 transition-colors">Next <Icons.ChevronRight size={12} aria-hidden="true" /></span>
                 ) : (
                   <Icons.ChevronRight size={14} className="text-slate-800" aria-hidden="true" />
                 )}
              </button>
            ))}
          </div>
        </section>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
           <button className="flex-1 flex justify-center items-center gap-1.5 rounded-lg py-2 text-[11px] font-bold text-slate-800 hover:bg-slate-50 transition-colors border border-slate-200">
             <Icons.Bookmark size={14} aria-hidden="true" /> Revision
           </button>
           <button className="flex-1 flex justify-center items-center gap-1.5 rounded-lg py-2 text-[11px] font-bold text-slate-800 hover:bg-slate-50 transition-colors border border-slate-200">
             <Icons.Share2 size={14} aria-hidden="true" /> Share
           </button>
        </div>
          </>
        )}

      </div>
    </aside>
  );
}
