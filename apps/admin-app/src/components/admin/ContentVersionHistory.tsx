'use client';

import type { TutorialContentJSON } from '@quiz/types';
import { Clock3, RotateCcw } from 'lucide-react';

import { cn, formatTimeAgo } from '@/lib/utils';

export interface ContentVersionEntry {
    id: string;
    version: number;
    savedBy: string;
    savedAt: string;
    status: 'draft' | 'published';
    note?: string;
    content?: TutorialContentJSON;
}

interface ContentVersionHistoryProps {
    versions: ContentVersionEntry[];
    currentVersionId: string;
    onRestore: (versionId: string) => void;
}

export function ContentVersionHistory({ versions, currentVersionId, onRestore }: ContentVersionHistoryProps) {
    return (
        <section className="rounded-[1.75rem] border border-slate-200 bg-white/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/80">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Version History</h4>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">Restore any saved snapshot of the tutorial block set.</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        <Clock3 size={12} />
                        <span>{versions.length} versions</span>
                    </div>
                </div>
            </div>

            <div className="max-h-[520px] overflow-y-auto">
                {versions.map((version) => {
                    const isCurrent = version.id === currentVersionId;

                    return (
                        <article
                            key={version.id}
                            className={cn(
                                'border-b border-slate-100 p-4 transition-colors last:border-b-0',
                                isCurrent ? 'bg-indigo-50/60' : 'bg-white hover:bg-slate-50/80'
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-900">Version {version.version}</span>
                                        <span
                                            className={cn(
                                                'rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em]',
                                                version.status === 'published'
                                                    ? 'bg-emerald-500/10 text-emerald-700'
                                                    : 'bg-amber-500/10 text-amber-700'
                                            )}
                                        >
                                            {version.status}
                                        </span>
                                        {isCurrent ? (
                                            <span className="rounded-full bg-indigo-600/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-indigo-700">
                                                Current
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                                        Saved by <span className="font-semibold text-slate-700">{version.savedBy}</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500">{formatTimeAgo(version.savedAt)}</p>
                                    {version.note != null && version.note !== '' ? (
                                        <p className="mt-2 text-[11px] leading-5 text-slate-600">{version.note}</p>
                                    ) : null}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onRestore(version.id)}
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all',
                                        isCurrent
                                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-700'
                                    )}
                                >
                                    <RotateCcw size={12} />
                                    Restore
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
