import { BrandConfig } from '../../brandConfig';
import { Timer, User } from 'lucide-react';

interface HeaderProps {
  brand: BrandConfig;
}

export function Header({ brand }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur-md sm:px-4 lg:px-6">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3 lg:gap-4">
        <div className="col-span-2 flex items-center gap-3 sm:col-span-1 sm:flex-none">
        <div 
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg font-black text-white"
          style={{ backgroundColor: brand.primaryColor }}
        >
          {brand.name === 'RealTutorialHub' ? 'R' : 'S'}
        </div>
        <h1 className="text-sm font-extrabold leading-tight text-slate-900 sm:text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {brand.name}
        </h1>
      </div>

      <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="relative flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse"></div>
          <div className="absolute w-2 h-2 rounded-full bg-[#ef4444] animate-ping opacity-75"></div>
        </div>
        <Timer className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-semibold text-slate-700">45:32</span>
      </div>

      <div className="flex min-w-0 items-center justify-end sm:flex-1 sm:justify-end">
        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
          <User className="w-5 h-5 text-slate-600" />
        </div>
        <div className="min-w-0 text-right text-xs leading-tight sm:text-sm">
          <div className="font-semibold text-slate-900">John Doe</div>
          <div className="text-xs text-slate-600 max-[359px]:hidden">Student ID: 12345</div>
        </div>
      </div>
      </div>
      </div>
    </header>
  );
}
