'use client';

import { useState } from 'react';
import { QuestionTable } from '@/components/questions/QuestionTable';
import { DomainTable } from '@/components/questions/DomainTable';
import { SubjectTable } from '@/components/questions/SubjectTable';
import { TopicTable } from '@/components/questions/TopicTable';
import { SubtopicTable } from '@/components/questions/SubtopicTable';
import { SkillTable } from '@/components/questions/SkillTable';
import Link from 'next/link';
import { Database, FolderTree, BookOpen, Layers, Hash, GitBranch, Award, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';


export default function QuestionsPage() {
    const [activeTab, setActiveTab] = useState<'domains' | 'subjects' | 'topics' | 'subtopics' | 'questions' | 'skills'>('domains');

    return (
        <div className="space-y-10 pb-24">
            {/* 1. Header Section - Stacked Header */}
            <div className="flex flex-col gap-6 pb-10 border-b-2 border-primary/5">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-[#FF4B91]/10 text-[#FF4B91]">
                                <Database size={18} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF4B91]/80">Vault_Control // Matrix_v2</span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter italic uppercase text-[#1A1A1A] leading-none">
                            Asset <span className="text-[#FF4B91]">Bank</span>
                        </h1>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
                            <span>Hierarchy</span>
                            <span className="w-1 h-1 rounded-full bg-primary/20" />
                            <span>Difficulty</span>
                            <span className="w-1 h-1 rounded-full bg-primary/20" />
                            <span>Governance</span>
                        </p>
                    </div>
                    <Link
                        href="/questions/new"
                        className="group relative px-8 py-5 rounded-[2rem] bg-[#1A1A1A] text-white overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/20 h-fit"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FF4B91] to-[#ff3382] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative flex items-center gap-3">
                            <Plus size={20} className="text-[#FF4B91] group-hover:text-white transition-colors" />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Deploy_New_Asset</span>
                        </div>
                    </Link>
                </div>
            </div>

            {/* 2. Management Console - One Below header */}
            <div className="bg-white/50 backdrop-blur-xl border border-primary/10 rounded-[3rem] p-3 shadow-2xl">
                <div className="flex gap-2 flex-wrap items-center">
                    {[
                        { id: 'domains', label: 'Domains', icon: Layers },
                        { id: 'subjects', label: 'Subjects', icon: BookOpen },
                        { id: 'topics', label: 'Topics', icon: Hash },
                        { id: 'subtopics', label: 'Subtopics', icon: GitBranch },
                        { id: 'questions', label: 'Bank', icon: Database },
                        { id: 'skills', label: 'Mastery', icon: Award },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex-1 min-w-[140px] px-6 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 border-2",
                                    isActive
                                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-2xl shadow-primary/20 scale-[1.05] z-10"
                                        : "bg-transparent text-muted-foreground border-transparent hover:bg-primary/5 hover:text-[#1A1A1A]"
                                )}
                            >
                                <Icon size={16} className={cn(isActive ? "text-[#FF4B91]" : "text-primary/40")} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Data Tier - One Below Console */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="relative">
                    {/* Decorative Background Elements */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -z-10" />

                    {activeTab === 'domains' && <DomainTable />}
                    {activeTab === 'subjects' && <SubjectTable />}
                    {activeTab === 'topics' && <TopicTable />}
                    {activeTab === 'subtopics' && <SubtopicTable />}
                    {activeTab === 'questions' && <QuestionTable />}
                    {activeTab === 'skills' && <SkillTable />}
                </div>
            </div>
        </div>
    );
}
