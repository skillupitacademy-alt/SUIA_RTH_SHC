import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { X, AlertTriangle, Check, ArrowRight } from 'lucide-react';

export function EngineSynchronizationWidget() {
  const brand = useBrand();
  const { engineSync } = useTutorialDashboardData();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'failed':
        return { Icon: X, color: '#ef4444', textColor: '#991b1b', bg: '#fef2f2', badgeBg: '#fee2e2', label: 'Failed' };
      case 'weak':
        return { Icon: AlertTriangle, color: '#f97316', textColor: '#9a3412', bg: '#fff7ed', badgeBg: '#ffedd5', label: 'Weak' };
      case 'mastered':
        return { Icon: Check, color: '#22c55e', textColor: '#166534', bg: '#f0fdf4', badgeBg: '#dcfce7', label: 'Mastered' };
      default:
        return { Icon: Check, color: '#94a3b8', textColor: '#374151', bg: '#f8fafc', badgeBg: '#f1f5f9', label: 'Unknown' };
    }
  };

  return (
    <div 
      className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 transition-transform duration-300 hover:-translate-y-1"
      style={{ boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-black text-gray-900">Engine Synchronization</h3>
        <button 
          aria-label="View all engine synchronization details"
          className="text-xs font-bold hover:underline" 
          style={{ color: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }}
        >
          View All
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {engineSync.topics.map((topic, index) => {
          const config = getStatusConfig(topic.status);
          const Icon = config.Icon;

          return (
            <div key={index} className="flex items-center gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
              <div 
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" 
                style={{ backgroundColor: config.bg, color: config.textColor }}
              >
                <Icon size={18} />
              </div>
              
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-bold text-gray-900">{topic.title}</span>
                <span className="text-xs font-semibold text-gray-700">{topic.subtext}</span>
              </div>

              <span 
                className="rounded-full px-3 py-1 text-[10px] font-bold tracking-wide"
                style={{ backgroundColor: config.badgeBg, color: config.textColor }}
              >
                {config.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center border-t border-gray-100 pt-4">
        <button 
          aria-label="Auto-deploy tutorial sequence for remediation"
          className="flex items-center gap-2 text-sm font-bold hover:underline" 
          style={{ color: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }}
        >
          Auto-Deploy Tutorial Sequence <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
