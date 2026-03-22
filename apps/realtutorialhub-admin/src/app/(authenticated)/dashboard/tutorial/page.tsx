'use client';

import { History, LayoutGrid, ListChecks, ScrollText, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ContextSelector } from '@/components/factory/blueprint/ContextSelector';
import { FactoryLayout } from '@/components/layout/FactoryLayout';
import { useDomains, useSubjects, useSubtopics, useTopics } from '@/hooks/useAdminHierarchy';
import { cn } from '@/lib/utils';
import { useTutorialFactoryStore } from '@/store/tutorial-factory-store';

import AssignmentFactoryPage from '../assignments/page';
import ContentFactoryPage from '../content/page';

type TutorialVersionRow = {
  id: string;
  contentId: string;
  version: number;
  savedBy: string;
  createdAt: string;
  subtopicId?: string;
  difficulty?: 'simple' | 'mixed' | 'intermediate' | 'expert';
};

type TutorialAuditRow = {
  id: string;
  contentId: string;
  userId: string;
  action: 'created' | 'updated' | 'published' | 'unpublished' | 'restored';
  diff: Record<string, unknown> | null;
  createdAt: string;
};

type TutorialRouteResponse<T> = {
  data?: T[];
  error?: string;
};

const TAB_ITEMS = [
  { key: 'content', label: 'Content', icon: LayoutGrid },
  { key: 'assignments', label: 'Assignments', icon: ListChecks },
  { key: 'versions', label: 'Version History', icon: History },
  { key: 'audit', label: 'Audit Log', icon: ScrollText },
] as const;

type TabKey = (typeof TAB_ITEMS)[number]['key'];

function formatTimestamp(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function TutorialDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('content');
  const selection = useTutorialFactoryStore((state) => state.selection);
  const setSelection = useTutorialFactoryStore((state) => state.setSelection);
  const resetSelection = useTutorialFactoryStore((state) => state.resetSelection);
  const { data: domains } = useDomains();
  const { data: subjects } = useSubjects(selection.domainId !== '' ? selection.domainId : undefined);
  const { data: topics } = useTopics(selection.subjectId !== '' ? selection.subjectId : undefined);
  const { data: subtopics } = useSubtopics(selection.topicId !== '' ? selection.topicId : undefined);
  const [versions, setVersions] = useState<TutorialVersionRow[]>([]);
  const [auditEntries, setAuditEntries] = useState<TutorialAuditRow[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const resolvedNames = useMemo(() => {
    const domainName = domains.find((item) => item.id === selection.domainId)?.name ?? 'Selected Domain';
    const subjectName = subjects.find((item) => item.id === selection.subjectId)?.name ?? 'Selected Subject';
    const topicName = topics.find((item) => item.id === selection.topicId)?.name ?? 'Selected Topic';
    const subtopicName = subtopics.find((item) => item.id === selection.subtopicId)?.name ?? 'Selected Subtopic';
    return { domainName, subjectName, topicName, subtopicName };
  }, [domains, selection.domainId, selection.subjectId, selection.topicId, selection.subtopicId, subjects, subtopics, topics]);

  const selectionComplete = selection.domainId !== '' && selection.subjectId !== '' && selection.topicId !== '' && selection.subtopicId !== '';

  useEffect(() => {
    if (selection.subtopicId === '') {
      setVersions([]);
      setAuditEntries([]);
      return;
    }

    const controller = new AbortController();

    const loadVersionHistory = async () => {
      setLoadingVersions(true);
      try {
        const response = await fetch(`/api/tutorial/content/versions?subtopicId=${encodeURIComponent(selection.subtopicId)}`, {
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null) as TutorialRouteResponse<Record<string, unknown>> | null;
        if (response.ok === false) {
          throw new Error(payload?.error ?? 'Failed to load version history.');
        }

        setVersions(
          Array.isArray(payload?.data)
            ? payload.data.map((item) => ({
                id: String(item.id ?? ''),
                contentId: String(item.contentId ?? ''),
                version: Number(item.version ?? 0),
                savedBy: String(item.savedBy ?? ''),
                createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
                subtopicId: typeof item.subtopicId === 'string' ? item.subtopicId : selection.subtopicId,
                difficulty: (item.difficulty as TutorialVersionRow['difficulty']) ?? undefined,
              }))
            : []
        );
      } catch (error) {
        if ((error as { name?: string } | null)?.name !== 'AbortError') {
          toast.error(error instanceof Error ? error.message : 'Failed to load version history.');
        }
      } finally {
        setLoadingVersions(false);
      }
    };

    const loadAudit = async () => {
      setLoadingAudit(true);
      try {
        const response = await fetch(`/api/tutorial/content/audit?subtopicId=${encodeURIComponent(selection.subtopicId)}`, {
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null) as TutorialRouteResponse<Record<string, unknown>> | null;
        if (response.ok === false) {
          throw new Error(payload?.error ?? 'Failed to load audit log.');
        }

        setAuditEntries(
          Array.isArray(payload?.data)
            ? payload.data.map((item) => ({
                id: String(item.id ?? ''),
                contentId: String(item.contentId ?? ''),
                userId: String(item.userId ?? ''),
                action: (item.action as TutorialAuditRow['action']) ?? 'updated',
                diff: item.diff != null && typeof item.diff === 'object' ? (item.diff as Record<string, unknown>) : null,
                createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
              }))
            : []
        );
      } catch (error) {
        if ((error as { name?: string } | null)?.name !== 'AbortError') {
          toast.error(error instanceof Error ? error.message : 'Failed to load audit log.');
        }
      } finally {
        setLoadingAudit(false);
      }
    };

    void loadVersionHistory();
    void loadAudit();

    return () => controller.abort();
  }, [selection.subtopicId]);

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

  const handleRestore = async (version: TutorialVersionRow) => {
    if (version.contentId === '' || version.id === '') {
      return;
    }

    try {
      const response = await fetch(`/api/tutorial/content/${version.contentId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ versionId: version.id }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (response.ok === false) {
        throw new Error(payload?.error ?? 'Failed to restore version.');
      }
      toast.success(`Restored version ${version.version}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to restore version.');
    }
  };

  const activeTabLabel = TAB_ITEMS.find((item) => item.key === activeTab)?.label ?? 'Content';

  return (
    <FactoryLayout title="Tutorial Dashboard" subtitle="Unified content and assignment workspace" backPath="/dashboard">
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
        <div className="max-w-[1600px] mx-auto p-8 space-y-8 pb-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/70">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles size={20} className="text-[#FF4B91]" />
                <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Unified Tutorial Factory</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-[#1A1A1A]">Tutorial Dashboard</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">
                Domain • Subject • Topic • Subtopic • Difficulty
              </p>
            </div>
            <div className="flex flex-col items-end gap-3 text-right">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                <Sparkles size={14} className="text-[#FF4B91]" />
                {activeTabLabel} tab active
              </div>
              <button
                type="button"
                onClick={() => resetSelection()}
                className="h-11 px-4 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm"
              >
                Reset Selection
              </button>
            </div>
          </div>

          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 bg-[#FF4B91] rounded-full" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Shared Target Context</h3>
            </div>

            <ContextSelector selections={selection} onChange={updateSelection} />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className={cn('rounded-[1.5rem] border p-4', selectionComplete ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60')}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Selection Status</p>
                <p className="mt-2 text-sm font-bold text-slate-700">{selectionComplete ? 'Ready for creation' : 'Select all 5 fields'}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Domain</p>
                <p className="mt-2 text-sm font-bold text-slate-700">{resolvedNames.domainName}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Subtopic</p>
                <p className="mt-2 text-sm font-bold text-slate-700">{resolvedNames.subtopicName}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Difficulty</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(['simple', 'mixed', 'intermediate', 'expert'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelection({ difficulty: value })}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all',
                        selection.difficulty === value
                          ? 'border-[#FF4B91] bg-[#FF4B91]/5 text-[#FF4B91]'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
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
              {activeTab === 'content' ? <ContentFactoryPage /> : null}
              {activeTab === 'assignments' ? <AssignmentFactoryPage /> : null}

              {activeTab === 'versions' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">Version History</h2>
                      <p className="mt-1 text-sm text-slate-500">Snapshots for the selected subtopic.</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      {loadingVersions ? 'Loading...' : `${versions.length} snapshots`}
                    </span>
                  </div>
                  {selection.subtopicId === '' ? (
                    <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-slate-500">
                      Select a full context to view version history.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {versions.map((version) => (
                        <div key={version.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-[#FF4B91]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#FF4B91]">
                                Version {version.version}
                              </span>
                              {version.difficulty != null ? (
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                  {version.difficulty}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm font-semibold text-slate-700">Saved by {version.savedBy}</p>
                            <p className="text-xs text-slate-500">{formatTimestamp(version.createdAt)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { void handleRestore(version); }}
                            className="h-10 px-4 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                      {versions.length === 0 ? (
                        <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
                          No version snapshots found for the selected subtopic.
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === 'audit' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">Audit Log</h2>
                      <p className="mt-1 text-sm text-slate-500">Activity records for the selected subtopic.</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      {loadingAudit ? 'Loading...' : `${auditEntries.length} events`}
                    </span>
                  </div>
                  {selection.subtopicId === '' ? (
                    <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-slate-500">
                      Select a full context to view audit logs.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {auditEntries.map((entry) => (
                        <div key={entry.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                                {entry.action}
                              </span>
                              <p className="mt-2 text-sm font-semibold text-slate-700">User: {entry.userId}</p>
                              <p className="text-xs text-slate-500">{formatTimestamp(entry.createdAt)}</p>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Content {entry.contentId}</span>
                          </div>
                          <pre className="mt-4 overflow-x-auto rounded-2xl bg-white p-4 text-[11px] leading-6 text-slate-600">
                            {JSON.stringify(entry.diff ?? {}, null, 2)}
                          </pre>
                        </div>
                      ))}
                      {auditEntries.length === 0 ? (
                        <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
                          No audit entries found for the selected subtopic.
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </FactoryLayout>
  );
}
