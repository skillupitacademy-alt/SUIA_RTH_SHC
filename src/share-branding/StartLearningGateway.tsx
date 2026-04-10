import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, Brain, FileEdit, Lightbulb, Award, Check, X, ArrowRight, Layers, GraduationCap, Menu } from 'lucide-react';
import { BrandConfig } from './brandConfig';

const ComparisonRow = ({ label, exam, tutorial, brandPrimary }: { label: string, exam: boolean, tutorial: boolean, brandPrimary: string }) => (
  <div className="flex justify-between py-3 sm:py-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors px-2 rounded-lg">
    <span className="text-[11px] sm:text-sm font-bold text-gray-700 flex-1 pr-2 leading-tight">{label}</span>
    <div className="flex gap-3 sm:gap-8 shrink-0">
      <div className="w-10 sm:w-16 flex items-center justify-center">
        {exam ? <Check className="w-5 h-5" style={{ color: brandPrimary }} /> : <X className="w-5 h-5 text-gray-300" />}
      </div>
      <div className="w-10 sm:w-16 flex items-center justify-center">
        {tutorial ? <Check className="w-5 h-5" style={{ color: brandPrimary }} /> : <X className="w-5 h-5 text-gray-300" />}
      </div>
    </div>
  </div>
);

export default function StartLearningGateway({ config }: { config: BrandConfig }) {
  const router = useRouter();

  return (
    <main className="min-h-[100dvh] bg-slate-50 relative overflow-hidden font-poppins pb-20">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.secondaryColor }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg sm:text-xl truncate">{config.name}</span>
          </div>
          <div className="hidden min-[801px]:flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="text-gray-700 hover:text-gray-900 transition font-bold duration-300 hover:-translate-y-1"
            >
              Return Home
            </button>
          </div>
          <button 
            aria-label="Toggle Navigation Menu" 
            className="min-[801px]:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section aria-label="Ecosystem Entrance" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col lg:flex-row items-center justify-center relative z-10 overflow-x-clip">
        {/* Left Content */}
        <div className="w-full lg:w-1/2 flex flex-col items-start lg:pr-10 mb-12 lg:mb-0 min-w-0">
          <h1 className="text-4xl sm:text-6xl md:text-7xl md:leading-tight font-bold mb-6 font-poppins tracking-tight break-words max-w-full">
            <span style={{ color: config.primaryColor }}>Enter the</span><br />
            <span style={{ color: config.secondaryColor }}>Ecosystem.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 font-medium max-w-lg leading-relaxed">
            Take strict diagnostic assessments in the Exam Engine to identify your exact knowledge bounds, then jump into guided tutorial sessions with your {config.tutorLabel}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
            <Link 
              href="/login?redirect=/dashboard/exams" 
              aria-label="Enter Exam Engine to take diagnostics"
              className="text-white px-6 py-4 sm:px-10 sm:py-4 rounded-full text-base sm:text-lg w-full sm:w-auto transition-all font-bold shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2 hover:-translate-y-1" 
              style={{ backgroundColor: config.primaryColor }}
            >
              <Target className="w-5 h-5" /> Enter Exam Engine
            </Link>
            <Link 
              href="/login?redirect=/dashboard/tutorial" 
              aria-label="Enter Tutorial Engine for guided learning"
              className="bg-white text-gray-800 px-6 py-4 sm:px-10 sm:py-4 rounded-full text-base sm:text-lg w-full sm:w-auto border-2 transition-all font-bold shadow-sm hover:shadow-[0_15px_30px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2 hover:-translate-y-1" 
              style={{ borderColor: config.secondaryColor }}
            >
              <Brain className="w-5 h-5" style={{ color: config.secondaryColor }} /> Enter Tutorial Engine
            </Link>
          </div>
        </div>
        
        {/* Right Dashboard Mock */}
         <div className="w-full lg:w-1/2 relative min-w-0">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-4 absolute top-0 right-0 md:-right-6 lg:-right-10 w-[calc(100%-0.5rem)] sm:w-full transform rotate-1 sm:rotate-2 md:rotate-3 translate-y-6 sm:translate-y-10 z-0 opacity-50 blur-[2px] hidden md:block overflow-hidden">
             <div className="h-6 w-full bg-slate-100 rounded-md mb-4 hidden sm:block"></div>
             <div className="h-48 w-full bg-slate-50 rounded-xl mb-4"></div>
          </div>
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-gray-100 p-5 sm:p-8 relative z-10 transition-all -translate-y-1 duration-500 hover:-translate-y-3 hover:shadow-[0_50px_100px_rgba(0,0,0,0.18)] sm:hover:scale-[1.02] overflow-hidden">
             <div className="flex items-center gap-4 border-b border-gray-100 pb-5 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner" style={{ backgroundColor: config.secondaryColor, color: 'white' }}><Target className="w-6 h-6" /></div>
                <div>
                  <div className="font-black text-gray-900 tracking-tight">Diagnostic Testing Active</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">Exam Engine Mode</div>
                </div>
             </div>
             <div className="space-y-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between text-xs font-black text-gray-600 uppercase tracking-widest"><span>Time Remaining</span><span>08:14</span></div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden flex"><div className="w-[72%] h-full" style={{ backgroundColor: config.primaryColor }}></div></div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400"><span>Progress Metric</span><span>72% Complete</span></div>
             </div>
             <div className="relative">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm transition hover:shadow-md">
                   <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-inner" style={{ backgroundColor: config.primaryColor, color: 'white' }}>{config.tutorLabel[0]}</div>
                      <div>
                         <p className="text-sm text-gray-800 font-bold mb-1.5">Awaiting Engine Transfer...</p>
                         <p className="text-xs text-gray-500 leading-relaxed font-medium">Once diagnostics finish, I will curate your personalized Tutorial Engine recovery blocks to patch your weak topics here.</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Grid and Details mirroring the image's layout structure */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16">
         
         {/* Left Side: How it Works (6 blocks) */}
         <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-10 font-poppins text-gray-900 text-center sm:text-left">The Learning Engine Loop</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              
              {/* Card 1 */}
              <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.08)] border-t border-slate-50 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] hover:scale-[1.04] cursor-pointer relative group">
                <div className="w-12 h-12 bg-pink-100 text-pink-800 rounded-xl flex items-center justify-center mb-4"><Target className="w-6 h-6" /></div>
                <h3 className="text-lg font-bold mb-2 text-slate-800">Diagnostic Exams</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">Take rigorous timed assessments to map your exact bounds in the Exam Engine.</p>
                <div className="absolute right-6 top-8 text-slate-300 hidden sm:block group-hover:text-slate-400 group-hover:translate-x-1 transition"><ArrowRight className="w-5 h-5" /></div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.08)] border-t border-slate-50 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] hover:scale-[1.04] cursor-pointer relative group">
                <div className="w-12 h-12 bg-purple-100 text-purple-800 rounded-xl flex items-center justify-center mb-4"><TrendingUp className="w-6 h-6" /></div>
                <h3 className="text-lg font-bold mb-2 text-slate-800">Weakness Analysis</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">Internal algorithms instantly compute and isolate the specific topics you failed.</p>
                <div className="absolute right-6 top-8 text-slate-300 hidden sm:block group-hover:text-slate-400 group-hover:translate-x-1 transition"><ArrowRight className="w-5 h-5" /></div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.08)] border-t border-slate-50 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] hover:scale-[1.04] cursor-pointer relative group">
                <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center mb-4"><Brain className="w-6 h-6" /></div>
                <h3 className="text-lg font-bold mb-2 text-slate-800">{config.tutorLabel} Transfer</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">Transition natively into the Tutorial Engine focused explicitly on those weak topics.</p>
                <div className="absolute right-6 top-8 text-slate-300 hidden sm:block group-hover:text-slate-400 group-hover:translate-x-1 transition"><ArrowRight className="w-5 h-5" /></div>
              </div>

              {/* Card 4 */}
              <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.08)] border-t border-slate-50 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] hover:scale-[1.04] cursor-pointer relative group">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-800 rounded-xl flex items-center justify-center mb-4"><FileEdit className="w-6 h-6" /></div>
                <h3 className="text-lg font-bold mb-2 text-slate-800">Interactive Coding</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">Re-learn fundamentals by repairing adaptive assignment codes inside actual editors.</p>
                <div className="absolute right-6 top-8 text-slate-300 hidden sm:block group-hover:text-slate-400 group-hover:translate-x-1 transition"><ArrowRight className="w-5 h-5" /></div>
              </div>

              {/* Card 5 */}
              <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.08)] border-t border-slate-50 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] hover:scale-[1.04] cursor-pointer relative group">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center mb-4"><Lightbulb className="w-6 h-6" /></div>
                <h3 className="text-lg font-bold mb-2 text-slate-800">Concept Mastery</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">Validate your newly fortified knowledge against fresh, dynamically generated tests.</p>
                <div className="absolute right-6 top-8 text-slate-300 hidden sm:block group-hover:text-slate-400 group-hover:translate-x-1 transition"><ArrowRight className="w-5 h-5" /></div>
              </div>

              {/* Card 6 */}
              <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.08)] border-t border-slate-50 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] hover:scale-[1.04] cursor-pointer relative group">
                <div className="w-12 h-12 bg-orange-100 text-orange-800 rounded-xl flex items-center justify-center mb-4"><Award className="w-6 h-6" /></div>
                <h3 className="text-lg font-bold mb-2 text-slate-800">Final Certification</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">Conquer the unified Exam Engine capstone module to earn your verifiable credential.</p>
              </div>

            </div>

            {/* Bottom Left: Assignment Levels Diagram */}
            <div className="mt-16">
               <h2 className="text-3xl font-bold mb-3 font-poppins text-gray-900 text-center sm:text-left">Exam Difficulty Matrix</h2>
               <p className="text-sm text-slate-600 mb-8 font-medium text-center sm:text-left">Unlock higher diagnostic difficulty levels by fully graduating your Tutorial Engine blocks.</p>
               <div className="bg-white rounded-[2rem] p-5 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden">
                  <div className="grid grid-cols-4 gap-2 sm:gap-6">
                    <div className="text-center flex-1 transition hover:-translate-y-1">
                      <div className="w-11 h-11 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-400 to-slate-500 rounded-[1.25rem] flex items-center justify-center mb-3 mx-auto shadow-md"><span className="text-white font-black text-lg sm:text-xl">1.0</span></div>
                      <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">Base</p>
                    </div>
                    <div className="text-center flex-1 transition hover:-translate-y-1">
                      <div className="w-11 h-11 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-blue-500 rounded-[1.25rem] flex items-center justify-center mb-3 mx-auto shadow-md"><span className="text-white font-black text-lg sm:text-xl">2.0</span></div>
                      <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">Inter</p>
                    </div>
                    <div className="text-center flex-1 transition hover:-translate-y-1">
                      <div className="w-11 h-11 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-[1.25rem] flex items-center justify-center mb-3 mx-auto shadow-md"><span className="text-white font-black text-lg sm:text-xl">3.0</span></div>
                      <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">Upper</p>
                    </div>
                    <div className="text-center flex-1 transition hover:-translate-y-1">
                      <div className="w-11 h-11 sm:w-20 sm:h-20 bg-gradient-to-br from-rose-500 to-rose-600 rounded-[1.25rem] flex items-center justify-center mb-3 mx-auto shadow-md"><span className="text-white font-black text-lg sm:text-xl">4.0</span></div>
                      <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">Pro</p>
                    </div>
                  </div>
               </div>
            </div>

         </div>

         {/* Right Side: Smart Remediation & Comparison */}
         <div className="space-y-16">
            
            {/* Smart Remediation Dashboard Mirror */}
            <div>
               <h2 className="text-3xl font-bold mb-3 font-poppins text-gray-900 text-center sm:text-left">Engine Synchronization</h2>
               <p className="text-sm text-slate-600 mb-8 font-medium text-center sm:text-left">Personalized recovery plans are instantly piped from your failed Exam Engine results directly into your Tutorial Engine.</p>
               
                <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-slate-100 relative group transition-all duration-500 -translate-y-1 hover:shadow-[0_50px_100px_rgba(0,0,0,0.2)] hover:-translate-y-2.5">
                  <div className="flex items-center gap-3 text-xs font-black uppercase text-slate-400 tracking-widest mb-6 border-b border-slate-100 pb-4">
                     <Layers className="w-4 h-4" /> Live Dashboard Telemetry
                  </div>
                  <div className="space-y-4">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 transition hover:bg-rose-50">
                        <span className="text-sm font-bold text-slate-800 break-words">Linked Lists Architecture</span>
                        <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-3 py-1.5 rounded-md uppercase tracking-wider self-start sm:self-auto">FAILED EXAM</span>
                     </div>
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 transition hover:bg-amber-50">
                        <span className="text-sm font-bold text-slate-800 break-words">Async Wait Promises</span>
                        <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-3 py-1.5 rounded-md uppercase tracking-wider self-start sm:self-auto">WEAK DIAGNOSTIC</span>
                     </div>
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 transition hover:bg-emerald-50">
                        <span className="text-sm font-bold text-slate-800 break-words">Map & Filter Recursion</span>
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-md uppercase tracking-wider self-start sm:self-auto">FULLY MASTERED</span>
                     </div>
                  </div>
                  <div className="mt-6 flex justify-center">
                     <Link 
                       href="/login?redirect=/dashboard/tutorial"
                       aria-label="Auto-deploy tutorial sequence based on results"
                       className="inline-flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-lg cursor-pointer transition hover:-translate-y-0.5" 
                       style={{ backgroundColor: config.primaryColor }}
                     >
                        Auto-Deploy Tutorial Sequence ➔
                     </Link>
                  </div>
               </div>
            </div>

            {/* Why We Are Different (Logic Table Mirror) */}
            <div>
               <h2 className="text-3xl font-bold mb-3 font-poppins text-gray-900 text-center sm:text-left">Which Platform To Hit?</h2>
               <p className="text-sm text-slate-600 mb-8 font-medium text-center sm:text-left">Understand the exact architectural boundaries between strict testing and guided mastery environments.</p>

               <div className="bg-white rounded-[2rem] p-4 sm:p-6 lg:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-slate-100 overflow-x-auto">
                  <div className="flex justify-between py-4 border-b border-slate-200 items-end sm:items-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Target className="w-5 h-5 text-slate-700" />
                      <span className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-widest">Capabilities</span>
                    </div>
                    <div className="flex gap-3 sm:gap-8 shrink-0">
                      <div className="w-12 sm:w-16 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-[10px] sm:text-xs text-white shadow-sm" style={{ backgroundColor: config.primaryColor }}>EXAM</div>
                      <div className="w-12 sm:w-16 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-[10px] sm:text-xs text-white shadow-sm" style={{ backgroundColor: config.secondaryColor }}>TUTORIAL</div>
                    </div>
                  </div>

                  <ComparisonRow label="Timed Diagnostic Tracking" exam={true} tutorial={false} brandPrimary={config.primaryColor} />
                  <ComparisonRow label="Automated Weakness Flags" exam={true} tutorial={false} brandPrimary={config.primaryColor} />
                  <ComparisonRow label={config.tutorComparisonLabel || `${config.tutorLabel} Help Guidance`} exam={false} tutorial={true} brandPrimary={config.primaryColor} />
                  <ComparisonRow label="Interactive Code Sandboxes" exam={false} tutorial={true} brandPrimary={config.primaryColor} />
                  <ComparisonRow label="Issue Official Certification" exam={true} tutorial={false} brandPrimary={config.primaryColor} />
               </div>
            </div>

         </div>
      </section>
    </main>
  );
}
