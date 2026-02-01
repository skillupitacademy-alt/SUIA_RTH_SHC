'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@quiz/api-client';
import {
    ChevronRight,
    ArrowLeft,
    Home,
    Filter,
    Search,
    Activity,
    ShieldCheck,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { ReportCard } from './ReportCard';
import { cn } from '@/lib/utils';
import { ZLoader } from '@/components/ui/ZLoader';

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

export const HierarchyReports: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any[]>([]);
    const [viewStack, setViewStack] = useState<any[]>([{ level: 'domain', data: [], title: 'Global Domains' }]);
    const [searchQuery, setSearchQuery] = useState('');

    const currentView = viewStack[viewStack.length - 1];

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const data = await apiClient.admin.getContentHealthReport();
            // Transform for consistent display
            const normalizedData = data.map((d: any) => ({
                id: d.domainId,
                name: d.domainName,
                stats: d.stats,
                subjects: d.subjects.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    stats: s.stats,
                    topics: s.topics.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        stats: t.stats,
                        subtopics: t.subtopics.map((st: any) => ({
                            id: st.id,
                            name: st.name,
                            stats: st.stats
                        }))
                    }))
                }))
            }));
            setReportData(normalizedData);
            setViewStack([{ level: 'domain', data: normalizedData, title: 'Global Domains' }]);
        } catch (error) {
            console.error('Failed to fetch report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDrillDown = (item: any, nextLevel: string) => {
        let nextData: any[] = [];
        let title = '';

        if (nextLevel === 'subject') {
            nextData = item.subjects || [];
            title = `Domain: ${item.name}`;
        } else if (nextLevel === 'topic') {
            nextData = item.topics || [];
            title = `Subject: ${item.name}`;
        } else if (nextLevel === 'subtopic') {
            nextData = item.subtopics || [];
            title = `Topic: ${item.name}`;
        }

        setViewStack([...viewStack, { level: nextLevel, data: nextData, title, parentName: item.name }]);
        setSearchQuery('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        if (viewStack.length > 1) {
            setViewStack(viewStack.slice(0, -1));
        }
    };

    const filteredData = currentView.data.filter((item: any) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
                <ZLoader size="xl" />
                <div className="text-center">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-[#1A1A1A]">Synchronizing Repository_</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1 animate-pulse">Scanning Assessment Metrics</p>
                </div>
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
                            <h1 className="text-5xl font-black text-[#1A1A1A] tracking-tighter uppercase italic leading-none">
                                {currentView.level.charAt(0).toUpperCase() + currentView.level.slice(1)} Intelligence_
                            </h1>
                            <div className="flex items-center gap-3 mt-4">
                                <div className="px-3 py-1 bg-[#1A1A1A] text-[#FF4B91] rounded-lg text-[10px] font-black uppercase tracking-widest italic shadow-xl">
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
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                        <input
                            type="text"
                            placeholder="Filter hierarchy..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-primary/5 rounded-3xl text-sm font-bold tracking-tight focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-muted-foreground/30 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={fetchReport}
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

            {/* Grid Container */}
            {filteredData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in slide-in-from-bottom-8 duration-700">
                    {filteredData.map((item: any) => (
                        <ReportCard
                            key={item.id}
                            title={item.name}
                            count={item.stats.total}
                            distribution={item.stats}
                            isReady={item.stats.isReady}
                            level={currentView.level as any}
                            onClick={() => {
                                if (currentView.level === 'domain') handleDrillDown(item, 'subject');
                                else if (currentView.level === 'subject') handleDrillDown(item, 'topic');
                                else if (currentView.level === 'topic') handleDrillDown(item, 'subtopic');
                            }}
                            subtitle={
                                currentView.level === 'domain' ? `${item.subjects?.length || 0} Subjects` :
                                    currentView.level === 'subject' ? `${item.topics?.length || 0} Topics` :
                                        currentView.level === 'topic' ? `${item.subtopics?.length || 0} Subtopics` :
                                            'End of Hierarchy'
                            }
                        />
                    ))}
                </div>
            ) : (
                <div className="py-32 flex flex-col items-center justify-center text-center bg-white rounded-[3rem] border-2 border-dashed border-primary/10 animate-in zoom-in-95 duration-500">
                    <div className="p-8 bg-slate-50 rounded-full mb-8 shadow-inner ring-1 ring-slate-100">
                        <Filter className="text-slate-300 w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-black text-[#1A1A1A] italic uppercase tracking-tighter">Negative Intelligence_</h3>
                    <p className="text-muted-foreground font-medium mt-2 max-w-sm">
                        No containers found matching your filter criteria in this hierarchical branch.
                    </p>
                </div>
            )}

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
                    label="Content Integrity"
                    value={`${Math.round((reportData.filter(d => d.stats.isReady).length / reportData.length) * 100 || 0)}%`}
                    subvalue="Readiness Score"
                    color="text-green-600"
                    bg="bg-green-50"
                />
                <SummaryPanel
                    icon={AlertTriangle}
                    label="Attention Required"
                    value={reportData.filter(d => !d.stats.isReady).length.toString()}
                    subvalue="Draft Containers"
                    color="text-red-500"
                    bg="bg-red-50"
                />
            </div>
        </div>
    );
};

const SummaryPanel = ({ icon: Icon, label, value, subvalue, color, bg }: any) => (
    <div className="p-8 rounded-[2.5rem] bg-white border-2 border-primary/5 shadow-xl shadow-muted/5 flex items-center gap-6 group hover:scale-[1.02] transition-all duration-500">
        <div className={cn("p-4 rounded-2xl shadow-lg group-hover:rotate-6 transition-transform duration-500", bg, color)}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className={cn("text-3xl font-black italic tracking-tighter", color)}>{value}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40">{subvalue}</span>
            </div>
        </div>
    </div>
);
