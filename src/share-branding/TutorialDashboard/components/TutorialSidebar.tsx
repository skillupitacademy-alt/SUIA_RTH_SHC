import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { DashboardNavItem } from '../../tutorialDashboardData';
import { 
  LayoutDashboard, 
  BookOpen, 
  Layers, 
  Award, 
  Shield, 
  FileQuestion, 
  BookMarked, 
  Briefcase, 
  PlayCircle, 
  Clock, 
  CheckCircle,
  X
} from 'lucide-react';

export function TutorialSidebar({ isOpen = false, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const brand = useBrand();
  const { navigation } = useTutorialDashboardData();
  const pathname = usePathname();

  // Helper to resolve generic icon mappings based on label strings
  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'dashboard': return LayoutDashboard;
      case 'domains': return Layers;
      case 'subjects': return BookOpen;
      case 'topics': return Shield;
      case 'my learning': return PlayCircle;
      case 'assignments': return CheckCircle;
      case 'projects': return Briefcase;
      case 'bookmarks': return BookMarked;
      case 'notes': return BookOpen;
      case 'launch exam': return FileQuestion;
      case 'practice tests': return Clock;
      case 'my results': return Award;
      case 'career readiness': return Briefcase;
      case 'resume builder': return BookOpen;
      case 'certifications': return Award;
      default: return BookOpen;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Drawer Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[60] flex w-[280px] flex-col bg-white border-r border-gray-100 shadow-2xl transition-transform duration-500 ease-in-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header with Logo & Close Button */}
        <div className="flex items-center justify-between p-6">
          <div className="flex min-w-0 items-center gap-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black text-white shadow-lg"
              style={{ backgroundColor: brand.primaryColor }}
            >
              {brand.brandMark}
            </div>
            <span className="min-w-0 break-words text-xl font-black tracking-tight text-gray-900">{brand.name}</span>
          </div>
          <button 
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items - Scrollable area */}
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          {navigation.map((item: DashboardNavItem) => {
            const Icon = getIcon(item.label);
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex min-w-0 items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-300 ${
                  isActive 
                    ? 'shadow-lg shadow-orange-500/10' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
                style={{ 
                  backgroundColor: isActive ? brand.primaryColor : 'transparent',
                  color: isActive ? '#ffffff' : undefined
                }}
              >
                <Icon 
                  size={22} 
                  className={`transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'}`} 
                />
                <span className="min-w-0 flex-1 break-words text-sm font-bold tracking-tight">{item.label}</span>
                
                {item.badge && (
                  <span 
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Brand Footer */}
        <div className="p-6 border-t border-gray-50">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Current Workspace</p>
            <p className="break-words text-sm font-black text-gray-900">{brand.name} Portal</p>
          </div>
        </div>
      </aside>
    </>
  );
}
