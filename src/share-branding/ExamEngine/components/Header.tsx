import { BrandConfig } from '../../brandConfig';
import { Timer, User } from 'lucide-react';

interface HeaderProps {
  brand: BrandConfig;
}

export function Header({ brand }: HeaderProps) {
  return (
    <header className="h-[60px] bg-white/95 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-lg"
          style={{ backgroundColor: brand.primaryColor }}
        >
          {brand.name === 'RealTutorialHub' ? 'R' : 'S'}
        </div>
        <h1 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {brand.name}
        </h1>
      </div>

      {/* Center: Assessment Pulse Timer */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
        <div className="relative flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse"></div>
          <div className="absolute w-2 h-2 rounded-full bg-[#ef4444] animate-ping opacity-75"></div>
        </div>
        <Timer className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-semibold text-slate-700">45:32</span>
      </div>

      {/* Right: Student Profile */}
      <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
          <User className="w-5 h-5 text-slate-600" />
        </div>
        <div className="text-sm">
          <div className="font-semibold text-slate-900">John Doe</div>
          <div className="text-xs text-slate-500">Student ID: 12345</div>
        </div>
      </div>
    </header>
  );
}
