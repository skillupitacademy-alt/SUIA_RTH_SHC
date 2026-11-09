'use client';

import { AlertCircle, History, LayoutGrid, ListChecks, ScrollText, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { ContextSelector } from '@/components/factory/blueprint/ContextSelector';
import { FactoryLayout } from '@/components/layout/FactoryLayout';
import { cn } from '@/lib/utils';
import { useTutorialFactoryStore } from '@/store/tutorial-factory-store';

import AssignmentFactoryPage from '../assignments/page';
import ContentFactoryPage from '../content/page';

const TAB_ITEMS = [
  { key: 'content', label: 'Content', icon: LayoutGrid },
  { key: 'assignments', label: 'Assignments', icon: ListChecks },
  { key: 'versions', label: 'Version History', icon: History },
  { key: 'audit', label: 'Audit Log', icon: ScrollText },
] as const;

type TabKey = (typeof TAB_ITEMS)[number]['key'];

export default function TutorialDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('content');
  const selection = useTutorialFactoryStore((state) => state.selection);
  const setSelection = useTutorialFactoryStore((state) => state.setSelection);

  const updateSelection = (field: 'domainId' | 'subjectId' | 'topicId' | 'subtopicId', value: string) => {
    const next: Record<string, string> = { [field]: value };
    if (field === 'domainId') {
      next.subjectId = '';
      next.topicId = '';
      next.subtopicId = '';
    }
    if (field === 'subjectId') {
      next.topicId = '';
      next.subtopicId = '';
    }
    if (field === 'topicId') {
      next.subtopicId = '';
    }
    setSelection(next);
  };

  const activeTabLabel = TAB_ITEMS.find((item) => item.key === activeTab)?.label ?? 'Content';

  return (
    <FactoryLayout title="Tutorial Dashboard" subtitle="Unified content and assignment workspace" backPath="/dashboard">
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
        <div className="max-w-[1600px] mx-auto p-8 space-y-8 pb-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF4B91]/5 border border-[#FF4B91]/10 text-[10px] font-black uppercase tracking-widest text-[#FF4B91] shadow-sm">
                <Sparkles size={14} />
                Tutorial Workspace
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                <Sparkles size={14} className="text-[#FF4B91]" />
                {activeTabLabel} tab active
              </div>
            </div>
          </div>

          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">Curriculum Context</h2>
            <p className="text-sm text-slate-500">Select target domain, subject, topic, and subtopic.</p>
            <div className="pt-2">
              <ContextSelector
                selections={selection}
                onChange={updateSelection}
              />
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap gap-3">
                {TAB_ITEMS.map((tab) => {
                  const active = tab.key === activeTab;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-all',
                        active
                          ? 'border-[#FF4B91] bg-[#FF4B91]/5 text-[#FF4B91]'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      )}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {activeTab === 'content' ? <ContentFactoryPage embedded /> : null}
              {activeTab === 'assignments' ? <AssignmentFactoryPage embedded /> : null}

              {activeTab === 'versions' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">Version History</h2>
                      <p className="mt-1 text-sm text-slate-500">Tutorial version history and snapshot management.</p>
                    </div>
                  </div>
                  <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50/70 p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 mb-3">
                      <AlertCircle size={24} />
                    </div>
                    <h3 className="text-base font-black uppercase tracking-tight text-amber-900 mb-2">Version Management Centralized in SHC Admin</h3>
                    <p className="text-xs text-amber-800 max-w-xl mx-auto leading-relaxed">
                      Publication versioning and immutable snapshots for block-based tutorials are exclusively managed in SHC Admin Tutorial Composer (<code>/tools/tutorial-page-content</code>). Direct version inspection and restoration from RTH Admin are permanently retired.
                    </p>
                  </div>
                </div>
              ) : null}

              {activeTab === 'audit' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">Audit Log</h2>
                      <p className="mt-1 text-sm text-slate-500">Tutorial publication activity and audit trail.</p>
                    </div>
                  </div>
                  <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50/70 p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 mb-3">
                      <AlertCircle size={24} />
                    </div>
                    <h3 className="text-base font-black uppercase tracking-tight text-amber-900 mb-2">Tutorial Audit Logs Centralized in SHC Admin</h3>
                    <p className="text-xs text-amber-800 max-w-xl mx-auto leading-relaxed">
                      Tutorial publication activity and audit records are tracked authoritatively in SHC Admin. Direct audit trail queries from RTH Admin are permanently retired.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </FactoryLayout>
  );
}
