'use client';

import React from 'react';
import { CheckCircle2, Circle, Lock, MoreVertical } from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface SubtopicSidebarProps {
  data: {
    subtopicsTitle: string;
    items: {
      id: string;
      title: string;
      status: 'completed' | 'active' | 'locked';
      isCurrent?: boolean;
    }[];
  };
  progress: {
    percentage: number;
    checklist: { label: string; completed: boolean }[];
  };
  isOpen: boolean;
  onToggle: () => void;
}

export function SubtopicSidebar({ data, progress, isOpen, onToggle }: SubtopicSidebarProps) {
  const brand = useBrand();

  return (
    <aside className={`flex h-full w-[320px] flex-col border-r border-gray-200 bg-white transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Progress Overview Section */}
        <div className="border-b border-gray-100 p-6 bg-slate-50/50">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Overall Progress</h3>
            <span className="text-sm font-black text-primary" style={{ color: brand.primaryColor }}>{progress.percentage}%</span>
          </div>
          
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div 
              className="absolute left-0 top-0 h-full transition-all duration-500"
              style={{ width: `${progress.percentage}%`, backgroundColor: brand.primaryColor }}
            />
          </div>

          <div className="mt-4 space-y-2">
            {progress.checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {item.completed ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <Circle size={14} className="text-gray-300" />
                )}
                <span className={`text-xs ${item.completed ? 'text-gray-700 font-medium' : 'text-gray-400 font-normal'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Curriculum List */}
        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
          <div className="mb-4 px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Curriculum</h3>
            <h4 className="text-sm font-extrabold text-gray-800">{data.subtopicsTitle}</h4>
          </div>

          <div className="space-y-1">
            {data.items.map((item) => (
              <div 
                key={item.id}
                className={`group relative flex items-center justify-between rounded-xl p-3 transition-all cursor-pointer ${
                  item.isCurrent 
                  ? 'bg-slate-100 shadow-sm border border-slate-200' 
                  : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {item.status === 'completed' && (
                      <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-50" />
                    )}
                    {item.status === 'active' && (
                      <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2" style={{ borderColor: brand.primaryColor }}>
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: brand.primaryColor }} />
                      </div>
                    )}
                    {item.status === 'locked' && (
                      <Lock size={16} className="text-gray-300" />
                    )}
                  </div>
                  <span className={`text-sm font-bold transition-colors ${
                    item.isCurrent ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'
                  }`}>
                    {item.title}
                  </span>
                </div>
                {item.isCurrent && (
                   <div className="h-5 w-1 rounded-full absolute right-0" style={{ backgroundColor: brand.primaryColor }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
