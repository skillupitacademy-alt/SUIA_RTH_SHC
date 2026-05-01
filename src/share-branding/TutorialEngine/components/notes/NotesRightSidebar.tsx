import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

export function NotesRightSidebar({ data, isOpen, activeTab }: { data: SubtopicNotesViewData['rightSidebar']; isOpen: boolean; activeTab: string }) {
  const brand = useBrand();

  return (
    <aside aria-label="Tools and statistics sidebar" className={`absolute bottom-0 right-0 top-0 z-40 flex w-[350px] flex-col overflow-y-auto border-l border-gray-200 bg-white p-5 hide-scrollbar transition-transform duration-300 ${isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-none'}`}>
      <div className="space-y-6">
        
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
            <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
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
            <section className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
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
             <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] border-gray-100">
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
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-gray-100 p-4">
             <span className="text-lg font-black text-emerald-700">+{data.xpStats.earned} XP</span>
             <span className="text-xs font-bold text-slate-600 flex items-center gap-1">Total XP: {data.xpStats.total} <Icons.Star size={12} aria-hidden="true" /></span>
          </div>
        </section>

        {/* Related Subtopics */}
        <section>
          <h2 className="mb-4 text-[13px] font-bold text-gray-900">Related Subtopics</h2>
          <div className="space-y-2">
            {data.relatedSubtopics.map(sub => (
              <button key={sub.id} className="flex w-full items-center justify-between rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors text-left">
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
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
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
