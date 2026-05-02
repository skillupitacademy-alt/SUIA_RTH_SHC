import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

export function NotesLeftSidebar({ data, isOpen, activeId, onSelect }: { data: SubtopicNotesViewData['leftSidebar']; isOpen: boolean; activeId: string; onSelect: (id: string) => void }) {
  const brand = useBrand();

  const getIcon = (iconName: string) => {
    return (Icons as any)[iconName] || Icons.Circle;
  };

  return (
    <aside 
      aria-label="Learning Path Sidebar" 
      className={`fixed bottom-0 left-0 top-16 z-40 flex w-[78vw] flex-col overflow-y-auto bg-white p-4 hide-scrollbar transition-transform duration-300 shadow-2xl min-[440px]:w-[280px] sm:p-5 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      tabIndex={0}
      role="region"
    >
      <div className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-900">
        <Icons.BookOpen size={16} />
        {data.title}
      </div>

      <div className="flex-1 space-y-1">
        {data.items.map((item) => {
          const Icon = getIcon(item.icon);
          const isActive = item.id === activeId;
          const isCompleted = item.status === 'completed';
          const isLocked = item.status === 'locked';

          let itemColorClass = 'text-slate-800 hover:text-slate-950';
          let iconColorClass = 'text-slate-800';
          let bgClass = 'hover:bg-slate-50';

          if (isActive) {
            itemColorClass = 'font-bold text-primary-dark';
            iconColorClass = 'text-primary-dark';
            bgClass = '';
          } else if (isCompleted) {
            iconColorClass = 'text-emerald-950';
          } else if (isLocked) {
            itemColorClass = 'text-slate-700';
            iconColorClass = 'text-slate-700';
          }

          return (
            <button
              key={item.id}
              onClick={() => !isLocked && onSelect(item.id)}
              aria-label={`Learning path item: ${item.label}`}
              className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${bgClass} ${isActive ? 'bg-primary-dynamic bg-opacity-10' : ''}`}
            >
              <span className={`flex min-w-0 items-center gap-2.5 ${itemColorClass}`}>
                {isActive && <div className="absolute left-0 h-5 w-1 rounded-r-md bg-primary-dynamic" aria-hidden="true" />}
                <Icon size={14} className={`${iconColorClass} shrink-0`} aria-hidden="true" />
                <span className="min-w-0 break-words">{item.label}</span>
              </span>
              {isCompleted && <Icons.CheckCircle2 size={14} className="text-emerald-950 fill-emerald-50" aria-hidden="true" />}
              {isLocked && <Icons.Lock size={12} className="text-slate-800" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl bg-slate-100 p-5 text-center border border-slate-200">
        <div className="mb-4 text-[11px] font-bold text-slate-950">Subtopic Progress</div>
        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
          <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100" aria-hidden="true">
            <circle
              className="text-slate-200 transition-all duration-1000 ease-out"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
              r="46"
              cx="50"
              cy="50"
            />
            <circle
              className="transition-all duration-1000 ease-out"
              strokeWidth="6"
              strokeDasharray={289}
              strokeDashoffset={289 - (289 * data.progress.percentage) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="46"
              cx="50"
              cy="50"
              style={{ color: brand.primaryColor }}
            />
          </svg>
          <span className="text-lg font-bold text-slate-950">{data.progress.percentage}%</span>
        </div>
        <p className="mb-5 text-[10px] font-medium text-slate-800 leading-relaxed">
          {data.progress.message}
        </p>
        <button 
          className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold transition-all hover:bg-slate-200 active:scale-95 text-primary-dark border border-slate-300 bg-white"
        >
          <Icons.CheckCircle2 size={14} aria-hidden="true" />
          Mark as Complete
        </button>
      </div>
    </aside>
  );
}
