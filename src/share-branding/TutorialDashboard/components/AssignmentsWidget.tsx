import React, { useState } from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { FileText, ArrowRight } from 'lucide-react';

export function AssignmentsWidget() {
  const brand = useBrand();
  const { assignments } = useTutorialDashboardData();
  const [activeTab, setActiveTab] = useState('Pending');

  const tabs = ['Pending', 'Submitted', 'Reviewed', 'Graded'];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-gray-900">Assignments</h3>
        <button className="text-xs font-bold hover:underline" style={{ color: brand.primaryColor }}>
          View All
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex space-x-1 border-b border-gray-100">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors ${
                isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
              {tab === 'Pending' && assignments.pendingCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] text-white">
                  {assignments.pendingCount}
                </span>
              )}
              {isActive && (
                <div 
                  className="absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-t-full" 
                  style={{ backgroundColor: brand.primaryColor }} 
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {assignments.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-50 bg-gray-50/50 p-3 transition-colors hover:bg-gray-50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
              <FileText size={18} />
            </div>
            
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-bold text-gray-900">{item.title}</span>
              <span className="text-[11px] font-semibold text-gray-500">{item.category}</span>
            </div>

            <span className="text-xs font-bold text-red-500 whitespace-nowrap">
              {item.dueText}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center border-t border-gray-100 pt-4">
        <button className="flex items-center gap-2 text-sm font-bold hover:underline" style={{ color: brand.primaryColor }}>
          View All Assignments <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
