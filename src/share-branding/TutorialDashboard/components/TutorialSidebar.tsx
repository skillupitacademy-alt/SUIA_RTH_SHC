import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { LayoutDashboard, BookOpen, Layers, Award, Shield, FileQuestion, BookMarked, Briefcase, PlayCircle, Clock, CheckCircle } from 'lucide-react';

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

  const renderNavGroup = (title: string, items: typeof navigation) => (
    <div className="mb-6">
      <h3 className="mb-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-600">{title}</h3>
      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = getIcon(item.label);
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`group flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive ? 'text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              style={isActive ? { backgroundColor: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' } : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon className={isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'} size={20} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-orange-700 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm xl:hidden"
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-gray-200 bg-white shadow-lg transition-transform duration-300 xl:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Brand Header */}
        <div className="flex h-20 items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl font-black text-white shadow-md" style={{ backgroundColor: brand.primaryColor }}>
              {brand.brandMark}
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black leading-tight text-gray-900">{brand.name}</span>
              <span className="text-[10px] font-bold tracking-wider text-gray-600 uppercase">
                {brand.accentColor === 'orange' ? 'AI-Powered Learning' : 'Mentor-Guided Learning'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
          <Link
            href="/dashboard"
            aria-label="Back to Dashboard"
            className="mb-8 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          {renderNavGroup('Tutorial Engine', navigation.slice(1, 10))}
          {renderNavGroup('Exam Engine', navigation.slice(10, 13))}
          {renderNavGroup('Career', navigation.slice(13))}
        </div>
      </aside>
    </>
  );
}
