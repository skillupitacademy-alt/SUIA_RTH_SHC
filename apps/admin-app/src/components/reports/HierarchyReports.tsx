'use client';

import { apiClient } from '@quiz/api-client';
import { recordCounter } from '@quiz/observability';
import { ZLoader } from '@quiz/ui';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    ChevronRight,
    Database,
    Filter,
    Home,
    RefreshCw,
    Search,
    ShieldCheck,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { PageTitle } from '@/components/layout/PageTitle';
import { cn } from '@/lib/utils';
import { clientLogger } from '@/utils/clientLogger';

interface HierarchyItem {
    id: string;
    name: string;
    stats: {
        total: number;
        simple: number;
        intermediate: number;
        expert: number;
        isReady: boolean;
    };
    subjects?: HierarchyItem[];
    topics?: HierarchyItem[];
    subtopics?: HierarchyItem[];
}

interface ViewState {
    level: 'domain' | 'subject' | 'topic' | 'subtopic';
    data: HierarchyItem[];
    title: string;
    parentName?: string;
}

export const HierarchyReports: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<HierarchyItem[]>([]);
    const [viewStack, setViewStack] = useState<ViewState[]>([{ level: 'domain', data: [], title: 'Global Domains' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);

    const currentView: ViewState = viewStack[viewStack.length - 1] ?? { level: 'domain', data: [], title: 'Global Domains' };

    useEffect(() => {
        void fetchReport();
    }, []);

    const fetchReport = async () => {
        setIsPageLoading(true);
        try {
            const data = await apiClient.admin.getContentHealthReport();
            await new Promise(r => setTimeout(r, 800)); // Diagnostic delay for ZLoader
            // Transform for consistent display
            const normalizedData: HierarchyItem[] = Array.isArray(data) ? (data as unknown as Record<string, unknown>[]).map((d) => ({
                id: d.domainId as string,
                name: d.domainName as string,
                stats: d.stats as HierarchyItem['stats'],
                subjects: Array.isArray(d.subjects) ? (d.subjects as Record<string, unknown>[]).map((s) => ({
                    id: s.id as string,
                    name: s.name as string,
                    stats: s.stats as HierarchyItem['stats'],
                    topics: Array.isArray(s.topics) ? (s.topics as Record<string, unknown>[]).map((t) => ({
                        id: t.id as string,
                        name: t.name as string,
                        stats: t.stats as HierarchyItem['stats'],
                        subtopics: Array.isArray(t.subtopics) ? (t.subtopics as Record<string, unknown>[]).map((st) => ({
                            id: st.id as string,
                            name: st.name as string,
                            stats: st.stats as HierarchyItem['stats']
                        })) : []
                    })) : []
                })) : []
            })) : [];
            setReportData(normalizedData);
            setViewStack([{ level: 'domain', data: normalizedData, title: 'Global Domains' }]);

            if (normalizedData.length === 0) {
                recordCounter('admin.ui.reports.hierarchy.empty', 1);
            } else {
                recordCounter('admin.ui.reports.hierarchy.fetch_success', 1, { count: normalizedData.length });
            }
        } catch (error) {
            recordCounter('admin.ui.reports.hierarchy.fetch_error', 1, { reason: error instanceof Error ? error.message : 'unknown' });
            clientLogger.error('Failed to fetch hierarchy report', { error: error instanceof Error ? error.message : 'unknown' });
        } finally {
            setLoading(false);
            setIsPageLoading(false);
        }
    };

    const handleDrillDown = async (item: HierarchyItem, nextLevel: 'domain' | 'subject' | 'topic' | 'subtopic') => {
        setIsActionLoading(true);
        await new Promise(r => setTimeout(r, 1000)); // Diagnostic delay for Activity
        setIsActionLoading(false);

        let nextData: HierarchyItem[] = [];
        let title = '';

        if (nextLevel === 'subject') {
            nextData = item.subjects ?? [];
            title = `Domain: ${item.name}`;
        } else if (nextLevel === 'topic') {
            nextData = item.topics ?? [];
            title = `Subject: ${item.name}`;
        } else if (nextLevel === 'subtopic') {
            nextData = item.subtopics ?? [];
            title = `Topic: ${item.name}`;
        }

        setViewStack([...viewStack, { level: nextLevel, data: nextData, title, parentName: item.name }]);
        recordCounter('admin.ui.reports.hierarchy.drill_down', 1, { from: currentView.level, to: nextLevel, name: item.name });
        setSearchQuery('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        if (viewStack.length > 1) {
            setViewStack(viewStack.slice(0, -1));
        }
    };

    const filteredData = currentView.data.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && reportData.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
                <ZLoader size="lg" text="Initializing Diagnostic Matrix_" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1 animate-pulse">Syncing Pulse Diagnostic (Unified Activity)</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b-2 border-primary/5">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        {viewStack.length > 1 && (
                            <button
                                onClick={handleBack}
                                className="p-3 rounded-2xl bg-white border-2 border-primary/5 text-primary hover:bg-[#FF4B91] hover:text-white hover:scale-105 transition-all shadow-lg active:scale-95"
                            >
                                <ArrowLeft size={24} />
                            </button>
                        )}
                        <div>
                            <PageTitle
                                text={`${currentView.level.charAt(0).toUpperCase() + currentView.level.slice(1)} Intelligence`}
                                className="leading-none"
                            />
                            <div className="flex items-center gap-3 mt-4">
                                <div className="px-3 py-1 bg-[#1A1A1A] text-[#FF4B91] rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    {currentView.title}
                                </div>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                    Showing {filteredData.length} Containers
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Filter hierarchy..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-primary/5 rounded-3xl text-sm font-bold tracking-tight focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-muted-foreground shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => { void fetchReport(); }}
                        className="p-4 bg-white border-2 border-primary/5 rounded-2xl text-primary hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        title="Refresh Registry"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Breadcrumbs for easier navigation */}
            {viewStack.length > 1 && (
                <div className="flex items-center gap-3 p-4 bg-[#FAFAFA] rounded-2xl border-2 border-primary/5 overflow-x-auto custom-scrollbar">
                    <button
                        onClick={() => setViewStack([viewStack[0]])}
                        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] hover:bg-primary hover:text-white transition-all shadow-sm shrink-0"
                    >
                        <Home size={12} /> Global
                    </button>
                    {viewStack.slice(1).map((v, i) => (
                        <React.Fragment key={i}>
                            <ChevronRight size={14} className="text-slate-300 shrink-0" />
                            <button
                                onClick={() => setViewStack(viewStack.slice(0, i + 2))}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm shrink-0",
                                    i === viewStack.length - 2
                                        ? "bg-primary text-white border-primary"
                                        : "bg-white text-[#1A1A1A] hover:bg-primary/10"
                                )}
                            >
                                {v.parentName}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* Tabular Layout Container */}
            {filteredData.length > 0 ? (
                <div className="rounded-[2.5rem] border border-primary/10 bg-white/50 backdrop-blur-xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#1A1A1A]/5">
                                <tr>
                                    <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-500">Identity Container</th>
                                    <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-500">Volumetric Data</th>
                                    <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-500">Nature Breakdown</th>
                                    <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-500">Readiness Registry</th>
                                    <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-500 text-right">Navigation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-primary/5">
                                {filteredData.map((item) => (
                                    <tr key={item.id} className="group hover:bg-[#FF4B91]/5 transition-all duration-300">
                                        <td className="p-8">
                                            <div className="flex items-center gap-6">
                                                <div className={cn(
                                                    "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                                                    item.stats.isReady === true ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                )}>
                                                    <Database size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black text-[#1A1A1A] tracking-tighter uppercase group-hover:text-[#FF4B91] transition-colors">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                        {currentView.level === 'domain' ? 'Domain Entity' :
                                                            currentView.level === 'subject' ? 'Subject Module' :
                                                                'Topic Component'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Zap size={14} className="text-[#FF4B91]" />
                                                    <span className="text-xl font-black tracking-tighter text-[#1A1A1A]">
                                                        {item.stats.total}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Questions Loaded</span>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex gap-4">
                                                <MetricSmall label="S" value={item.stats.simple} color="text-green-500" />
                                                <MetricSmall label="I" value={item.stats.intermediate} color="text-blue-500" />
                                                <MetricSmall label="E" value={item.stats.expert} color="text-red-500" />
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            {item.stats.isReady === true ? (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl border border-green-100 w-fit shrink-0">
                                                    <ShieldCheck size={14} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Certified</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-100 w-fit shrink-0">
                                                    <AlertTriangle size={14} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Incomplete</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-8 text-right">
                                            <button
                                                onClick={() => {
                                                    void handleDrillDown(item,
                                                        currentView.level === 'domain' ? 'subject' :
                                                            currentView.level === 'subject' ? 'topic' : 'subtopic'
                                                    );
                                                }}
                                                className="px-6 py-3 bg-white border-2 border-primary/5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-[#1A1A1A] hover:text-white hover:scale-105 transition-all active:scale-95"
                                            >
                                                Enter Container
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredData.length > 0 && currentView.level === 'subtopic' && (
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={5} className="p-4 text-center text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">
                                            End of Hierarchical Matrix
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="py-32 flex flex-col items-center justify-center text-center bg-white rounded-[3rem] border-2 border-dashed border-primary/10 animate-in zoom-in-95 duration-500">
                    <div className="p-8 bg-slate-50 rounded-full mb-8 shadow-inner ring-1 ring-slate-100">
                        <Filter className="text-slate-300 w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tighter">Negative Intelligence</h3>
                    <p className="text-muted-foreground font-medium mt-2 max-w-sm">
                        No containers found matching your filter criteria in this hierarchical branch.
                    </p>
                </div>
            )}

            {/* Diagnostic Overlays */}
            {isActionLoading ? <div className="fixed inset-0 z-[300] bg-white/40 backdrop-blur-[4px] flex items-center justify-center animate-in fade-in duration-300">
                <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.1)] border-2 border-primary/5 flex flex-col items-center gap-4 scale-100">
                    <ZLoader size="lg" text="Accessing Branch_" />
                </div>
            </div> : null}

            {isPageLoading ? <div className="fixed inset-0 z-[300] bg-black/10 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.15)] border-2 border-[#FF4B91]/10 flex flex-col items-center gap-6">
                    <ZLoader size="lg" text="Standardizing Metrics..." />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-4">Loader: ZLoader (Premium)</p>
                </div>
            </div> : null}

            {/* Footer Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <SummaryPanel
                    icon={Activity}
                    label="System Velocity"
                    value="Active"
                    subvalue="Real-time sync"
                    color="text-blue-500"
                    bg="bg-blue-50"
                />
                <SummaryPanel
                    icon={ShieldCheck}
                    label="Content Readiness"
                    value={`${reportData.length > 0 ? Math.round((reportData.filter(d => d.stats.isReady === true).length / reportData.length) * 100) : 0}%`}
                    subvalue="Readiness Score"
                    color="text-green-600"
                    bg="bg-green-50"
                />
                <SummaryPanel
                    icon={AlertTriangle}
                    label="Attention Required"
                    value={reportData.filter(d => d.stats.isReady === false).length.toString()}
                    subvalue="Draft Containers"
                    color="text-red-500"
                    bg="bg-red-50"
                />
            </div>
        </div>
    );
};

interface MetricSmallProps {
    label: string;
    value: number;
    color: string;
}

const MetricSmall = ({ label, value, color }: MetricSmallProps) => (
    <div className="flex flex-col items-center min-w-[32px]">
        <span className={cn("text-xs font-black", color)}>{value}</span>
        <span className="text-[8px] font-black uppercase text-slate-300">{label}</span>
    </div>
);

interface SummaryPanelProps {
    icon: React.ElementType;
    label: string;
    value: string;
    subvalue: string;
    color: string;
    bg: string;
}

const SummaryPanel = ({ icon: Icon, label, value, subvalue, color, bg }: SummaryPanelProps) => (
    <div className="p-8 rounded-[2.5rem] bg-white border-2 border-primary/5 shadow-xl shadow-muted/5 flex items-center gap-6 group hover:scale-[1.02] transition-all duration-500">
        <div className={cn("p-4 rounded-2xl shadow-lg group-hover:rotate-6 transition-transform duration-500", bg, color)}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className={cn("text-3xl font-black tracking-tighter", color)}>{value}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]">{subvalue}</span>
            </div>
        </div>
    </div>
);
