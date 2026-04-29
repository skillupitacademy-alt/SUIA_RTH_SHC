import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { DashboardSyncTopic } from '../../tutorialDashboardData';
import { 
  TrendingUp, 
  AlertCircle, 
  AlertTriangle, 
  ArrowRight 
} from 'lucide-react';

export function EngineSynchronizationWidget() {
  const brand = useBrand();
  const { engineSync } = useTutorialDashboardData();

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'failed':
        return { 
          Icon: AlertCircle, 
          color: '#dc2626', // Red-600
          bg: '#fef2f2', 
          badgeBg: '#fee2e2', 
          badgeText: '#991b1b',
          barBg: '#dc2626'
        };
      case 'weak':
        return { 
          Icon: AlertTriangle, 
          color: '#d97706', // Amber-600
          bg: '#fffbeb', 
          badgeBg: '#fef3c7', 
          badgeText: '#92400e',
          barBg: '#f59e0b'
        };
      default:
        return { 
          Icon: AlertTriangle, 
          color: '#d97706', 
          bg: '#fffbeb', 
          badgeBg: '#fef3c7', 
          badgeText: '#92400e',
          barBg: '#f59e0b'
        };
    }
  };

  return (
    <div
      className="flex h-full flex-col rounded-[2.5rem] border border-gray-100 bg-white p-8 transition-transform duration-300 hover:-translate-y-1"
      style={{ boxShadow: `0 20px 50px rgba(${brand.primaryRgb}, 0.1)` }}
    >
      {/* Header */}
      <div className="flex items-center gap-5 mb-8">
        <div 
          className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <TrendingUp size={32} className="text-white" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Engine Synchronization</h3>
      </div>

      {/* Topics List */}
      <div className="flex flex-1 flex-col gap-6">
        {engineSync.topics.map((topic: DashboardSyncTopic, index: number) => {
          const styles = getStatusStyles(topic.status);
          const StatusIcon = styles.Icon;

          return (
            <div 
              key={index} 
              className="group relative flex flex-col rounded-3xl border border-gray-100 bg-gray-50/30 p-6 transition-all duration-300 hover:bg-white hover:shadow-xl hover:scale-[1.01]"
            >
              {/* Internal Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-2">
                  <h4 className="text-lg font-black text-gray-900 leading-none">{topic.title}</h4>
                  <div className="flex items-center gap-3">
                    <span 
                      className="rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wider"
                      style={{ backgroundColor: styles.badgeBg, color: styles.badgeText }}
                    >
                      {topic.statusLabel}
                    </span>
                    <span className="text-sm font-bold text-gray-600">Score: {topic.score}%</span>
                  </div>
                </div>
                <StatusIcon size={24} style={{ color: styles.color }} className="shrink-0" />
              </div>

              {/* Progress Bar */}
              <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-gray-200/60">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${topic.score}%`, backgroundColor: styles.barBg }}
                />
              </div>

              {/* Action Link */}
              <button className="flex items-center gap-1.5 self-start text-sm font-black text-gray-800 transition-all hover:gap-2">
                {topic.actionLabel}
                <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Button */}
      <div className="mt-8">
        <button 
          aria-label="Deploy personalized tutorial sequence"
          className="group flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-lg font-black text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95"
          style={{ backgroundColor: brand.primaryColor }}
        >
          Deploy Personalized Sequence
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
