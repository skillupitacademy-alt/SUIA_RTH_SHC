'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import {
    Activity,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    FileWarning,
    Layers,
    MapPin,
    Target,
    Wand2,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { BlueprintFactoryWizard } from '@/components/content/BlueprintFactoryWizard';
import { HierarchyFactoryWizard } from '@/components/content/HierarchyFactoryWizard';
import { cn } from '@/lib/utils';

export function ContentReadinessBoard() {
    const [domains, setDomains] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
    const [factoryModal, setFactoryModal] = useState<{ isOpen: boolean, initialData: any }>({
        isOpen: false,
        initialData: null
    });
    const [blueprintModal, setBlueprintModal] = useState({ isOpen: false, domainId: '', domainName: '' });

    const fetch = async () => {
        try {
            const data = await apiClient.admin.getContentHealthReport();
            setDomains(data);
        } catch (err) {
            console.error("Failed to fetch content health", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetch();
    }, []);

    const openHealWizard = (nodeType: string, node: any, domainId: string, domainName?: string) => {
        let template: any = { domainId };

        // Smart Context Construction
        // We use available names to pre-fill the hierarchy so the factory touches the right nodes.
        if (nodeType === 'domain') {
            template = {
                target: 'subject',
                domainId: node.domainId,
                domainName: node.domainName,
                subjects: []
            };
        } else if (nodeType === 'subject') {
            template = {
                target: 'topic',
                domainId,
                domainName: domainName, // Passed from parent
                subjects: [{
                    id: node.id,
                    name: node.name,
                    topics: []
                }]
            };
        } else if (nodeType === 'topic') {
            template = {
                target: 'subtopic',
                domainId,
                domainName: domainName,
                subjects: [{
                    id: node.subjectId,
                    name: node.subjectName || "PARENT_SUBJECT",
                    topics: [{
                        id: node.id,
                        name: node.name,
                        questions: [] // Explicitly setting this encourages question filling
                    }]
                }]
            };
        }

        setFactoryModal({ isOpen: true, initialData: template });
    };

    const toggleNode = (id: string) => {
        setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (isLoading) return (
        <div className="p-20">
            <ZLoader size="lg" text="Syncing Content Health_" />
        </div>
    );

    const filteredDomains = domains.filter(d =>
        d.domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.subjects?.some((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const readyDomainsCount = domains.filter(d => d.isReady).length;

    return (
        <div className="p-8 rounded-[2rem] border border-primary/10 bg-muted/5 backdrop-blur-md shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1A1A1A]">Enterprise Governance</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Hierarchical Readiness Audit • Domain to Subtopic</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={() => setFactoryModal({ isOpen: true, initialData: { target: 'domain' } })}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <Zap size={14} className="text-[#FF4B91]" />
                        <span>Add Domain Factory</span>
                    </button>
                    <div className="w-px h-8 bg-black/5 hidden xl:block" />
                    <div className="relative w-full xl:w-[300px]">
                        <input
                            type="text"
                            placeholder="SEARCH_HIERARCHY..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-primary/5 rounded-xl px-4 py-2 text-[10px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-300 focus:ring-2 focus:ring-[#FF4B91]/10 outline-none shadow-sm"
                        />
                    </div>
                    <div className="px-5 py-2 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-2 flex-shrink-0">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span className="text-[11px] font-black text-green-600 uppercase tracking-widest">{readyDomainsCount} Domains Ready</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-3 custom-scrollbar">
                {filteredDomains.map((domain: any) => (
                    <div key={domain.domainId} className="space-y-2">
                        {/* Domain Row */}
                        <div
                            onClick={() => toggleNode(domain.domainId)}
                            className={cn(
                                "p-5 rounded-3xl border transition-all cursor-pointer group flex items-center justify-between shadow-sm",
                                domain.isReady ? "bg-white border-primary/10 hover:border-primary/30" : "bg-red-500/[0.02] border-red-500/20 hover:border-red-500/40"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "p-2 rounded-xl border",
                                    domain.isReady ? "bg-primary/5 text-primary border-primary/10" : "bg-red-500/10 text-red-500 border-red-500/20"
                                )}>
                                    {domain.isReady ? <Layers size={20} /> : <FileWarning size={20} />}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black tracking-tight text-[#1A1A1A] flex items-center gap-2">
                                        {domain.domainName}
                                        {domain.isReady ? (
                                            <span className="text-[9px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full uppercase">Ready</span>
                                        ) : (
                                            <span className="text-[9px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full uppercase">Action Required</span>
                                        )}
                                    </h4>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-1">
                                        {domain.subjects?.length || 0} Subjects • {domain.hasBlueprint ? "Blueprint Active" : "Blueprint Missing"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="hidden md:grid grid-cols-3 gap-2 w-[180px]">
                                    <StatsBadge label="S" val={domain.stats.simple} target={4} />
                                    <StatsBadge label="I" val={domain.stats.intermediate} target={4} />
                                    <StatsBadge label="E" val={domain.stats.expert} target={5} />
                                </div>
                                <div className="flex items-center gap-2 w-[140px] justify-end">
                                    {!domain.hasBlueprint ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setBlueprintModal({ isOpen: true, domainId: domain.domainId, domainName: domain.domainName }); }}
                                            className="px-4 py-2 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/10 flex items-center gap-2"
                                        >
                                            <Zap size={12} /> Configure
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setBlueprintModal({ isOpen: true, domainId: domain.domainId, domainName: domain.domainName }); }}
                                            className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all border border-slate-200"
                                            title="Edit Blueprint"
                                        >
                                            <Activity size={16} />
                                        </button>
                                    )}
                                    {!domain.isReady && (domain.subjects?.length === 0) && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openHealWizard('domain', domain, domain.domainId); }}
                                            className="p-2.5 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-all border border-red-500/10"
                                            title="Atomic Repair Domain"
                                        >
                                            <Wand2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="w-8 flex justify-center">
                                    {expandedNodes[domain.domainId] ? <ChevronDown size={20} className="text-muted-foreground" /> : <ChevronRight size={20} className="text-muted-foreground" />}
                                </div>
                            </div>
                        </div>

                        {/* Subjects Drill-down */}
                        {expandedNodes[domain.domainId] && (
                            <div className="ml-8 space-y-2 border-l-2 border-primary/5 pl-4 animate-in slide-in-from-top-2 duration-300">
                                {domain.subjects?.map((subject: any) => (
                                    <div key={subject.id} className="space-y-2">
                                        <div
                                            onClick={(e) => { e.stopPropagation(); toggleNode(subject.id); }}
                                            className={cn(
                                                "p-4 rounded-2xl border bg-white/50 flex items-center justify-between hover:bg-white cursor-pointer transition-all",
                                                subject.stats.isReady ? "border-primary/5" : "border-red-500/10 bg-red-500/[0.01]"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <BookOpen size={16} className={subject.stats.isReady ? "text-primary/40" : "text-red-500/40"} />
                                                <span className="text-xs font-black text-[#1A1A1A] uppercase tracking-wider">{subject.name}</span>
                                                <ReadyIndicator isReady={subject.stats.isReady} />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="grid grid-cols-3 gap-1.5 transform scale-90">
                                                    <StatsBadge label="S" val={subject.stats.simple} target={4} />
                                                    <StatsBadge label="I" val={subject.stats.intermediate} target={4} />
                                                    <StatsBadge label="E" val={subject.stats.expert} target={5} />
                                                </div>
                                                {!subject.stats.isReady && (subject.topics?.length === 0) && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openHealWizard('subject', subject, domain.domainId, domain.domainName); }}
                                                        className="p-1.5 rounded-lg bg-red-500/5 text-red-500 hover:bg-red-500/10 border border-red-500/5"
                                                    >
                                                        <Zap size={12} />
                                                    </button>
                                                )}
                                                {expandedNodes[subject.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </div>
                                        </div>

                                        {/* Topics Drill-down */}
                                        {expandedNodes[subject.id] && (
                                            <div className="ml-6 space-y-1.5 border-l border-primary/10 pl-4 animate-in slide-in-from-top-1">
                                                {subject.topics?.map((topic: any) => (
                                                    <div key={topic.id} className="space-y-1.5">
                                                        <div
                                                            onClick={(e) => { e.stopPropagation(); toggleNode(topic.id); }}
                                                            className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 cursor-pointer group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Target size={14} className="text-muted-foreground" />
                                                                <span className="text-[11px] font-bold text-slate-600">{topic.name}</span>
                                                                <ReadyIndicator isReady={topic.stats.isReady} />
                                                            </div>
                                                            <div className="flex items-center gap-3 scale-75 origin-right">
                                                                <StatsBadge label="S" val={topic.stats.simple} target={4} />
                                                                <StatsBadge label="I" val={topic.stats.intermediate} target={4} />
                                                                <StatsBadge label="E" val={topic.stats.expert} target={5} />
                                                                {!topic.stats.isReady && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); openHealWizard('topic', { ...topic, subjectName: subject.name }, domain.domainId, domain.domainName); }}
                                                                        className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                                    >
                                                                        <Zap size={10} />
                                                                    </button>
                                                                )}
                                                                {expandedNodes[topic.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                            </div>
                                                        </div>

                                                        {/* Subtopics Drill-down */}
                                                        {expandedNodes[topic.id] && (
                                                            <div className="ml-6 space-y-1 pl-4">
                                                                {topic.subtopics?.map((sub: any) => (
                                                                    <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-[10px]">
                                                                        <div className="flex items-center gap-2">
                                                                            <MapPin size={10} className="text-muted-foreground" />
                                                                            <span className="font-medium text-muted-foreground uppercase tracking-tight">{sub.name}</span>
                                                                            <ReadyIndicator isReady={sub.stats.isReady} minimal />
                                                                        </div>
                                                                        <div className="flex items-center gap-2 scale-75 origin-right">
                                                                            <span className={cn(sub.stats.simple < 4 ? "text-red-500" : "text-green-600")}>S:{sub.stats.simple}</span>
                                                                            <span className={cn(sub.stats.intermediate < 4 ? "text-red-500" : "text-green-600")}>I:{sub.stats.intermediate}</span>
                                                                            <span className={cn(sub.stats.expert < 5 ? "text-red-500" : "text-green-600")}>E:{sub.stats.expert}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <HierarchyFactoryWizard
                isOpen={factoryModal.isOpen}
                initialData={factoryModal.initialData}
                onClose={() => setFactoryModal({ isOpen: false, initialData: null })}
                onSuccess={fetch}
            />

            <BlueprintFactoryWizard
                isOpen={blueprintModal.isOpen}
                domainId={blueprintModal.domainId}
                domainName={blueprintModal.domainName}
                onClose={() => setBlueprintModal({ ...blueprintModal, isOpen: false })}
                onSuccess={fetch}
            />
        </div>
    );
}

function StatsBadge({ label, val, target }: { label: string, val: number, target: number }) {
    const isLow = val < target;
    return (
        <div className={cn(
            "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all flex items-center gap-1 min-w-[38px] justify-center",
            isLow ? "bg-red-500/10 text-red-600 border border-red-500/10" : "bg-green-500/5 text-green-600 border border-green-500/10"
        )}>
            <span>{label}</span>
            <span className="">{val}/{target}</span>
        </div>
    );
}

function ReadyIndicator({ isReady, minimal = false }: { isReady: boolean, minimal?: boolean }) {
    if (minimal) {
        return <div className={cn("w-1.5 h-1.5 rounded-full", isReady ? "bg-green-500" : "bg-red-500")} />;
    }
    return (
        <span className={cn(
            "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest",
            isReady ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
        )}>
            {isReady ? "READY" : "POOR_POOL"}
        </span>
    );
}
