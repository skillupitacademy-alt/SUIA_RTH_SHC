'use client';

import { ReactNode } from 'react';
import { Globe } from 'lucide-react';

import { cn } from '@/lib/utils';

interface Props {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSelectAll: (checked: boolean) => void;
  selectAllChecked: boolean;
  leftIcon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function HierarchySearchBar({
  value,
  placeholder,
  onChange,
  onSelectAll,
  selectAllChecked,
  leftIcon,
  actions,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'bg-white/50 backdrop-blur-xl border border-primary/10 p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-wrap md:flex-nowrap items-start md:items-center justify-between gap-4 z-10',
        className,
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="p-2 rounded-xl bg-blue-50 text-blue-500 shadow-sm border border-blue-100 shrink-0">
          {leftIcon ?? <Globe className="w-5 h-5" />}
        </div>
        <div className="relative flex-1 group min-w-0">
          <input
            type="text"
            placeholder={placeholder}
            aria-label={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-[11px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none border border-transparent shadow-inner"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-100 cursor-pointer hover:border-blue-200 transition-all">
            <input
              type="checkbox"
              checked={selectAllChecked}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-offset-0 focus:ring-0 cursor-pointer"
              aria-label="Select all"
            />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Select All</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap justify-end">{actions}</div>
    </div>
  );
}
